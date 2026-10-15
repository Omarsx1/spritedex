# Portugués para Brasil (pt-BR)

Objetivo: la app se ve en portugués de Brasil según el navegador, sin cambiar español ni inglés. pt-PT se retiró (L13) y `/pt-pt` redirige a `/pt-br`.
Rama: `feat/locales-pt` (desde `main` 9c61807). Entrega: `ask-on-risk`. Pruebas: `npm test` (node --test); lint: `npm run lint`; build: `npm run build`.

## Specs

- S1. La app se muestra en portugués a usuarios de Brasil. Original (L1): "puedes hacer que la app se muestre todo en portugues cuando los usuarios sean de brasil? sin afectar a los demás usuarios e idiomas?"
- S2. Un solo locale portugués: `pt-BR`. Original (L13): "bueno quitemos portugal, prioricemos Brasil". Retirada de pt-PT como locale (reemplaza la S2 original de L2 sobre dos locales).
- S3. Escala como una gran empresa. Original: "implementalo, recuerda que escalamos como una gran empresa" [supuesto: incluye SEO, textos del juego y nombres de espíritus, no solo la UI]
- S4. Sin efecto en español ni inglés: rutas `/` y `/en`, textos, claves de `localStorage` y pruebas existentes en `tests/i18n.test.js` siguen iguales. [supuesto derivado de "sin afectar a los demás usuarios e idiomas"]
- S5. El idioma se decide por el navegador, nunca por país (regla existente en `core.js` y en las pruebas). `pt` genérico y cualquier etiqueta portuguesa, incluida `pt-PT`, caen a pt-BR. [L13]
- S6. Prefijo de URL único `/pt-br`, con la misma lógica que `/en`. [L13; reemplaza la S6 original de dos prefijos]
- S7. Selector con tres opciones: ES, EN, PT-BR. [L13; reemplaza la S7 original de PT-BR/PT-PT separadas]
- S8. Paridad de claves: `pt-BR.js` tiene exactamente las claves de `es.js`, con los mismos marcadores `{var}`. [L13; se elimina `pt-PT.js`]
- S9. SEO prerenderizado (hreflang, canonical, sitemap) para pt-BR.
- S10. Textos del juego (`src/data/i18n/textos.juego.json`) y nombres de espíritus y familias en pt-BR. Fuente de nombres pendiente de decidir (no hay captura oficial en portugués).
- S11. Las URLs `/pt-pt` y `/pt-pt/*` ya publicadas redirigen 301 a `/pt-br` (`vercel.json`), para no romper enlaces ni SEO. [L13]

## Tareas

- T1 [inline] Núcleo: `IDIOMAS`, `normalizarIdioma` (pt-* ya no cae a en), `planDeArranque`, prefijos `/pt-br` y `/pt-pt`, pruebas. Specs S4, S5, S6. Commit: `da6e5e7`.
- T2 [delegado, escritor] `src/i18n/locales/pt-BR.js` completo, paridad con `es.js`. Specs S1, S8. Commit: `ea78287`. Evidencia: 428 claves, faltan/sobran 0, marcadores iguales.
- T3 [delegado, escritor] `src/i18n/locales/pt-PT.js` completo, paridad con `es.js`, portugués europeo. Specs S2, S8. Commit: `abbc34b`. Evidencia: 428 claves, faltan/sobran 0, marcadores iguales; se corrigió "Recarregar" por "Recarregue" en `amigos.necesitasSesion`.
- T4 [inline] Registro en `locales/index.js`, selector de cuatro opciones (S7), prueba de paridad. Commit: `7703efe`. Evidencia: `npm test` 266/266, `npm run build` ok, `npm run lint` sin errores.
- T5 [delegado, escritor en paralelo con T6] SEO para pt-BR y pt-PT (S9). Superficie: `src/seo/**`, `scripts/prerender-seo.mjs`, `tests/seo-*.test.js`. Commit: pendiente.
- T6 [delegado, escritor en paralelo con T5] Textos del juego y nombres de espíritus en pt (S10). Superficie: `src/data/i18n/**`, `src/data/spritesData.js`, `tests/data-i18n*`. Commit: pendiente.
- T7 [pendiente] Verificación en navegador: golden path pt-BR y que es/en no cambian. [L13: se retira pt-PT de esta verificación]
- T8 [inline] Retirar pt-PT: núcleo (`IDIOMAS`, `normalizarIdioma`, prefijos), `locales/index.js`, selector, SEO (`src/seo/**`, `scripts/prerender-seo.mjs`), textos (`src/data/i18n/**`) y pruebas; redirección `/pt-pt` → `/pt-br` en `vercel.json`. Specs S2, S5-S11. Evidencia: `npm test` 298/298; build 867 páginas en `/, /en, /pt-br`; sitemap 874 URLs sin pt-pt; `npm run lint` 0. Commit: pendiente.

