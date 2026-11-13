// Contador de cofres de Spritedex (Beta).
//
// Servicio propio, sin apps externas: el usuario toca +1 por cada cofre que abre y todo se
// guarda en este navegador. Tiene dos vistas:
//   Individual: total, hoy, sesión y Token Pirata.
//   Equipo: plantilla de jugadores, contador por jugador y total del equipo.
// Con sesión se sincroniza en la nube; sin sesión funciona igual en local.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t, getLang } from '../i18n';
import { safeStorage } from '../utils/safeStorage';
import { useCofresCloud } from '../hooks/useCofresCloud';
import {
  estadoInicial,
  normalizar,
  aplicar,
  sumarCofres,
  alternarToken,
  reiniciarSesion,
  deshacerUltimo
} from '../utils/cofresManual.js';
import {
  equipoInicial,
  agregarJugador,
  quitarJugador,
  seleccionarJugador,
  sumarJugador,
  jugadorActivo,
  totalEquipo,
  hoyEquipo,
  diasEquipo,
  topEquipo
} from '../utils/cofresEquipo.js';
import { EquipoCompartido } from './EquipoCompartido';
import { useEquipoCompartido } from '../hooks/useEquipoCompartido';

const CLAVE = 'spritedex_cofres_v1';
const CLAVE_VISTA = 'spritedex_cofres_vista';
const DIA_MS = 24 * 60 * 60 * 1000;

const numero = (valor, lang) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(valor || 0);

