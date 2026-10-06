# SEO Fase 2: paginas por espiritu

## Objetivo
Que el contenido unico de los 278 espiritus (nombre en dos idiomas, familia, variante, rareza,
generacion, probabilidad de drop, costo, ubicacion y habilidad) exista como HTML indexable, y
que cada ficha enlace con sus variantes. Es el salto de "app invisible" a catalogo indexable.

## Problema
Los espiritus solo vivian dentro de la SPA: el detalle se abria en un modal por estado, sin URL.
278 fichas con datos propios, cero paginas. La fase 1 arreglo el <head> de las rutas que
existian; esta crea las que no existian.

## Checklist
- [x] T1 `src/seo/espiritus.js`: slug estable desde el id (`spookydash_gold` ->
      `spookydash-gold`; no se usa el nombre visible para que corregir un nombre no rompa
      URLs), etiquetas por idioma, JSON-LD (WebPage + mainEntity Product con las propiedades +
      BreadcrumbList) y el HTML completo de la ficha y del indice.
- [x] T2 `scripts/prerender-seo.mjs` genera las 558 paginas (278 fichas x 2 idiomas + indice
      por idioma) y las mete en el sitemap con su hreflang: **563 URLs**.
- [x] T3 Los datos NO se duplican: se cargan con `ssrLoadModule` de Vite desde
      `src/data/spritesData.js`, asi que nombres en ingles, familia, y las traducciones de
      habilidad/ubicacion/costo las resuelve la app (`pickTexto`). Cobertura comprobada:
      44 habilidades, 12 ubicaciones y 15 costos, **100% con version inglesa**.
- [x] T4 Los 6 espiritus que todavia no tienen arte no pintan `<img>` ni declaran `image`
      en el JSON-LD: muestran un aviso. Una imagen rota se ve peor que decir que falta.

## Verificacion
- `node --test`: **156/156** (9 pruebas nuevas). Cazaron dos bugs reales antes de commitear:
  el recorte de titulos devolvia 61 caracteres y el JSON-LD no escapaba `<`, asi que un nombre
  con `</script>` habria roto la pagina.
- Ficha comprobada (ES y EN): titulo propio, canonical autorreferente, 3 hreflang, 1 JSON-LD,
  un solo h1, los 8 datos, la habilidad y los enlaces a las variantes hermanas; la version
  inglesa **no** lleva ni una cadena en español y la española no lleva ingles.
- 278 + 278 + 2 archivos; sitemap con 563 URLs.

## Coste asumido
`dist/` pasa de 20 a **26 MB** (+6 MB de HTML). Es el precio de tener 558 paginas: siguen
siendo 13 MB menos que los 39 MB originales.

## Enlace profundo (cerrado)
- [x] T5 Los CTA de las fichas llevan a `/?s=<slug>` y `/en?s=<slug>` (forma canonica, sin
      barra final) y la app los resuelve en `src/utils/enlaceEspiritu.js`: abre el detalle de
      ESE espiritu. Tambien acepta la ruta `/espiritu/<slug>`, que es la que ve la app en
      desarrollo (en produccion la sirve el HTML estatico). Se resuelve una sola vez, cuando la
      lista ya esta cargada, para no reabrir el modal si el usuario lo cierra.
- Verificado con Chrome headless sobre el build: `/?s=spookydash-gold` abre
  "Impulso aterrador Dorado"; sin enlace no abre nada; `?s=no-existe` no abre nada ni lanza
  errores. 161/161 pruebas.

## Pendiente
- Arte para los 6 espiritus (`fishy_gem`, `fishy_holofoil`, `striker_gem`, `striker_rift`,
  `boss_holofoil`, `seven_gem`).
- F3 Core Web Vitals, F4 contenido/E-E-A-T, F5 medicion.
- Nada desplegado: el usuario pidio seguir en rama.
