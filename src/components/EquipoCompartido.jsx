// Equipo compartido en tiempo real. Cada jugador entra con su cuenta; la RPC solo deja
// sumar/restar su propia fila y Realtime refresca los totales del equipo.
import React, { useMemo, useState } from 'react';
import { t, getLang } from '../i18n';
import { useEquipoCompartido } from '../hooks/useEquipoCompartido';

const DIA_MS = 24 * 60 * 60 * 1000;
const numero = (valor, lang) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(valor || 0);

function hoyClave(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function Barra({ valor, maximo, etiqueta }) {
  const alto = Math.max(valor > 0 ? 4 : 1, Math.round((valor / Math.max(1, maximo)) * 100));
  return <span className={`cc-bar ${valor > 0 ? '' : 'is-empty'}`} style={{ height: alto + '%' }} title={etiqueta} />;
}

function nombrePorDefecto(user) {
  return user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Jugador';
}

export function EquipoCompartido({ user }) {
  const lang = getLang();
  const {
    equipo, miembros, pasados, cargando, error, enVivo, miembro,
    crear, unir, salir, sumar, deshacer, puedeDeshacer
  } = useEquipoCompartido(user);
  const [nombreEquipo, setNombreEquipo] = useState('Mi equipo');
  const [nombreJugador, setNombreJugador] = useState(() => nombrePorDefecto(user));
  const [codigo, setCodigo] = useState('');
  const [entrada, setEntrada] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [accion, setAccion] = useState(false);

  const hoy = hoyClave();
  const activos = miembros.filter((m) => !m.leftAt);
  const historial = miembros.filter((m) => m.leftAt);
  const total = activos.reduce((n, m) => n + m.total, 0);
  const hoyTotal = activos.reduce((n, m) => n + (Number(m.dias[hoy]) || 0), 0);
  const top = activos.reduce((mejor, m) => (!mejor || m.total > mejor.total ? m : mejor), null);
  const dias = useMemo(() => {
    const mapa = {};
    for (const m of activos) {
      for (const [dia, n] of Object.entries(m.dias || {})) mapa[dia] = (Number(mapa[dia]) || 0) + (Number(n) || 0);
    }
    return mapa;
  }, [activos]);
  const serie = useMemo(() => {
    const salida = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(base.getTime() - i * DIA_MS);
      const clave = hoyClave(fecha);
      salida.push({ clave, fecha, cofres: Number(dias[clave]) || 0 });
    }
    return salida;
  }, [dias]);
  const maxSerie = Math.max(1, ...serie.map((d) => d.cofres));
  const fmtDia = (fecha) => new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit' }).format(fecha);

  async function crearEquipo(evento) {
    evento.preventDefault();
    setAccion(true);
    await crear(nombreEquipo.trim(), nombreJugador.trim());
    setAccion(false);
  }

  async function unirEquipo(evento) {
    evento.preventDefault();
    if (!codigo.trim()) return;
    setAccion(true);
    await unir(codigo.trim(), nombreJugador.trim());
    setAccion(false);
  }

  async function salirEquipo() {
    if (typeof window !== 'undefined' && !window.confirm(t('team.leaveConfirm'))) return;
    setAccion(true);
    await salir();
    setAccion(false);
  }

  async function volverAEquipo(pasado) {
    if (!pasado.codigo) return;
    setAccion(true);
    await unir(pasado.codigo, nombreJugador.trim());
    setAccion(false);
  }

  function copiarCodigo() {
    if (!equipo) return;
    try {
      navigator.clipboard?.writeText(equipo.code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setCopiado(false);
    }
  }

  function sumaManual(evento) {
    evento.preventDefault();
    const cantidad = Math.floor(Number(entrada));
    if (!Number.isFinite(cantidad) || cantidad <= 0 || !miembro) return;
    sumar(cantidad);
    setEntrada('');
  }

  if (!user) return null;

  if (cargando) {
    return (
      <div className="cc-shared">
        <p className="cc-shared__loading">{t('team.loading')}</p>
      </div>
    );
  }

  if (error && !equipo) {
    const migracion = /does not exist|relation|schema cache|could not find the table/i.test(error);
    return (
      <div className="cc-shared">
        <h2>{t('team.sharedTitle')}</h2>
        <p className="cc-error">{t('team.error')}</p>
        <p className="cc-note">{migracion ? t('team.migration') : error}</p>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="cc-shared">
        <div className="cc-shared__intro">
          <h2>{t('team.sharedTitle')}</h2>
          <p>{t('team.sharedLead')}</p>
        </div>

        <label className="cc-shared__name">
          {t('team.displayName')}
          <input
            type="text"
            maxLength={24}
            value={nombreJugador}
            onChange={(e) => setNombreJugador(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
        </label>

        <div className="cc-shared__grid">
          <form className="cc-shared__card" onSubmit={crearEquipo}>
            <h3>{t('team.createTitle')}</h3>
            <label>
              {t('team.createName')}
              <input
                type="text"
                maxLength={30}
                value={nombreEquipo}
                onChange={(e) => setNombreEquipo(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <button type="submit" className="cc-btn cc-btn--gold" disabled={accion || !nombreJugador.trim()}>
              {t('team.create')}
            </button>
          </form>

          <form className="cc-shared__card" onSubmit={unirEquipo}>
            <h3>{t('team.joinTitle')}</h3>
            <label>
              {t('team.code')}
              <input
                type="text"
                maxLength={8}
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="AB12CD34"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, ''))}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <button type="submit" className="cc-btn cc-btn--primary" disabled={accion || !codigo.trim() || !nombreJugador.trim()}>
              {t('team.join')}
            </button>
          </form>
        </div>

        {pasados.length > 0 && (
          <div className="cc-shared__past">
            <h3>{t('team.pastTitle')}</h3>
            <ul className="cc-shared__past-list">
              {pasados.map((p) => (
                <li key={`${p.teamId}-${p.leftAt}`} className="cc-shared__past-row">
                  <div>
                    <b>{p.nombre}</b>
                    <span>{p.codigo}{p.archivado ? ` · ${t('team.archived')}` : ''}</span>
                    <small>{t('team.total')}: {numero(p.total, lang)} · {t('team.leftAt')} {new Intl.DateTimeFormat(lang, { day: '2-digit', month: 'short' }).format(new Date(p.leftAt))}</small>
                  </div>
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost"
                    onClick={() => volverAEquipo(p)}
                    disabled={accion || !p.codigo}
                  >{t('team.rejoin')}</button>
                </li>
              ))}
            </ul>
            <p className="cc-note">{t('team.historyNote')}</p>
          </div>
        )}

        <p className="cc-note">{t('team.sharedNote')}</p>
      </div>
    );
  }

  return (
    <div className="cc-shared">
      <div className="cc-shared__head">
        <div>
          <span className="cc-shared__kicker">{t('team.sharedTitle')}</span>
          <h2>{equipo.name}</h2>
          <button type="button" className="cc-shared__code" onClick={copiarCodigo} title={t('team.copy')}>
            {equipo.code} <span>{copiado ? t('team.copied') : t('team.copy')}</span>
          </button>
        </div>
        <div className="cc-shared__head-actions">
          <span className={`cc-shared__status ${enVivo ? 'is-live' : ''}`}>
            <span className="cc-shared__dot" />
            {enVivo ? t('team.live') : t('team.connecting')}
          </span>
          <button type="button" className="cc-btn cc-btn--ghost cc-btn--danger" onClick={salirEquipo} disabled={accion}>
            {t('team.leave')}
          </button>
        </div>
      </div>

      <div className="cc-manual__count">
        <span>{t('team.total')}</span>
        <strong>{numero(total, lang)}</strong>
        <small>{t('team.today')}: {numero(hoyTotal, lang)} · {activos.length} {t('team.members').toLowerCase()}</small>
      </div>

      <div className="cc-manual__buttons">
        <button type="button" className="cc-btn cc-btn--gold" onClick={() => sumar(1)} disabled={!miembro}>{t('chest.add1')}</button>
        <button type="button" className="cc-btn cc-btn--primary" onClick={() => sumar(5)} disabled={!miembro}>{t('chest.add5')}</button>
        <button type="button" className="cc-btn cc-btn--ghost" onClick={deshacer} disabled={!puedeDeshacer}>{t('chest.undo')}</button>
      </div>

      <form className="cc-manual__form" onSubmit={sumaManual}>
        <label htmlFor="cc-shared-amount">{t('team.myChests')}</label>
        <div className="cc-manual__form-row">
          <input
            id="cc-shared-amount"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder={t('chest.manualAmountPlaceholder')}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
          />
          <button type="submit" className="cc-btn cc-btn--primary" disabled={!miembro}>{t('chest.manualAmountAdd')}</button>
        </div>
        <p className="cc-note">{t('chest.manualAmountHint')}</p>
      </form>

      <ul className="cc-team-list cc-shared__members">
        {activos.map((m) => (
          <li key={m.userId} className={`cc-team-player ${m.userId === user.id ? 'is-active' : ''}`}>
            <div className="cc-team-player__select cc-team-player__select--static">
              <span className="cc-team-player__name">
                {m.nombre}
                {m.userId === user.id && <b className="cc-shared__you"> {t('team.you')}</b>}
              </span>
              <span className="cc-team-player__count">{numero(m.total, lang)}</span>
              <span className="cc-team-player__today">{t('chest.today')}: {numero(Number(m.dias[hoy]) || 0, lang)}</span>
            </div>
          </li>
        ))}
      </ul>

      {top && <p className="cc-shared__top">{t('team.top')}: <b>{top.nombre}</b> · {numero(top.total, lang)}</p>}

      {historial.length > 0 && (
        <div className="cc-shared__history">
          <h3>{t('team.historyTitle')}</h3>
          <ul className="cc-shared__history-list">
            {historial.map((m) => (
              <li key={m.userId}>
                <span>{m.nombre}</span>
                <b>{numero(m.total, lang)}</b>
                <small>{t('team.leftAt')} {new Intl.DateTimeFormat(lang, { day: '2-digit', month: 'short' }).format(new Date(m.leftAt))}</small>
              </li>
            ))}
          </ul>
          <p className="cc-note">{t('team.historyNote')}</p>
        </div>
      )}

      <div className="cc-card cc-shared__chart">
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
      </div>

      <p className="cc-note">{t('team.sharedNote')}</p>
      <p className="cc-note">{t('team.tokenNote')}</p>
      {error && <p className="cc-note cc-error">{error}</p>}
    </div>
  );
}
