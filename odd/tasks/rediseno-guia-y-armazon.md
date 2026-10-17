# Rediseño de la guía y del armazón de páginas estáticas

**Feature**: `rediseno-guia-y-armazon`
**Rama**: `feat/rediseno-guia-y-armazon` (ramificada desde `feat/locales-pt`, que está 7 commits
adelante de `main` sin divergencia)
**Estrategia de entrega**: `ask-on-risk` (por defecto)
**Runner de pruebas**: `node --test` (`pnpm test`), `pnpm lint` (oxlint), `pnpm build`

## Specs

- **S1** — Petición literal: *"ahora quiero que
  https://spritedex.gg/guia-espiritus actualices esa página que se vea 100% moderna y
  profesional"*. Alcance confirmado por el usuario: *"Todo el armazón (recomendado)"* → el
  rediseño entra en `src/seo/plantilla.js`, que viste **la guía, `/acerca`, `/novedades` y las
  564 fichas de espíritu**, no solo la guía. La guía es el caso que se mira con lupa.
- **S2** — Petición literal: *"corrige todos los temas de accesibilidad"*. Los seis fallos
  verificados en el HTML generado, con su criterio WCAG:

  | # | Fallo | Criterio | Evidencia recogida |
  | :--- | :--- | :--- | :--- |
  | 1 | Falta el enlace "saltar al contenido" | 2.4.1 (A) | `grep -c skip dist/guia-espiritus/index.html` → `0` |
  | 2 | `<main>` sin `id`: no hay destino para el salto | 2.4.1 (A) | `<main>` pelado, sin atributos |
  | 3 | Cero `:focus-visible` en el CSS del armazón | 2.4.7 / 2.4.11 | `grep -c focus` sobre el HTML → `0` |
  | 4 | `<th>` sin `scope` en la tabla de rarezas | 1.3.1 (A) | `<th>`, `<th>` sin atributos |
  | 5 | `aria-label="Ruta"` en español también en `/en` y `/pt-br` | 3.1.1 / 3.1.2 | hardcodeado en `plantilla.js:158` |
  | 6 | Objetivos del conmutador de idioma bajo 24×24 px | 2.5.8 (AA, WCAG 2.2) | `nav.idiomas { font-size: 14px }` sin padding |

- **S3** — No romper el SEO ya construido (fases 1–5). Debe seguir cumpliéndose: exactamente un
  `<h1>`, un `<link rel="canonical">` autorreferente, cuatro `hreflang`, **un solo** bloque
  `application/ld+json`, paridad exacta entre las preguntas del `FAQPage` y las visibles, y
  `porRareza.length + 1` filas en la tabla. Las aserciones que sean frágiles por construcción
  (regex que exigen `<h1>` sin atributos, o `class="faq"` exacta) se **actualizan preservando la
  intención**, nunca se borran.
- **S4** — Las páginas estáticas siguen **sin JavaScript**: hoy la única `<script>` es la del
  JSON-LD. Toda mejora visual debe ser CSS puro y degradar bien sin JS (nada de revelados por
  scroll ni de animación que dependa de un script).
- **S5** — Las dos caras de la guía quedan coherentes. `GuiaPage.jsx` (la vista dentro de la app,
  montada desde `App.jsx:1325`) y `htmlGuia` (el HTML estático) salen del mismo modelo
  (`src/seo/guia.js`); rediseñar una sola las contradice.
- **S6** — No regresar Core Web Vitals (fase 3 del SEO). **Cero peticiones externas nuevas** en las
  páginas estáticas: las fuentes de marca (`BurbankBigCondensed-Black.woff2`) ya viven en
  `public/` y el cuerpo usa la pila del sistema. Nada de `fonts.googleapis.com`.
- **S7** — Contraste: ya cumple AA con holgura y **no se toca**. Medido: texto `#e8ecf8` 16.97:1,
  apagado `#9aa4bd` 8.03:1, acento `#00F0E8` 13.96:1, texto del CTA sobre acento 13.22:1.

## Tareas

- **T1** Documento de feature. *(ruta: inline — commit `6d151a4`)*
- **T2** Accesibilidad estructural del armazón: salto al contenido, `main#contenido` enfocable,
  `:focus-visible` global, `scope` + `<caption>` en la tabla, `aria-label` de las migas por
  idioma y objetivos de 24×24 px. *(S2, S3 — ruta: inline — commit `b07739e`)*
- **T5** (ADELANTADA) La vista de la app: superficie legible sobre el arte de temporada,
  tipografía de marca y `<caption>` en la tabla. *(S1, S2, S5 — ruta: inline — commit
  `02b462f`)*
- **T3** Sistema visual del armazón estático: Burbank para la marca y los títulos, escala
  tipográfica, superficies con profundidad real, ritmo vertical, tabla, FAQ y CTA con estados
  hover/active/focus. *(S1, S4, S6, S7 — ruta: inline — pendiente)*
- **T4** La guía: índice de secciones con anclas y estructura semántica (`section` +
  `aria-labelledby`). *(S1 — ruta: inline — pendiente)*
- **T6** Verificación completa: `pnpm test`, `pnpm lint`, `pnpm build`,
  `node scripts/verificar-seo.mjs --local` y comprobación de foco con teclado. *(S3, S6 — ruta:
  inline — pendiente)*

Presupuesto de líneas (heurística orientativa, no criterio de aceptación): ~450 líneas
autoradas entre CSS, plantilla, contenido y pruebas. Es un aviso, no un tope: si la solución
correcta lo supera, se explica y se sigue. Si el conteo se acerca a 400, se aplica la estrategia
`ask-on-risk` **antes** del commit siguiente.

## Log

