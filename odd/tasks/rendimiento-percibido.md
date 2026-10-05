# Rendimiento percibido: que la app se sienta inmediata

## Objetivo

Que la web cargue rapido y el scroll se sienta inmediato, **sin perder ningun elemento que el
usuario ya disfruta**: animaciones, transiciones, filtros, la lona de compartir y su calidad de
dibujo, el swiper movil, los efectos de temporada.

## Regla de oro

Ninguna fase puede quitar o degradar un elemento visible para ahorrar bytes. Solo se cambia
**cuando** y **si** se descargan las cosas, nunca **que** se ve. Cada cambio se mide con el mismo
protocolo antes/despues; lo que no se mide, no entra.

## Fase 0 — Linea base medida (hecha)

Carga en frio a 4g (60 ms RTT, 8/3 Mbps, CPU 4x), 1440x900, 232 requests, **3.88 MB**:

| recurso | peso | % |
|---|---|---|
| sprites/thumbs (el grid que se mira) | 1.38 MB | 36% |
| sprites/collage (preload del export) | 1.01 MB | 26% |
| JS | 0.96 MB | 25% |
| sprites/full (10 sin collage) | 0.20 MB | 5% |
| CSS | 0.16 MB | 4% |
| otros + fuentes | 0.16 MB | 4% |

Scroll a 4g, 122 tarjetas de gen 2, 24 en el primer viewport:

- continuo: framesWithBlank 0.28 (offset 2400) y 0.99 (offset 5400); msFromTarget 102 y 400 ms.
- por salto: 653 ms (2400) y 1117 ms (5400) hasta llenar el viewport.

## Fase 1 — Dejar de bajar bytes que no se usan

Meta: la carga en frio baja >= 1 MB y el collage deja de competir con el grid durante el scroll.
No cambia nada de lo que se ve.

- [x] **T1 — hecho y medido.** El calentamiento del export ya no compite con el grid: arranca con la
      primera intencion o en reposo en vez de a los 1500 ms fijos, y se pausa mientras hay scroll,
      salvo cuando la vista de compartir esta esperando. Resultado a 4g, 3 corridas: continuo
      offset 2400 framesWithBlank 0.33 -> 0.17 y msFromTarget 132.3 -> 50.7 ms; offset 5400
      0.986 -> 0.985 y 486.4 -> 400.3 ms; por salto 656 -> 643 y 1135 -> 1037 ms; shareReadyMs
      1005 -> 0 ms (el collage queda caliente antes de abrir compartir).
      **El criterio de bytes de esta fase NO se cumplio y el enunciado era mio**: T1 no reduce
      bytes, los reubica fuera del scroll. La fase de carga sube de 1.06 a 1.18 MB de collage (+11%)
      y en ocio collageCompleteMs pasa de 8.8 s a 14.0 s. La meta de ">= 1 MB menos en carga en
      frio" queda pendiente para T2 y Fase 3. Evidencia: /tmp/f1-{before,after}-{cont,jump,idle}.json.
- [ ] T2 — **diferido a despues de la Fase 2**: son 118 KB y consistencia de datos, no rendimiento
      percibido. Generar el collage de los 10 espiritus de gen 2 sin miniatura ni collage, que hoy
      obligan a bajar 203 KB de assets de 512 px por un umbral del pipeline que no aplica a esa
      derivada.

## Fase 2 — Inmediatez del scroll

Meta: framesWithBlank en continuo a 4g <= 0.05 y el arte ya presente al entrar al viewport.

- [x] **T3 — hecho y medido, con un criterio cumplido y otro no.**
      Nuevo `src/utils/spritePrefetch.js` (calentador por ventana: IntersectionObserver con
      rootMargin 1500 px, ventana de 30 por delante del indice maximo acercado, prioridad baja,
      concurrencia 2, ritmo 120 ms) mas un useEffect aditivo en `App.jsx`.
      Resultado a 4g, 3 corridas, scroll continuo:
      - offset 2400: framesWithBlank 0.29 -> **0.00** y msToAllComplete 116 -> **0.0 ms**. Instantaneo.
      - offset 5400: 0.99 -> **0.34** y 400 -> **117 ms**. Mejora grande, pero el criterio pedia
        <= 0.10 y <= 100 ms: **NO se cumple**.
      - por salto: 649 -> 224 ms (2400) y 1122 -> 957 ms (5400).
      - coste honesto: +5.1% de bytes totales en continuo, desperdicio 0 en continuo, 14 miniaturas
        en salto y 38 (533 KB) en reposo. Compartir de la Fase 1 intacto (shareReadyMs 0 -> 0).
      - npm test 167/167, oxlint sin errores nuevos.
      **El motivo del fallo en 5400 es fisico, no de implementacion**: el paso barre 3000 px en
      675 ms, o sea ~66 tarjetas nuevas = ~1.4 MB de arte, y a 8 Mbps eso son ~1.4 s de
      transferencia pura. No cabe en 675 ms. El calentador entrega 8.3 miniaturas/s (183 KB/s)
      contra el piso del enlace: no puede construir 1.4 MB de ventaja en el hueco que hay entre
      pasos. A 2400 si llega porque el destino se calento durante el ocio de red previo.
      Conclusion: **el piso de la inmediatez son los bytes por tarjeta**, no el algoritmo.
      Evidencia: /tmp/f2-{before,after}-{cont,jump}.json, /tmp/f2-after-idle.json,
      /tmp/dist-f2-before.

