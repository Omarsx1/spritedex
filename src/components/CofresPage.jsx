// Contador de cofres de Spritedex (Beta).
//
// Servicio propio, sin apps externas: el usuario toca +1 por cada cofre que abre y todo se
// guarda en este navegador. La meta de la temporada es el Token Pirata, así que la página
// muestra el total, el día, la sesión y el estado del token.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { t, getLang } from '../i18n';
import { safeStorage } from '../utils/safeStorage';

const CLAVE = 'spritedex_cofres_v1';
const DIA_MS = 24 * 60 * 60 * 1000;

const numero = (valor, lang) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(valor || 0);

function claveDia(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function leerCofres() {
  const base = { total: 0, sesion: 0, token: false, tokenFecha: null, dias: {} };
  try {
    const guardado = JSON.parse(safeStorage.getItem(CLAVE) || 'null');
    if (!guardado || typeof guardado !== 'object') return base;
    const dias = guardado.dias && typeof guardado.dias === 'object' ? guardado.dias : {};
    return {
      total: Math.max(0, Number(guardado.total) || 0),
      sesion: Math.max(0, Number(guardado.sesion) || 0),
      token: guardado.token === true,
      tokenFecha: typeof guardado.tokenFecha === 'string' ? guardado.tokenFecha : null,
      dias
    };
  } catch {
    return base;
  }
}

function Barra({ valor, maximo, etiqueta }) {
  const alto = Math.max(valor > 0 ? 4 : 1, Math.round((valor / Math.max(1, maximo)) * 100));
  return <span className={`cc-bar ${valor > 0 ? '' : 'is-empty'}`} style={{ height: alto + '%' }} title={etiqueta} />;
}

export function CofresPage() {
  const lang = getLang();
  const [cofres, setCofres] = useState(leerCofres);
  const tituloRef = useRef(null);

  useEffect(() => {
    if (tituloRef.current) tituloRef.current.focus();
  }, []);

  function guardar(siguiente) {
    setCofres(siguiente);
    safeStorage.setItem(CLAVE, JSON.stringify(siguiente));
  }

  function sumar(cantidad) {
    const hoy = claveDia();
    const dias = { ...cofres.dias };
    dias[hoy] = Math.max(0, (Number(dias[hoy]) || 0) + cantidad);
    guardar({
      ...cofres,
      total: Math.max(0, cofres.total + cantidad),
      sesion: Math.max(0, cofres.sesion + cantidad),
      dias
    });
  }

  function nuevaSesion() {
    guardar({ ...cofres, sesion: 0 });
  }

  function reiniciar() {
    if (typeof window !== 'undefined' && !window.confirm(t('chest.resetConfirm'))) return;
    guardar({ total: 0, sesion: 0, token: false, tokenFecha: null, dias: {} });
  }

  function marcarToken() {
    const token = !cofres.token;
    guardar({ ...cofres, token, tokenFecha: token ? claveDia() : null });
  }

  const hoy = claveDia();
  const hoyCofres = Number(cofres.dias[hoy]) || 0;
  const entradas = Object.entries(cofres.dias).filter(([, n]) => Number(n) > 0);
  const mejorDia = entradas.map(([dia, n]) => ({ dia, cofres: Number(n) }))
    .sort((a, b) => b.cofres - a.cofres)[0] || null;
  const diasJugados = entradas.length;
  const mediaDia = diasJugados ? cofres.total / diasJugados : 0;

  const serie = useMemo(() => {
    const salida = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date(base.getTime() - i * DIA_MS);
      const clave = claveDia(fecha);
      salida.push({ clave, fecha, cofres: Number(cofres.dias[clave]) || 0 });
    }
    return salida;
  }, [cofres.dias]);
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
          <p className="cc-privacy">{t('chest.privacy')}</p>
        </div>
      </section>

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

      <section className="cc-manual">
        <div className="cc-manual__count">
          <span>{t('chest.total')}</span>
          <strong>{numero(cofres.total, lang)}</strong>
          <small>{t('chest.today')}: {numero(hoyCofres, lang)} · {t('chest.session')}: {numero(cofres.sesion, lang)}</small>
        </div>
        <div className="cc-manual__buttons">
          <button type="button" className="cc-btn cc-btn--gold" onClick={() => sumar(1)}>{t('chest.add1')}</button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => sumar(5)}>{t('chest.add5')}</button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => sumar(-1)}>{t('chest.undo')}</button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={marcarToken}>{t('chest.manualToken')}</button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={nuevaSesion}>{t('chest.newSession')}</button>
          <button type="button" className="cc-btn cc-btn--ghost cc-btn--danger" onClick={reiniciar}>{t('chest.reset')}</button>
        </div>
        <p className="cc-manual__note">{t('chest.manualBody')}</p>
        <p className="cc-note">{t('chest.manualTokenNote')}</p>
      </section>

      <section className="cc-kpis">
        <div className="cc-kpi"><span>{t('chest.daysPlayed')}</span><strong>{numero(diasJugados, lang)}</strong></div>
        <div className="cc-kpi"><span>{t('chest.averageDay')}</span><strong>{numero(mediaDia, lang)}</strong></div>
        <div className="cc-kpi"><span>{t('chest.bestDay')}</span><strong>{mejorDia ? numero(mejorDia.cofres, lang) : '—'}</strong>{mejorDia && <small>{mejorDia.dia}</small>}</div>
      </section>

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