## Log

- L1 (2026-10-15): usuario pidió portugués para Brasil sin afectar otros idiomas (S1). Luego preguntó si pt-BR y pt-PT son iguales y pidió implementar "como lo harían las grandes empresas" (S2, S3).
- L2: verificado que pt-BR y pt-PT difieren en vocabulario (celular/telemóvel, ônibus/autocarro), gramática (gerundio vs "a + infinitivo"; você vs tu) y ortografía (AO90 aplicado más lento en PT). Fuentes: translated.com, beelinguapp.com, migaku.com.
- L3: precedente en `odd/tasks/multilenguaje.md`: es/en, 388 claves, catálogo de nombres, textos del juego, SEO. Esta feature sigue el mismo patrón.
- L4: `normalizarIdioma` hoy convierte todo lo que no es `es` en `en`; por eso pt-BR caería a inglés sin cambio.
- L5 (corrección): el "388 claves" de L3 es la cifra de `multilenguaje.md`, no de hoy. `es.js` tiene 428 claves.
- L6: pendiente de verificar en T7: los escritores afirman que "Poeira Estelar" es el término oficial de Fortnite en pt-BR. No está comprobado en esta sesión.
- L7: decisión tomada para T6 (reversible): no hay fuente de nombres de espíritus en portugués en el repo (el catálogo sale de una captura de fortnite.gg en inglés). pt-BR y pt-PT usan el nombre oficial en inglés del catálogo hasta tener una fuente en portugués. Pendiente de confirmar con el usuario.
- L9: T6 terminado. `textos.juego.json` tiene 99 entradas, no 83. Los nombres de tema (`pickThemeName`) usan la misma decisión temporal que espíritus y familias: pt usa el inglés. Pruebas de datos en `tests/data-i18n-*.test.js`. Revisar: formato numérico ("2.000" pt-BR, "2 000" pt-PT), "saque"/"pilhagem" para botín, "tempestade" para tormenta.
- L10: T5 terminado (escritor). Pruebas: 299/299 tras corregir tres pruebas existentes: dos esperaban 3 hreflang (ahora son 5: es, en, pt-BR, pt-PT, x-default) y una tenía un helper local que solo conocía /en (ahora usa `rutaSinIdioma` de core.js). Build: 1165 HTML (583 es/en + pt-BR/pt-PT). Revisado: en es/en solo cambian hashes de assets, hreflang pt, og:locale:alternate pt y el conmutador de cuatro idiomas. Guía y novedades pt sin texto en español. Revisar: títulos pt-PT de / y /amigos distintos de pt-BR para evitar duplicados.
- L8: hallazgo: las ramas `lang === 'en'` de SEO tratan pt como español (53 sitios en src/seo y prerender). T5 las reemplaza por un helper de idioma. Invariante: es y en deben producir el mismo HTML que la línea base de build antes de los cambios.
- L11 (2026-10-15): el usuario confirmó "Pato {Familia}" para las nueve variantes Quack de pt-BR (ej. "Pato Água", "Pato Klimbo"). Los nombres pt-BR de espíritus, familias y variantes salen del catálogo del sitio, sin "Elemental". Esta decisión reemplaza L7 para pt-BR; pt-PT sigue en inglés de forma temporal.
- L12: el selector de idioma pasa de botones sueltos a un disparador con icono de globo y menú desplegable con cada idioma en su lengua. Verificado en Chrome en móvil, escritorio y la cabecera de Amigos (menú sin recortes ni transparencias); 299/299 pruebas; build correcto.
- L13 (2026-10-15): usuario pidió retirar Portugal y priorizar Brasil. Original: "bueno quitemos portugal, prioricemos Brasil". Decisión: pt-PT deja de ser locale; `/pt-pt` y `/pt-pt/*` redirigen 301 a `/pt-br`; el portugués del navegador (incluida la etiqueta pt-PT) cae en pt-BR. Se conserva el catálogo pt-BR (nombres, textos y SEO) tal cual. Evidencia: 298/298 pruebas; build 867 páginas en tres idiomas; sitemap sin ninguna URL pt-pt; lint 0. Commit: pendiente.
