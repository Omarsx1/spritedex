// Fusion de dos estados de coleccion (local y nube) sin perder nada.
//
// Antes la app elegia uno de los dos segun la marca de tiempo menos reciente ("gana el
// mas nuevo"). Eso borraba en silencio lo que solo estuviera en el otro lado: espiritus
// marcados en otro dispositivo, o los que quedaron en la nube cuando el local estaba
// vacio. Es la misma clase de fallo que dejo a una usuaria sin su coleccion.
//
// Regla: se conserva todo lo que aparezca en cualquiera de los dos, y en conflicto gana
// "atrapado" y el nivel mas alto. Nunca se baja un nivel.
export function mergeCollections(local = {}, nube = {}) {
  const estado = {};
  const ids = new Set([
    ...Object.keys(local || {}),
    ...Object.keys(nube || {})
  ]);

  for (const id of ids) {
    if (id === '_profile') continue; // metadatos de la nube: no son espiritus
    const a = (local && local[id]) || {};
    const b = (nube && nube[id]) || {};
    estado[id] = {
      owned: Boolean(a.owned || b.owned),
      level: Math.max(Number(a.level) || 1, Number(b.level) || 1)
    };
  }

  return estado;
}

// Separa el estado de la coleccion de los metadatos de perfil que guarda la nube.
export function sinPerfil(userState) {
  if (!userState) return {};
  const { _profile, ...resto } = userState;
  return resto;
}

