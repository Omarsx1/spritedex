import React, { useMemo, useState } from 'react';
import { ALL_SPRITES } from '../data/spritesData';
import { ArrowLeft, Users, UserPlus, Copy, Check, Zap, RefreshCw } from 'lucide-react';
import { useFriendRequests } from '../hooks/useFriendRequests';
import { generatePermanentFriendUrl } from '../utils/friendCode';

// Pagina de amigos (fase 1): tu codigo, agregar, solicitudes y la lista de amigos.
// Es la version con espacio de verdad de lo que vivia apretado en la modal: aqui se
// gestionan personas y en la ficha del amigo se compara la coleccion (fase 2).
// Reutiliza los estilos .sdm-friends que ya estaban aprobados.
export function FriendsPage({ myFriendCode, codigoFicha, userState, friendState, spritesScope, onAmigoQuitado, onBack, onVerColeccion, onVerEnApp }) {
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
        name: (s && (s.name || s.fullName || s.familyName)) || id,
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
  const [copiado, setCopiado] = useState('');
  const [verTodos, setVerTodos] = useState({ teFaltan: false, leFaltan: false });

  const codigoCorto = (myFriendCode || '').replace(/^SDEX-/i, '');
  const enlace = generatePermanentFriendUrl(myFriendCode || 'SDEX-0000');

  const copiar = async (texto, cual) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(''), 2000);
    } catch { setAviso('Tu navegador no dejó copiar. Mantén pulsado el código para copiarlo.'); }
  };

  const enviar = async () => {
    const limpio = codigo.trim();
    if (!limpio) return;
    setAviso('Enviando…');
    const res = await radar.enviar(limpio, myFriendCode);
    if (res.error) { setAviso(res.error); return; }
    setCodigo('');
    setAviso('Solicitud enviada. Le llegará cuando abra Amigos.');
  };

  return (
    <div className="fpage">
      <div className="fpage__top">
        <button className="fpage__back" onClick={onBack} aria-label="Volver a la app">
          <ArrowLeft size={18} />
        </button>
        <div className="fpage__headText">
          <h1 className="fpage__title">Amigos</h1>
          <p className="fpage__sub">Gestiona tu red y compara colecciones</p>
        </div>
        <button className="fpage__refresh" onClick={() => radar.cargar()} disabled={radar.cargando} aria-label="Actualizar">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="sdm-friends">
        <div className="sdm-friends__group">
          <span className="sdm-friends__label">TU CÓDIGO DE AMIGO</span>
          <div className="sdm-friends__row">
            <span className="sdm-friends__plate">
              <span className="sdm-friends__prefix">SDEX</span>
              <span className="sdm-friends__code">{codigoCorto || '????'}</span>
            </span>
            <div className="sdm-friends__actions">
              <button type="button" className="sdm-friends__btn" onClick={() => copiar(myFriendCode || '', 'codigo')}>
                {copiado === 'codigo' ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiado === 'codigo' ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <button type="button" className="sdm-friends__btn" onClick={() => copiar(enlace, 'enlace')}>
                {copiado === 'enlace' ? <Check size={13} /> : <Zap size={13} />}
                <span>Enlace</span>
              </button>
            </div>
          </div>
          <p className="sdm-friends__hint">Quien tenga tu código puede enviarte una solicitud. Tú decides si la aceptas.</p>
        </div>

        <div className="sdm-friends__group">
          <span className="sdm-friends__label"><UserPlus size={12} /> AGREGAR AMIGO</span>
          <div className="sdm-friends__add">
            <input
              type="text"
              className="sdm-friends__input"
              placeholder="Su código (ej: 2KD4)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }}
            />
            <button type="button" className="sdm-friends__send" onClick={enviar} disabled={!codigo.trim()}>
              Enviar solicitud
            </button>
          </div>
          {aviso && <p className="sdm-friends__aviso">{aviso}</p>}
          {!radar.haySesion && (
            <p className="sdm-friends__aviso">Necesitas sesión para enviar solicitudes: vincula tu cuenta y se activan.</p>
          )}
        </div>

          {codigoFicha && (
            <div className="sdm-friends__group">
              <span className="sdm-friends__label">FICHA COMPARTIDA</span>
              <div className="sdm-friends__row">
                <span className="sdm-friends__plate">
                  <span className="sdm-friends__prefix">SDEX</span>
                  <span className="sdm-friends__code">{String(codigoFicha).replace(/^SDEX-/i, '')}</span>
                </span>
                <div className="sdm-friends__actions">
                  <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => onVerColeccion(codigoFicha)}>Ver su colección</button>
                  {onVerEnApp && (
                    <button type="button" className="sdm-friends__btn" onClick={() => onVerEnApp(codigoFicha)}>
                      Vista de amigo
                    </button>
                  )}
                </div>
              </div>
              <p className="sdm-friends__hint">Te compartieron este código. Puedes ver su colección o enviarle una solicitud para que quede en tus amigos.</p>
            </div>
          )}

          {codigoFicha && friendState && (
            <div className="sdm-friends__group">
              <span className="sdm-friends__label">COMPARACIÓN CON SDEX {String(codigoFicha).replace(/^SDEX-/i, '')}</span>
              <span className="sdm-friends__label">TE FALTAN ({listas.teFaltan.length})</span>
              {listas.teFaltan.length === 0 ? (
                <p className="sdm-friends__hint">Los tienes todos. No te falta nada de lo suyo.</p>
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
                    {verTodos.teFaltan ? 'Ver menos' : 'Ver los ' + listas.teFaltan.length}
                  </button>
                )}
                </>
              )}
              <span className="sdm-friends__label">LE FALTAN ({listas.leFaltan.length})</span>
              {listas.leFaltan.length === 0 ? (
                <p className="sdm-friends__hint">No necesita nada de lo tuyo.</p>
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
                    {verTodos.leFaltan ? 'Ver menos' : 'Ver los ' + listas.leFaltan.length}
                  </button>
                )}
                </>
              )}
              <p className="sdm-friends__hint">Te faltan: lo que él tiene y tú no. Le faltan: lo que tú tienes y él no. Perfecto para intercambiar.</p>
            </div>
          )}

          {codigoFicha && !friendState && (
            <div className="sdm-friends__group">
              <p className="sdm-friends__hint">Pulsa Ver su colección para cargar la comparación: verás lo que te falta y lo que a él le falta.</p>
            </div>
          )}

        {radar.recibidas.length > 0 && (
          <div className="sdm-friends__group">
            <span className="sdm-friends__label">SOLICITUDES ({radar.recibidas.length})</span>
            {radar.recibidas.map((s) => (
              <div key={s.id} className="sdm-friends__row">
                <span className="sdm-friends__plate">
                  <span className="sdm-friends__prefix">SDEX</span>
                  <span className="sdm-friends__code">{String(s.from_code || '').replace(/^SDEX-/i, '')}</span>
                </span>
                <div className="sdm-friends__actions">
                  <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => radar.aceptar(s.id)}>Aceptar</button>
                  <button type="button" className="sdm-friends__btn" onClick={() => radar.rechazar(s.id)}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sdm-friends__group">
          <span className="sdm-friends__label"><Users size={12} /> AMIGOS ({radar.amigos.length})</span>
          {radar.amigos.length === 0 ? (
            <p className="sdm-friends__hint">Todavía no tienes amigos aceptados. Envía una solicitud con el código de alguien: cuando la acepte, aparecerá aquí.</p>
          ) : radar.amigos.map((a) => {
            const suyo = radar.codigoDeAmigo(a);
            return (
              <div key={a.id} className="sdm-friends__row">
                <span className="sdm-friends__plate">
                  <span className="sdm-friends__prefix">SDEX</span>
                  <span className="sdm-friends__code">{String(suyo || '').replace(/^SDEX-/i, '')}</span>
                </span>
                <div className="sdm-friends__actions">
                  <button type="button" className="sdm-friends__btn sdm-friends__btn--ok" onClick={() => onVerColeccion(suyo)}>Ver colección</button>
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
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {radar.enviadas.length > 0 && (
          <div className="sdm-friends__group">
            <span className="sdm-friends__label">ENVIADAS ({radar.enviadas.length})</span>
            {radar.enviadas.map((s) => (
              <div key={s.id} className="sdm-friends__row">
                <span className="sdm-friends__plate">
                  <span className="sdm-friends__prefix">SDEX</span>
                  <span className="sdm-friends__code">{String(s.to_code || '').replace(/^SDEX-/i, '')}</span>
                </span>
                <div className="sdm-friends__actions">
                  <span className="sdm-friends__pendiente">Esperando</span>
                  <button type="button" className="sdm-friends__btn" onClick={() => radar.borrar(s.id)}>Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