- **L1** Petición original del usuario, verbatim: *"de acuerdo ahora entiendo esa parte de la
  arquitectura, ahora quiero que https://spritedex.gg/guia-espiritus actualices esa página que se
  vea 100% moderna y profesional, corrige todos los temas de accesibilidad."*
- **L2** Decisión de alcance (respuesta del usuario a la pregunta de arranque): *"Todo el armazón
  (recomendado)"*. Se descarta rediseñar solo la guía: duplicaría CSS y dejaría la guía como una
  isla visual entre sus hermanas, que comparten `src/seo/plantilla.js`.
- **L3** Exploración previa, con evidencia. Hallazgos que definen el trabajo:
  - La página tiene **dos caras**: el HTML estático que genera `src/seo/contenido.js` → `htmlGuia`
    (no carga React: `dist/guia-espiritus/index.html` solo tiene la `<script>` del JSON-LD) y la
    vista dentro de la app `src/components/GuiaPage.jsx` (montada en `App.jsx:1325`).
  - **El mayor problema visual no es el color ni el layout: es la tipografía.** El HTML estático
    usa `font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (`plantilla.js:84`),
    la fuente por defecto del sistema, mientras la app usa Burbank/Outfit/Inter. Sin eso, la
    página no puede verse "profesional".
  - **El contraste ya cumple AA** (números en S7). No había nada que arreglar ahí, y decirlo con
    medidas evita "arreglar" lo que no estaba roto.
  - La vista React de la guía ya está **mejor** que el HTML estático: usa `scope="col"` y
    `scope="row"`, `font-variant-numeric: tabular-nums` y `:focus-visible` en el resumen del FAQ
    (`src/styles/index.css:9959+`). Los fallos #3 y #4 son el HTML estático habiéndose quedado
    atrás, no un descuido compartido.
- **L4** Decisión de tipografía, con su razón: Burbank autohospedada (`public/`, ya usada por la
  app vía `@font-face` en `src/styles/index.css:2`) para la marca y los títulos; el cuerpo sigue
  en la pila del sistema. Se descarta enlazar Google Fonts en las páginas estáticas: es una
  petición que bloquea el render y regresaría los Core Web Vitals que arregló la fase 3 del SEO
  (S6). Los títulos cargan la identidad; el cuerpo prioriza velocidad.
- **L5** Decisión sobre el FAQ, con su compromiso explícito: se conserva `<details>/<summary>`
  nativo (sin JS, contenido en el DOM, paridad con el `FAQPage`) y se le da tratamiento visual
  premium. La skill de rediseño desaconseja los acordeones de FAQ por genéricos; aquí se acepta a
  cambio de no romper el marcado ni el SEO, y porque en móvil reduce mucho el scroll. Convertirlo
  a una rejilla de dos columnas queda como alternativa si el usuario lo pide.
- **L6** Tareas creadas: 6. T1 es el propio documento.
- **L7** Corrección de un error mío de diagnóstico, con la evidencia. Afirmé que una visita
  directa ve la página estática, y eso es cierto en producción —comprobado con
  `curl -s https://spritedex.gg/guia-espiritus`: sirve el HTML prerenderizado y su único
  `<script>` es el del JSON-LD, sin bundle—, pero **NO en `pnpm dev`**: Vite hace fallback al SPA
  y `/guia-espiritus` lo pinta React (`GuiaPage`). El usuario reportó *"lo sigo viendo igual, no
  sé qué está modificando"* mirando `localhost:5173`, y tenía razón: T2 vive en la página
  estática y en el dev server no se ve. Debí advertirlo antes de empezar.
  Para ver la estática en local: `pnpm build && pnpm preview`.
- **L8** Reordenación: T5 pasa DELANTE de T3 y T4. Razón: el usuario valida con sus ojos en
  `pnpm dev`, donde solo se ve la vista React; entregar primero T3 (estática) le habría dado otra
  ronda de "no veo cambios". Además la app es el sistema de diseño de referencia —tiene los
  tokens, los `@font-face` y temas por temporada—, así que conviene fijar ahí la identidad y
  luego llevarla al armazón estático.
- **L9** Diagnóstico visual de la captura del usuario, que resultó ser el defecto de fondo:
  `.guia` no tenía superficie propia, así que el texto caía **directo sobre el arte de temporada**
  (la luna, las ramas). El `.guia__lead` va en `--text-muted` (#8b949e): sobre un fondo oscuro
  cumple, pero sobre la luna clara desaparece. El contraste dependía de qué hubiera detrás.
  Arreglo: la guía pasa a ser una superficie con degradado casi opaco, borde y sombra.
  **Sin `backdrop-filter`** a propósito: `.fnm-forest` anima `opacity` en bucle de 9 s
  (`index.css:8342`) y desenfocar esa capa en cada cuadro es caro en móvil.
- **L10** Identidad tipográfica de la guía: el título y los `h2` pasan a `--font-fortnite`
  (Burbank, la misma del hero y del logotipo) en **las dos caras**. Así S5 se cumple de verdad:
  antes la estática iba a usar Burbank para los títulos y la app usa Outfit, y las dos versiones
  habrían quedado distintas. Se descarta cargar Outfit o Inter en las páginas estáticas:
  rompería S6 (cero peticiones externas) y los Core Web Vitals de la fase 3.
- **L11** También en la vista de la app: `<caption>` en la tabla de rarezas, alimentado por el
  mismo `tabla.titulo` del modelo compartido que usa la estática. La app tenía `scope` en las
  celdas pero le faltaba el título.
- **L12** Verificación de lo observable: `node --test` 305/305, `pnpm lint` con salida 0 (los
  warnings son previos y de otros archivos), `pnpm build` con 867 páginas y 874 URLs en el
  sitemap. **La apariencia no la he visto**: la valida el usuario en `localhost:5173`. T5 queda
  con los checks automáticos en verde pero pendiente de esa mirada.
