import React, { useState } from 'react';
import { Cloud, X } from 'lucide-react';
import { t } from '../i18n';

// El descarte dura la sesion, no el navegador: si se recordara para siempre, un invitado
// con 200 espiritus no volveria a ver nunca el camino para reclamar su cuenta. Vuelve en
// la proxima visita, que es justo cuando el aviso sigue teniendo sentido.
const CLAVE_DESCARTE = 'spritedex_claim_banner_v1';

// sessionStorage puede faltar (modo privado estricto, iframe con storage bloqueado). Fuera
// de try, leer o escribir ahi mataria el componente entero.
function descartadoAntes() {
  try {
    return window.sessionStorage.getItem(CLAVE_DESCARTE) === 'true';
  } catch {
    return false;
  }
}

/**
 * Aviso de reclamo progresivo para una sesion anonima que ya tiene algo que perder.
 * App decide cuando mostrarlo (nunca se muestra a cuentas identificadas ni sin progreso);
 * aqui solo vive el descarte, y por eso el componente devuelve null en cuanto se descarta.
 */
export function ClaimAccountBanner({ onCrearUsuario }) {
  const [descartado, setDescartado] = useState(descartadoAntes);

  if (descartado) return null;

  const descartar = () => {
    try {
      window.sessionStorage.setItem(CLAVE_DESCARTE, 'true');
    } catch {
      // Sin sessionStorage el aviso se cierra igual: el estado en memoria es la fuente.
    }
    setDescartado(true);
  };

  return (
    <div className="claim-banner" role="status">
      <Cloud size={16} className="claim-banner__icon" aria-hidden="true" />
      <p className="claim-banner__texto">{t('reclamo.texto')}</p>
      <button type="button" className="claim-banner__cta" onClick={onCrearUsuario}>
        {t('reclamo.crearUsuario')}
      </button>
      <button
        type="button"
        className="claim-banner__close"
        onClick={descartar}
        aria-label={t('reclamo.descartar')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
