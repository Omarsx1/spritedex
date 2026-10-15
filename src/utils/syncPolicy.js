// Politica del sync en vivo. Logica pura: sin React, sin DOM y sin red, para poder
// probarla en node y para que el mismo criterio valga en cualquier superficie.

// Ventana minima entre dos lecturas de la nube al volver a la pestana. Sin limite, cada
// cambio de foco o de visibilidad lanzaria una lectura completa.
export const INTERVALO_MINIMO_DE_REFRESCO_MS = 10000;

// Decide si toca leer la nube al recuperar foco / volver a la pestana / volver online.
// Con la modal de compartir abierta no se lee: subir y leer el JSON completo compite con
// la generacion de la captura en el telefono.
export function debeRefrescarAlVolver({ haySesion, compartiendo, visible, ahora, ultimoRefresco } = {}) {
  if (!haySesion) return false;
  if (compartiendo) return false;
  if (!visible) return false;
  // Primera vez en esta pestana: no hay marca previa que respetar.
  if (!ultimoRefresco) return true;
  return ahora - ultimoRefresco >= INTERVALO_MINIMO_DE_REFRESCO_MS;
}

// Compara dos estados de coleccion por id, ignorando los metadatos (_perfil) y el orden.
// Corta el eco de Realtime: sin esta guarda, cada escritura propia volveria a fusionar lo
// mismo y dispararia otra subida, en un bucle sin fin. El nivel ausente se lee como 1,
// igual que en mergeCollections.
export function mismoEstado(a = {}, b = {}) {
  const ids = (estado) => Object.keys(estado || {}).filter((id) => !id.startsWith('_'));
  const idsA = ids(a);
  const idsB = ids(b);
  if (idsA.length !== idsB.length) return false;

  for (const id of idsA) {
    const otro = (b && b[id]) || null;
    if (otro === null) return false;
    const uno = a[id] || {};
    if (Boolean(uno.owned) !== Boolean(otro.owned)) return false;
    if ((Number(uno.level) || 1) !== (Number(otro.level) || 1)) return false;
  }

  return true;
}