function claveDia(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function leerGuardado() {
  try {
    return normalizar(JSON.parse(safeStorage.getItem(CLAVE) || 'null'));
  } catch {
    return estadoInicial();
  }
}

function Barra({ valor, maximo, etiqueta }) {
  const alto = Math.max(valor > 0 ? 4 : 1, Math.round((valor / Math.max(1, maximo)) * 100));
  return <span className={`cc-bar ${valor > 0 ? '' : 'is-empty'}`} style={{ height: alto + '%' }} title={etiqueta} />;
}

export function CofresPage({ user, onOpenAuth }) {
  const lang = getLang();
  const [cofres, setCofres] = useState(leerGuardado);
  const [vista, setVista] = useState(() => (safeStorage.getItem(CLAVE_VISTA) === 'equipo' ? 'equipo' : 'individual'));
  const [entrada, setEntrada] = useState('');
  const [nuevoJugador, setNuevoJugador] = useState('');
  const tituloRef = useRef(null);
  const sync = useCofresCloud({ user, cofres, setCofres });
  const equipoShared = useEquipoCompartido(user);

  useEffect(() => {
    if (tituloRef.current) tituloRef.current.focus();
  }, []);

  function guardar(siguiente) {
    setCofres(siguiente);
    safeStorage.setItem(CLAVE, JSON.stringify(siguiente));
  }

  function cambiarVista(siguiente) {
    setVista(siguiente);
    safeStorage.setItem(CLAVE_VISTA, siguiente);
  }

  function sumar(cantidad) {
    if (vista === 'equipo') {
      const activo = jugadorActivo(cofres.equipo);
      if (!activo) return;
      guardar(aplicar(cofres, { equipo: sumarJugador(cofres.equipo, activo.id, cantidad, claveDia()) }));
      return;
    }
    guardar(sumarCofres(cofres, cantidad, claveDia()));
  }

  function deshacer() {
    guardar(deshacerUltimo(cofres));
  }

  function nuevaSesion() {
    guardar(reiniciarSesion(cofres));
  }

  function marcarToken() {
    guardar(alternarToken(cofres, claveDia()));
  }

  function sumaManual(evento) {
    evento.preventDefault();
    const cantidad = Math.floor(Number(entrada));
    if (!Number.isFinite(cantidad) || cantidad <= 0) return;
    sumar(cantidad);
    setEntrada('');
  }

  function reiniciar() {
    const mensaje = vista === 'equipo' ? t('chest.teamResetConfirm') : t('chest.resetConfirm');
    if (typeof window !== 'undefined' && !window.confirm(mensaje)) return;
    if (vista === 'equipo') {
      guardar(aplicar(cofres, { equipo: equipoInicial() }));
    } else {
      guardar(aplicar(cofres, { total: 0, sesion: 0, token: false, tokenFecha: null, dias: {} }));
    }
  }

  function agregarMiembro(evento) {
    evento.preventDefault();
    const nombre = nuevoJugador.trim();
    if (!nombre) return;
    guardar(aplicar(cofres, { equipo: agregarJugador(cofres.equipo, nombre) }));
    setNuevoJugador('');
  }

  function quitarMiembro(id) {
    guardar(aplicar(cofres, { equipo: quitarJugador(cofres.equipo, id) }));
  }

  function seleccionarMiembro(id) {
    guardar({ ...cofres, equipo: seleccionarJugador(cofres.equipo, id) });
  }

  const hoy = claveDia();
  const esEquipo = vista === 'equipo';
  const equipo = cofres.equipo || equipoInicial();
  const activo = jugadorActivo(equipo);
  const equipoTotal = totalEquipo(equipo);
  const equipoHoy = hoyEquipo(equipo, hoy);
  const equipoDias = diasEquipo(equipo);
  const equipoTop = topEquipo(equipo);
  const diasBase = esEquipo ? equipoDias : cofres.dias;
  const totalBase = esEquipo ? equipoTotal : cofres.total;
  const hoyBase = esEquipo ? equipoHoy : (Number(cofres.dias[hoy]) || 0);
  const entradas = Object.entries(diasBase).filter(([, n]) => Number(n) > 0);
  const mejorDia = entradas.map(([dia, n]) => ({ dia, cofres: Number(n) }))
    .sort((a, b) => b.cofres - a.cofres)[0] || null;
  const diasJugados = entradas.length;
  const mediaDia = diasJugados ? totalBase / diasJugados : 0;

  const serie = useMemo(() => {
    const salida = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(base.getTime() - i * DIA_MS);
      const clave = claveDia(fecha);
      salida.push({ clave, fecha, cofres: Number(diasBase[clave]) || 0 });
    }
    return salida;
  }, [diasBase]);
  const maxSerie = Math.max(1, ...serie.map((d) => d.cofres));
  const fmtDia = (fecha) => new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit' }).format(fecha);

  return (
    <main className="cc-page" aria-labelledby="cc-titulo">
      <section className="cc-hero">
        <img className="cc-hero__icon" src="/cofre-max-oro.webp" alt="" width="112" height="100" />
        <div className="cc-hero__text">
          <div className="cc-hero__top">
            <span className="cc-kicker">{t('chest.kicker')}</span>
            <span className="cc-beta">{t('chest.beta')}</span>
          </div>
          <h1 id="cc-titulo" className="cc-title" ref={tituloRef} tabIndex={-1}>{t('chest.pageTitle')}</h1>
          <p className="cc-lead">{t('chest.lead')}</p>
        </div>
      </section>

      <section className="cc-general">
        <div>
          <span className="cc-general__label">{t('chest.generalTitle')}</span>
          <strong>{numero(cofres.total + (user ? equipoShared.aporteEquipos : 0), lang)}</strong>
          <small>{t('chest.generalNote')}</small>
          {user && equipoShared.error && <small>{t('chest.generalTeamsError')}</small>}
        </div>
        <div className="cc-general__split">
          <div><b>{numero(cofres.total, lang)}</b><span>{t('chest.generalIndividual')}</span></div>
          <div><b>{numero(user ? equipoShared.aporteEquipos : 0, lang)}</b><span>{t('chest.generalTeams')}</span></div>
          {user && equipoShared.equiposCount > 0 && (
            <div><b>{equipoShared.equiposCount}</b><span>{t('chest.generalTeamCount')}</span></div>
          )}
        </div>
        {!user && (
          <button type="button" className="cc-sync__link" onClick={onOpenAuth}>{t('chest.generalLogin')}</button>
        )}
      </section>

      {!esEquipo && (
        <section className={`cc-token ${cofres.token ? 'is-found' : ''}`}>
          <img className="cc-token__mark" src="/token-pirata.svg" alt="" width="52" height="52" />
          <div>
            <h2>{t('chest.token')}</h2>
            <strong>{cofres.token ? t('chest.tokenYes') : t('chest.tokenNo')}</strong>
            <p>{cofres.token
              ? t('chest.tokenYesManualNote')
              : t('chest.tokenNoManualNote', { n: numero(cofres.total, lang) })}</p>
          </div>
          <span className="cc-token__meta">{t('chest.tokenHint')}</span>
        </section>
      )}

      <section className="cc-manual">
        <div className="cc-vista" role="tablist" aria-label={t('chest.modesAria')}>
          <button type="button" role="tab" aria-selected={!esEquipo}
            className={!esEquipo ? 'is-active' : ''} onClick={() => cambiarVista('individual')}>
            {t('chest.modeIndividual')}
          </button>
          <button type="button" role="tab" aria-selected={esEquipo}
            className={esEquipo ? 'is-active' : ''} onClick={() => cambiarVista('equipo')}>
            {t('chest.modeTeam')}
          </button>
        </div>

        {esEquipo && user ? (
          <EquipoCompartido user={user} estado={equipoShared} />
        ) : (
          <>

        {esEquipo && (
          <div className="cc-team">
            <form className="cc-team-add" onSubmit={agregarMiembro}>
              <label htmlFor="cc-team-name">{t('chest.teamAddLabel')}</label>
              <div className="cc-team-add__row">
                <input
                  id="cc-team-name"
                  type="text"
                  maxLength={24}
                  value={nuevoJugador}
                  onChange={(e) => setNuevoJugador(e.target.value)}
                  placeholder={t('chest.teamAddPlaceholder')}
                />
                <button type="submit" className="cc-btn cc-btn--primary">{t('chest.teamAdd')}</button>
              </div>
            </form>

            {equipo.jugadores.length === 0 ? (
              <p className="cc-note">{t('chest.teamEmpty')}</p>
            ) : (
              <ul className="cc-team-list">
                {equipo.jugadores.map((j) => (
                  <li key={j.id} className={`cc-team-player ${j.id === equipo.activoId ? 'is-active' : ''}`}>
                    <button
                      type="button"
                      className="cc-team-player__select"
                      onClick={() => seleccionarMiembro(j.id)}
                      aria-pressed={j.id === equipo.activoId}
                    >
                      <span className="cc-team-player__name">{j.nombre}</span>
                      <span className="cc-team-player__count">{numero(j.total, lang)}</span>
                      <span className="cc-team-player__today">{t('chest.today')}: {numero(Number(j.dias[hoy]) || 0, lang)}</span>
                    </button>
                    <button
                      type="button"
                      className="cc-team-player__remove"
                      onClick={() => quitarMiembro(j.id)}
                      aria-label={`${t('chest.teamRemove')} ${j.nombre}`}
                    >×</button>
                  </li>
                ))}
              </ul>
            )}
            {activo && <p className="cc-team__active">{t('chest.teamActive', { nombre: activo.nombre })}</p>}
          </div>
        )}

        <div className="cc-manual__count">
          <span>{esEquipo ? t('chest.teamTotal') : t('chest.total')}</span>
          <strong>{numero(esEquipo ? equipoTotal : cofres.total, lang)}</strong>
          <small>
            {esEquipo
              ? `${t('chest.teamToday')}: ${numero(equipoHoy, lang)} · ${equipo.jugadores.length} ${t('chest.teamPlayers').toLowerCase()}`
              : `${t('chest.today')}: ${numero(hoyBase, lang)} · ${t('chest.session')}: ${numero(cofres.sesion, lang)}`}
          </small>
        </div>

        <div className="cc-manual__buttons">
          <button type="button" className="cc-btn cc-btn--gold" onClick={() => sumar(1)} disabled={esEquipo && !activo}>{t('chest.add1')}</button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => sumar(5)} disabled={esEquipo && !activo}>{t('chest.add5')}</button>
          <button
            type="button"
            className="cc-btn cc-btn--ghost"
            onClick={deshacer}
            disabled={!cofres.historial?.length}
            title={t('chest.undoHint')}
          >{t('chest.undo')}</button>
          {!esEquipo && <button type="button" className="cc-btn cc-btn--ghost" onClick={marcarToken}>{t('chest.manualToken')}</button>}
          {!esEquipo && <button type="button" className="cc-btn cc-btn--ghost" onClick={nuevaSesion}>{t('chest.newSession')}</button>}
          <button type="button" className="cc-btn cc-btn--ghost cc-btn--danger" onClick={reiniciar}>
            {esEquipo ? t('chest.teamReset') : t('chest.reset')}
          </button>
        </div>

        <form className="cc-manual__form" onSubmit={sumaManual}>
          <label htmlFor="cc-manual-amount">{t('chest.manualAmountLabel')}</label>
          <div className="cc-manual__form-row">
            <input
              id="cc-manual-amount"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder={t('chest.manualAmountPlaceholder')}
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
            />
            <button type="submit" className="cc-btn cc-btn--primary" disabled={esEquipo && !activo}>{t('chest.manualAmountAdd')}</button>
          </div>
          <p className="cc-note">{t('chest.manualAmountHint')}</p>
        </form>

        <p className="cc-manual__note">{t('chest.manualBody')}</p>
        {!esEquipo && <p className="cc-manual__note">{t('chest.sessionHelp')}</p>}
        <p className="cc-note">{esEquipo ? t('chest.teamTokenNote') : t('chest.manualTokenNote')}</p>

        <div className="cc-sync" aria-live="polite">
          {!user ? (
            <>
              <span className="cc-sync__dot" />
              <span className="cc-sync__message">{t('chest.syncLocal')}</span>
              <button type="button" className="cc-sync__link" onClick={onOpenAuth}>{t('chest.syncLogin')}</button>
            </>
          ) : user.is_anonymous ? (
            <>
              <span className={`cc-sync__dot ${sync === 'synced' ? 'is-ok' : ''}`} />
              <span className="cc-sync__message">{sync === 'syncing' ? t('chest.syncSyncing') : sync === 'synced' ? t('chest.syncGuest') : t('chest.syncLocal')}</span>
              <button type="button" className="cc-sync__link" onClick={onOpenAuth}>{t('chest.syncLink')}</button>
            </>
          ) : (
            <>
              <span className={`cc-sync__dot ${sync === 'synced' ? 'is-ok' : ''}`} />
              <span className="cc-sync__message">{sync === 'syncing' ? t('chest.syncSyncing') : sync === 'synced' ? t('chest.syncDone') : t('chest.syncLocal')}</span>
            </>
          )}
        </div>
          </>
        )}
      </section>

      {(!esEquipo || !user) && (
      <section className="cc-kpis">
        <div className="cc-kpi"><span>{t('chest.daysPlayed')}</span><strong>{numero(diasJugados, lang)}</strong></div>
        <div className="cc-kpi"><span>{t('chest.averageDay')}</span><strong>{numero(mediaDia, lang)}</strong></div>
        <div className="cc-kpi"><span>{t('chest.bestDay')}</span><strong>{mejorDia ? numero(mejorDia.cofres, lang) : '—'}</strong>{mejorDia && <small>{mejorDia.dia}</small>}</div>
        {esEquipo && (
          <div className="cc-kpi">
            <span>{t('chest.teamTop')}</span>
            <strong>{equipoTop ? numero(equipoTop.total, lang) : '—'}</strong>
            {equipoTop && <small>{equipoTop.nombre}</small>}
          </div>
        )}
      </section>
      )}

      {(!esEquipo || !user) && (
      <section className="cc-card">
        <div className="cc-card__head">
          <h2>{t('chest.chart')}</h2>
          <span>{t('chest.last14')}</span>
        </div>
        <div className="cc-chart" role="img" aria-label={t('chest.chart')}>
          {serie.map((d, i) => (
            <div className="cc-chart__col" key={d.clave}>
              <Barra valor={d.cofres} maximo={maxSerie} etiqueta={`${fmtDia(d.fecha)} · ${d.cofres}`} />
              {(i % 3 === 0 || i === serie.length - 1) && <em>{fmtDia(d.fecha)}</em>}
            </div>
          ))}
        </div>
      </section>
      )}

      {(!esEquipo || !user) && (
        <section className="cc-card">
          <div className="cc-card__head">
            <h2>{t('chest.historyTitle')}</h2>
            <span>{entradas.length} {t('chest.daysPlayed').toLowerCase()}</span>
          </div>
          {entradas.length === 0 ? (
            <p className="cc-note">{t('chest.historyEmpty')}</p>
          ) : (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>{t('chest.date')}</th>
                    <th className="r">{t('chest.chests')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...entradas].sort((a, b) => b[0].localeCompare(a[0])).map(([dia, cantidad]) => (
                    <tr key={dia}>
                      <td>{dia}</td>
                      <td className="r">{numero(cantidad, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="cc-source">
        <h2>{t('chest.howTitle')}</h2>
        <ol className="cc-steps">
          <li>{t('chest.how1')}</li>
          <li>{t('chest.how2')}</li>
          <li>{t('chest.how3')}</li>
        </ol>
        <p className="cc-note">{t('chest.betaNote')}</p>
        <p className="cc-note">{t('chest.disclaimer')}</p>
      </section>
    </main>
  );
}