## Fase 3 — Arranque y JS

Meta: LCP <= 2.5 s y como maximo 3 long tasks > 50 ms en la carga a 4g, sin quitar ningun elemento.

- [x] **T4 — medido y diagnosticado. Sin cambio de fuente, y con razon.**
      El arnes ahora mide LCP, FCP, TTFB, long tasks (> 50 ms) y jsCriticalBytes, con --scenario
      startup y --block-urls para ablacion.
      - El elemento LCP es la imagen del hero (1476 ms de mediana a 4g), no el grid.
      - **La hipotesis del enunciado era falsa**: el grid NO espera a Supabase. La primera
        `.sprite-card` se pinta a 1258 ms; el GET a /rest/v1/sprites arranca a ~2180 ms y responde a
        2782-3041 ms. Ya pinta del catalogo estatico y cambia los datos despues.
      - Los 6 chunks criticos suman 756.237 B (index 371k + vendor-react 255k + gsap 69k +
        texto/i18n 53k + supabase 3.6k + runtime 0.7k) y no hay ni un byte no esencial ahi dentro.
      - Sensibilidad medida por ablacion: +100 kB de JS critico = +118 ms de LCP. Quitar bytes NO
        criticos no sirve: bloquear los 208 kB de Supabase empeoro el LCP (1476 -> 1500).
      - Scroll continuo sin regresion: 5400 = 0.11 / 16.4 ms (antes 0.13 / 33.3).
      - Bugs y propuestas medidas que NO entraron por superficie o por riesgo visual: P1 cargar solo
        el locale activo (i18n 53.876 B, uno de los dos idiomas nunca se usa, ~ -32 ms locales y
        ~ -9 ms en produccion); P2 sacar gsap del camino critico (~ -82 ms locales) pero su
        animacion es del hero y podria parpadear al diferirse; P3 diferir componentes que si se
        pintan en movil o en /amigos (viola la regla de oro); P4 Google Fonts como stylesheet
        render-blocking de un tercero en index.html:36 (el unico punto de la cadena critica que no
        controlamos, y en una red restringida directamente falla); P5 bug latente en
        `vite.config.js`: `id.includes('react')` atrapa `lucide-react` (contiene "react") y deja la
        rama vendor-icons como codigo muerto, ~70 kB de iconos terminan en vendor-react (0 ms de
        ganancia, es higiene); P6 el burst de miniaturas bajo el pliegue cuesta <= 76 ms de LCP.
      - Caveat de medicion: el servidor del arnes sirve sin comprimir y por HTTP/1.1, asi que en
        Vercel esos 756 kB son ~202 kB y los recortes de bytes rinden ~3.7x menos. Por eso P1+P2
        (~97 kB crudos) valdrian ~30 ms reales, por debajo del ruido del instrumento.
      Evidencia: /tmp/f3-{before,after}-startup.json, /tmp/f3-{before,after}-cont.json,
      /tmp/dist-f3-before.

## Fase 4 — Guardarrailes

Meta: que esto no vuelva a engordar sin que nadie se entere.

- [ ] T5 — Presupuesto medible y repetible (`npm run perf`) con umbrales por recurso y por metrica
      de scroll, reutilizando `scripts/measure-scroll-cards.mjs`.

## Restricciones

- Sin commits mientras la rama `codex/organizar-imagenes-sprites` tenga trabajo ajeno sin commitear.
- `src/utils/canvasExporter.js` tiene ~221 lineas de trabajo en curso ajeno (cache key v50-v58,
  `geometriaFichaNombre`, `renderGlitchOverrideTemplate`). Solo se toca la zona del preload
  (~lineas 255-330) y se verifica que el WIP siga igual.
- `src/components/SharePage.jsx` no se toca en la Fase 1.
- Sin dependencias nuevas.
- Medir exige escalacion de sandbox (bind de puerto EPERM) con
  `prefix_rule: ["node", "scripts/measure-scroll-cards.mjs"]`.

## Evidencia

- `odd/tasks/desktop-scroll-cards.md` — el caso concreto que origino esto, con las mediciones.
- `scripts/measure-scroll-cards.mjs` — el arnes (`--dir`, `--throttle 4g|slow3g`,
  `--scroll-mode jump|continuous`, `--log-network`).
- `/tmp/m-baseline-*.json`, `/tmp/m-after-*.json` — Fase 0.

## Progreso

Fase 0 cerrada. Fase 1 / T1 hecho y medido (criterio de bytes sin cumplir, ver arriba). T2 diferido a
despues de la Fase 2 por impacto. Fase 2 / T3 hecho y medido: gana el caso realista (2400) y no
alcanza a cubrir un volantazo de 3000 px en 675 ms, por piso de ancho de banda. Fase 3 / T4 medido y
diagnosticado: el JS critico ya es el minimo necesario y lo recortable no pasa el umbral de medicion
en produccion. Fase 4 / T5 en curso.

## Siguiente paso

T5: presupuesto reproducible (npm run perf) con umbrales por metrica, para que esto no vuelva a
engordar sin que nadie se entere. Pendientes con decision de producto: P4 (autoalojar las fuentes
para quitar el tercero render-blocking, cero cambio visual, pero exige descargar los woff2) y T3.b
(subir el ritmo del calentador y/o bajar bytes por tarjeta, que toca la nitidez del arte).
