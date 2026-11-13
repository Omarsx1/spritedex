// Regla de novedad por lote: cuantas fichas se anuncian como "nuevas" y cuales.
//
// Vive fuera del hook para poder probarla sin React ni JSON (mismo patron que
// novedadesAviso.js). La regla es de TODA la app, no de una generacion: desde la
// temporada Buscatesoros los lanzamientos nuevos son de 3ª, y antes el filtro solo
// miraba la 2ª, asi que el aviso contaba fichas que la vista "Nuevos" no mostraba.
//
// 1. Si hay lanzamientos dentro de la ventana de 7 dias, esos son los nuevos.
// 2. Si no hay ninguno (sequia de contenido), se mantiene la ultima tanda: la que
//    salio mas recientemente, sin importar la generacion. Asi "Nuevos" no queda vacio.
// 3. Un espiritu programado/no lanzado o marcado con notNew nunca es nuevo.

import { estadoLanzamiento, DIAS_NOVEDAD } from './lanzamiento.js';

export function applyBatchNoveltyRules(spritesList, ahora = Date.now()) {
  if (!Array.isArray(spritesList) || spritesList.length === 0) return spritesList;

  // 1. Estado de cada espiritu (la regla vive en utils/lanzamiento.js)
  const withTiming = spritesList.map((sprite) => {
    const estado = estadoLanzamiento(sprite, ahora);
    return {
      ...sprite,
      unreleased: estado.unreleased,
      isAutoScheduled: estado.programado,
      timeUntilRelease: estado.programado ? estado.releaseTime - ahora : 0,
      daysSince: estado.diasDesde,
      releaseTime: estado.releaseTime
    };
  });

  // 2. Lanzamientos con fecha valida, de cualquier generacion
  const released = withTiming.filter((s) => !s.unreleased && s.releaseTime > 0);
  const activeRecent = released.filter((s) => s.daysSince >= 0 && s.daysSince < DIAS_NOVEDAD);

  // 3. Fallback: sin lanzamientos recientes, la ultima tanda (la mas reciente)
  let latestBatchTime = 0;
  if (activeRecent.length === 0 && released.length > 0) {
    latestBatchTime = Math.max(...released.map((s) => s.releaseTime));
  }

  // 4. Map novelty status
  return withTiming.map((s) => {
    if (s.unreleased) {
      return { ...s, isNew: false, noveltyReason: 'unreleased' };
    }

    /* Salida manual de la ventana de novedad. Sin esto, un evento que ya termino
       sigue contando como nuevo solo porque su fecha cae dentro de los 7 dias. */
    if (s.notNew) {
      return { ...s, isNew: false, noveltyReason: 'excluded' };
    }

    // Caso normal: hay lanzamientos dentro de la ventana
    if (activeRecent.length > 0) {
      const isWithin7 = s.daysSince >= 0 && s.daysSince < DIAS_NOVEDAD;
      return { ...s, isNew: isWithin7, noveltyReason: isWithin7 ? 'recent' : 'expired' };
    }

    // Sequia: se mantiene la ultima tanda (36 h desde el ultimo lanzamiento)
    if (latestBatchTime > 0) {
      const isLatestDrop = Math.abs(s.releaseTime - latestBatchTime) <= 36 * 60 * 60 * 1000;
      return { ...s, isNew: isLatestDrop, noveltyReason: isLatestDrop ? 'latest_drop' : 'older_drop' };
    }

    return { ...s, isNew: Boolean(s.is_new ?? s.isNew ?? false), noveltyReason: 'manual' };
  });
}
