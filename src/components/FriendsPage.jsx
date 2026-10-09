import React, { useEffect, useMemo, useState } from 'react';
import { ALL_SPRITES, pickName } from '../data/spritesData';
import { ArrowLeft, Users, UserPlus, Copy, Check, Zap, RefreshCw } from 'lucide-react';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { generateShareUrl } from '../utils/friendCode';
import { fichaYaCargada } from '../utils/fichaAmigo';
import { t } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

// Pagina de amigos (fase 1): tu codigo, agregar, solicitudes y la lista de amigos.
// Es la version con espacio de verdad de lo que vivia apretado en la modal: aqui se
// gestionan personas y en la ficha del amigo se compara la coleccion (fase 2).
// Reutiliza los estilos .sdm-friends que ya estaban aprobados.
export function FriendsPage({ myFriendCode, myShareToken, avisoExterno, codigoFicha, userState, friendState, spritesScope, onAmigoQuitado, onBack, onVerColeccion, onVerEnApp, codigoCargado }) {
  // Comparación rápida para la ficha: lo que él tiene y yo no, y al revés. Es la misma
  // idea que las listas de la modal, aquí resumida para tenerla en la página.
  const listas = useMemo(() => {
    // Solo la generacion activa: comparar contra las dos generaciones inflaba la lista
    // (137 elementos) y mezclaba temporadas. Es el mismo alcance que ve la app.
    const alcance = new Set((spritesScope || ALL_SPRITES).map((s) => s.id));
    const dentro = (k) => k !== '_profile' && alcance.has(k);
    const suyos = Object.keys(friendState || {}).filter((k) => dentro(k) && friendState[k]?.owned);
    const mios = Object.keys(userState || {}).filter((k) => dentro(k) && userState[k]?.owned);
    const setMios = new Set(mios);
    const setSuyos = new Set(suyos);
    // El estado guarda ids (air_gold); el nombre de las cartas vive en name y, si falta,
    // en fullName. Sin este respaldo se veia el id crudo, que es ilegible.
    const porId = new Map(ALL_SPRITES.map((s) => [s.id, s]));
    const conNombre = (id) => {
      const s = porId.get(id);
      return {
        id,
        name: (s && (pickName(s) || s.familyName)) || id,
        img: (s && (s.thumb || s.image)) || null
      };
    };
    return {
      teFaltan: suyos.filter((id) => !setMios.has(id)).map(conNombre),
      leFaltan: mios.filter((id) => !setSuyos.has(id)).map(conNombre)
    };
  }, [userState, friendState, spritesScope]);
  const radar = useFriendRequests();
  const [codigo, setCodigo] = useState('');
  const [aviso, setAviso] = useState('');
  const avisoVisible = aviso || avisoExterno || '';
  const [copiado, setCopiado] = useState('');
  const [verTodos, setVerTodos] = useState({ teFaltan: false, leFaltan: false });
  // Amigos por defecto. Si se entra por un enlace con codigo (/amigos/SDEX-XXXX) abre en
  // Comparación, porque ese enlace existe justo para ver la comparación con esa persona.
  const [vista, setVista] = useState(codigoFicha ? 'comparacion' : 'amigos');

  // Respaldo para los enlaces: con un enlace por token el codigo llega DESPUES del montaje,
  // asi que la pestaña se corrige sola en cuanto aparece; si no, el enlace abriria la
  // pestaña de amigos vacia. El clic ya no depende de esto: "Ver colección" abre la
  // comparación directamente (ver verColeccion).
  useEffect(() => {
    if (codigoFicha) setVista('comparacion');
  }, [codigoFicha]);

  const codigoCorto = (myFriendCode || '').replace(/^SDEX-/i, '');
  const enlace = generateShareUrl(myShareToken, myFriendCode || 'SDEX-0000');

  // La colección de la ficha ya esta en pantalla: la misma regla que prueba el codigo
  // pedido contra el cargado decide si el boton "Ver su colección" sobra.
  const fichaCargada = fichaYaCargada({ codigoFicha, codigoCargado, hayColeccion: Boolean(friendState) });

  // El clic ES la intencion: al elegir "Ver colección" se abre la comparación aqui mismo,
  // sin depender del codigo de la ruta. La ruta es solo el respaldo para quien llega por un
  // enlace (/amigos/SDEX-XXXX), donde no hay clic que valga.
  // Sin amistad aceptada la colección ya no se puede leer: se avisa en vez de no hacer nada.
  const verColeccion = async (codigo) => {
    const ok = await onVerColeccion(codigo);
    if (ok === false) { setAviso(t('amigos.noSePudoVer')); return false; }
    // El aviso se limpia al exito: si no, "no pudimos ver esa colección" sobrevivia a la
    // carga siguiente.
    setAviso('');
    setVista('comparacion');
    return ok;
  };

  const copiar = async (texto, cual) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(''), 2000);
    } catch { setAviso(t('amigos.copiarFallido')); }
  };

  const enviar = async () => {
    const limpio = codigo.trim();
    if (!limpio) return;
    setAviso(t('amigos.enviando'));
    const res = await radar.enviar(limpio, myFriendCode);
    if (res.error) { setAviso(res.error); return; }
    setCodigo('');
    setAviso(t('amigos.solicitudEnviada'));
  };

  return (
    <div className="fpage">
      <div className="fpage__top">
        {/* Vuelve a la app, no atras: en una PWA instalada no hay boton del navegador y quien
            llega por un enlace de amigo puede no tener historial. El title lo explica al pasar
            el raton en escritorio, donde el icono solo no lo dice. */}
        <button className="fpage__back" onClick={onBack} aria-label={t('amigos.volverALaApp')} title={t('amigos.volverALaApp')}>
          <ArrowLeft size={18} />
        </button>
        <div className="fpage__headText">
          <h1 className="fpage__title">{t('amigos.titulo')}</h1>
          <p className="fpage__sub">{t('amigos.subtitulo')}</p>
        </div>
        <button className="fpage__refresh" onClick={() => radar.cargar()} disabled={radar.cargando} aria-label={t('amigos.actualizar')}>
          <RefreshCw size={15} />
        </button>
        <LanguageSwitcher className="fpage__lang" />
      </div>

      {/* Un bloque a la vez: la pagina deja de apilar siete secciones y de repetir la
          lista de amigos despues de la comparacion. */}
      <div className="fpage__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'amigos'}
          className={'fpage__tab' + (vista === 'amigos' ? ' is-active' : '')}
          onClick={() => setVista('amigos')}
        >
          {t('amigos.titulo')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'comparacion'}
          className={'fpage__tab' + (vista === 'comparacion' ? ' is-active' : '')}
          onClick={() => setVista('comparacion')}
          disabled={!codigoFicha}
        >
          {t('amigos.tabComparacion')}
        </button>
      </div>

      <div className="sdm-friends" data-vista={vista}>
        <div className="fpage__lateral">
          <div className="sdm-friends__group">
            <span className="sdm-friends__label">{t('amigos.tuCodigoDeAmigo')}</span>
            <div className="sdm-friends__row">
              <span className="sdm-friends__plate">
                <span className="sdm-friends__prefix">SDEX</span>
                <span className="sdm-friends__code">{codigoCorto || '????'}</span>
              </span>
              <div className="sdm-friends__actions">
                <button type="button" className="sdm-friends__btn" onClick={() => copiar(myFriendCode || '', 'codigo')}>
                  {copiado === 'codigo' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiado === 'codigo' ? t('amigos.copiado') : t('amigos.copiar')}</span>
                </button>
                <button type="button" className="sdm-friends__btn" onClick={() => copiar(enlace, 'enlace')}>
                  {copiado === 'enlace' ? <Check size={13} /> : <Zap size={13} />}
                  <span>{t('amigos.enlace')}</span>
                </button>
              </div>
            </div>
            <p className="sdm-friends__hint sdm-friends__hint--aviso">{t('amigos.avisoEnlace')}</p>
            <p className="sdm-friends__hint">{t('amigos.hintCodigo')}</p>
          </div>

          <div className="sdm-friends__group">
            <span className="sdm-friends__label"><UserPlus size={12} /> {t('amigos.agregarAmigo')}</span>
            <div className="sdm-friends__add">
              <input
                type="text"
                className="sdm-friends__input"
                placeholder={t('amigos.placeholderCodigo')}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
              />
              <button type="button" className="sdm-friends__send" onClick={enviar} disabled={!codigo.trim()}>
                {t('amigos.enviarSolicitud')}
              </button>
            </div>
            {avisoVisible && <p className="sdm-friends__aviso">{avisoVisible}</p>}
            {!radar.haySesion && (
              <p className="sdm-friends__aviso">{t('amigos.necesitasSesion')}</p>
            )}
          </div>

        </div>
        <div className="fpage__principal">
            <div className="fpage__bloqueFicha">
            {codigoFicha && (
              <div className="sdm-friends__group">
                <div className="sdm-friends__fichaHead">
                  <span className="sdm-friends__label">{t('amigos.fichaCompartida')}</span>
                  <span className="sdm-friends__plate">
                    <span className="sdm-friends__prefix">SDEX</span>
                    <span className="sdm-friends__code">{String(codigoFicha).replace(/^SDEX-/i, '')}</span>
                  </span>
                </div>
                <div className="sdm-friends__row">
                  <div className="sdm-friends__actions">
                    {/* El boton sobra si esa colección ya esta cargada: pulsarlo no haria nada.
                        Se deja mientras no este cargada para que quien llega por un enlace
                        todavia tenga como cargarla. */}
                    {!fichaCargada && (
                      <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => verColeccion(codigoFicha)}>{t('amigos.verSuColeccion')}</button>
                    )}
                      <button type="button" className="sdm-friends__btn" onClick={() => onVerEnApp(codigoFicha)}>
                        {t('amigos.vistaDeAmigo')}
                      </button>
                  </div>
                </div>
              </div>
            )}

            {codigoFicha && friendState && (
              <div className="sdm-friends__group">
                <span className="sdm-friends__label">{t('amigos.teFaltanConteo', { n: listas.teFaltan.length })}</span>
                <p className="sdm-friends__hint">{t('amigos.teFaltanHint')}</p>
                {listas.teFaltan.length === 0 ? (
                  <p className="sdm-friends__hint">{t('amigos.teFaltanVacio')}</p>
                ) : (<>
                  <div className="fpage__minis">
                    {(verTodos.teFaltan ? listas.teFaltan : listas.teFaltan.slice(0, 12)).map((s) => (
                      <div key={s.id} className="fpage__mini">
                        {s.img ? <img src={s.img} alt={s.name} loading="lazy" decoding="async" width={44} height={44} /> : <span className="fpage__miniNombre">?</span>}
                        <span className="fpage__miniNombre">{s.name}</span>
                      </div>
                    ))}
                  </div>
                  {listas.teFaltan.length > 12 && (
                    <button type="button" className="sdm-friends__btn sdm-friends__btn--ver" onClick={() => setVerTodos((v) => ({ ...v, teFaltan: !v.teFaltan }))}>
                      {verTodos.teFaltan ? t('amigos.verMenos') : t('amigos.verLos', { n: listas.teFaltan.length })}
                    </button>
                  )}
                  </>
                )}
                <span className="sdm-friends__label">{t('amigos.leFaltanConteo', { n: listas.leFaltan.length })}</span>
                <p className="sdm-friends__hint">{t('amigos.leFaltanHint')}</p>
                {listas.leFaltan.length === 0 ? (
                  <p className="sdm-friends__hint">{t('amigos.leFaltanVacio')}</p>
                ) : (<>
                  <div className="fpage__minis">
                    {(verTodos.leFaltan ? listas.leFaltan : listas.leFaltan.slice(0, 12)).map((s) => (
                      <div key={s.id} className="fpage__mini fpage__mini--suyo">
                        {s.img ? <img src={s.img} alt={s.name} loading="lazy" decoding="async" width={44} height={44} /> : <span className="fpage__miniNombre">?</span>}
                        <span className="fpage__miniNombre">{s.name}</span>
                      </div>
                    ))}
                  </div>
                  {listas.leFaltan.length > 12 && (
                    <button type="button" className="sdm-friends__btn sdm-friends__btn--ver" onClick={() => setVerTodos((v) => ({ ...v, leFaltan: !v.leFaltan }))}>
                      {verTodos.leFaltan ? t('amigos.verMenos') : t('amigos.verLos', { n: listas.leFaltan.length })}
                    </button>
                  )}
                  </>
                )}
              </div>
            )}

            {codigoFicha && !friendState && (
              <div className="sdm-friends__group">
                <p className="sdm-friends__hint">{t('amigos.sinFichaHint')}</p>
              </div>
            )}
            </div>

          {radar.recibidas.length > 0 && (
            <div className="sdm-friends__group">
              <span className="sdm-friends__label">{t('amigos.solicitudesConteo', { n: radar.recibidas.length })}</span>
              {radar.recibidas.map((s) => (
                <div key={s.id} className="sdm-friends__row">
                  <span className="sdm-friends__plate">
                    <span className="sdm-friends__prefix">SDEX</span>
                    <span className="sdm-friends__code">{String(s.from_code || '').replace(/^SDEX-/i, '')}</span>
                  </span>
                  <div className="sdm-friends__actions">
                    <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => radar.aceptar(s.id)}>{t('amigos.aceptar')}</button>
                    <button type="button" className="sdm-friends__btn" onClick={() => radar.rechazar(s.id)}>{t('amigos.rechazar')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sdm-friends__group">
            <span className="sdm-friends__label"><Users size={12} /> {t('amigos.amigosConteo', { n: radar.amigos.length })}</span>
            {/* La lista no afirma nada que no haya comprobado: mientras no llegue la respuesta
                se dice que esta cargando (tambien mientras se resuelve la sesion), si la
                lectura fallo se dice eso, y "sin amigos" queda para cuando de verdad se sabe. */}
            {!radar.cargado && radar.fallo ? (
              <p className="sdm-friends__hint">{t('amigos.noSePudoLeerRed')}</p>
            ) : !radar.cargado && (radar.haySesion || !radar.sesionLista) ? (
              <p className="sdm-friends__hint">{t('amigos.cargandoRed')}</p>
            ) : radar.amigos.length === 0 ? (
              <p className="sdm-friends__hint">{t('amigos.sinAmigos')}</p>
            ) : radar.amigos.map((a) => {
              const suyo = radar.codigoDeAmigo(a);
              return (
                <div key={a.id} className="sdm-friends__row">
                  <span className="sdm-friends__plate">
                    <span className="sdm-friends__prefix">SDEX</span>
                    <span className="sdm-friends__code">{String(suyo || '').replace(/^SDEX-/i, '')}</span>
                  </span>
                  <div className="sdm-friends__actions">
                    <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => verColeccion(suyo)}>{t('amigos.verColeccion')}</button>
                    <button
                      type="button"
                      className="sdm-friends__btn sdm-friends__btn--danger"
                      onClick={() => {
                        radar.borrar(a.id);
                        // Si estabas viendo SU coleccion, hay que salir de esa vista: si no,
                        // al volver a la app queda el cartel de MODO AMIGO con datos de
                        // alguien que ya no es tu amigo.
                        if (onAmigoQuitado) onAmigoQuitado(suyo);
                      }}
                    >
                      {t('amigos.quitar')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {radar.enviadas.length > 0 && (
            <div className="sdm-friends__group">
              <span className="sdm-friends__label">{t('amigos.enviadasConteo', { n: radar.enviadas.length })}</span>
              {radar.enviadas.map((s) => (
                <div key={s.id} className="sdm-friends__row">
                  <span className="sdm-friends__plate">
                    <span className="sdm-friends__prefix">SDEX</span>
                    <span className="sdm-friends__code">{String(s.to_code || '').replace(/^SDEX-/i, '')}</span>
                  </span>
                  <div className="sdm-friends__actions">
                    <span className="sdm-friends__pendiente">{t('amigos.esperando')}</span>
                    <button type="button" className="sdm-friends__btn" onClick={() => radar.borrar(s.id)}>{t('amigos.cancelar')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
