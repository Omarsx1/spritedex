// Numeros de la coleccion que alimentan la guia: nada inventado, todo contado aqui.
//
// Vive en src/ y no en scripts/ porque la guia los necesita en dos sitios: el generador
// estatico (scripts/prerender-seo.mjs) y la vista dentro de la aplicacion. Una sola derivacion
// evita que las dos versiones de la pagina digan numeros distintos. Sin dependencias: recibe la
// lista de espiritus y devuelve el resumen, asi que se prueba con node --test.

export function datosGuia(sprites) {
  const cuenta = (clave) => {
    const mapa = new Map();
    for (const s of sprites) {
      const k = s[clave] || '';
      mapa.set(k, (mapa.get(k) || 0) + 1);
    }
    return [...mapa.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);
  };
  const numeros = sprites
    .map((s) => Number(String(s.dropChanceDisplay || '').replace('%', '').replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    total: sprites.length,
    familias: new Set(sprites.map((s) => s.familyId)).size,
    porRareza: cuenta('rarity'),
    costos: new Set(sprites.map((s) => s.summonCost).filter(Boolean)).size,
    dropMin: numeros.length ? Math.min(...numeros) : 0,
    dropMax: numeros.length ? Math.max(...numeros) : 0,
    fecha: new Date().toISOString().slice(0, 10)
  };
}
