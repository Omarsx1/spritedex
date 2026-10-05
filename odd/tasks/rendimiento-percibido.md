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

+## Fase 5 — Comportamiento de web normal (sin artefactos) y calor

Reporte del usuario: "entro, hago scroll y veo todo normal; scrolleo hacia arriba y veo huecos y
tarjetas sin cargar". Firma de @@content-visibility: auto@@: el navegador descarta el render de las
tarjetas que salen de pantalla, aunque su imagen ya este cargada, y las vuelve a dibujar al entrar.

**Cambio aplicado** (@@src/styles/index.css@@): @@.sprite-card@@ ya no tiene @@content-visibility@@,
@@contain-intrinsic-size@@ ni @@contain@@, en TODAS las anchuras, y se elimino el media query de
768px que solo lo apagaba en movil. Con esto la grilla se comporta como una web normal.

**Lo que la medicion NO pudo hacer (honesto):** el arnes por pixeles no reprodujo el sintoma en
ninguno de los dos builds. Con el guardarrail "la region cambio de verdad" el conteo es 0/26 en los
dos; los 1-3 flags por 26 son falsos positivos cuantificados (overlay fijo del header, franjas de
borde) y en el control asentado son 0/180. **No puedo afirmar que el cambio arregle el sintoma del
usuario.** La causa de la ceguera es la resolucion temporal: una captura por posicion con ~300 ms de
latencia se pierde cualquier hueco mas corto, y el arnes es de escritorio sin GPU. Verificar en
movil real queda pendiente y no lo puedo hacer desde aca.

**Lo que SI midio el arnes (proxy de calor, CPU 4x, mismo gesto):**

| metrica por gesto | con render diferido | sin render diferido | delta |
|---|---|---|---|
| TaskDuration por gesto | 2188,0 ms | 2286,8 ms | +4,5% |
| TaskDuration por segundo de scroll | 493,4 ms/s | 523,4 ms/s | **+6,1% (rangos sin solapar)** |
| LayoutDuration | 72,3 ms | 32,6 ms | **-54,8%** |
| LayoutCount | 64 | 34 | -46,9% |
| RecalcStyleDuration | 175,0 ms | 151,3 ms | -13,5% |
| long tasks > 50 ms | 0 | 0 | = |
| capas compuestas | 35 | 35 | = |

Conclusion: quitar el render diferido **cambia trabajo de layout por trabajo de pintado**:
+~30 ms de CPU por segundo de scroll y la mitad de layout. No es gratis, es chico, y es medible.
Los 12 presupuestos de @@npm run perf@@ siguen en 12/12 PASS (firstSpriteCardMs +4 ms, ruido) y T3
mejora (5400: 0,17 -> 0,07 y 50,8 -> 16,6 ms).

**El calor NO estaba en las tarjetas.** @@content-visibility@@ nunca ahorro pintado de lo que esta
fuera de pantalla (el navegador no lo pinta igual): ahorraba layout y estilo. Las fuentes reales de
calor sostenido, inventariadas en el codigo:

1. **@@filter@@ por tarjeta** (2 inline en @@SpriteCard.jsx@@): @@grayscale(55%) opacity(0.68)
   brightness(1.2) contrast(1.15)@@ en las no atrapadas y @@drop-shadow(0 6px 12px)@@ en las
   atrapadas. Un filtro fuerza una pasada de rastro por tarjeta. Es el coste dominante por tarjeta.
2. **31 animaciones @@infinite@@**, varias encendidas siempre: @@hero-glitch-r/b@@ con
   @@steps(1, end) infinite@@, @@titleShimmer@@, @@heroFloat@@, @@heroSpin@@, @@scanMove@@,
   @@lineGrow@@ x4, @@glitch-border-pulse@@, @@pulse@@. Repintan de forma continua: calor sostenido
   con scroll o sin el.
3. **80 @@backdrop-filter@@**: la propiedad mas cara en GPU movil antigua. Si alguna queda visible
   siempre, es trabajo de GPU constante.
4. **@@batSwarm.js@@**: canvas a pantalla completa con bucle de @@requestAnimationFrame@@ escalado por
   DPR. Carga sostenida de CPU/GPU considerable en un telefono, y esta activo por temporada.
5. **@@will-change@@ en 15 sitios** y 135 @@box-shadow@@: capas y pintado.

Siguiente paso propuesto, en este orden y preservando los elementos visuales:
T6: reemplazar el @@filter@@ por tarjeta por una tecnica de pintado barato (mismo efecto a la vista).
T7: pausar las animaciones @@infinite@@ cuando no estan en pantalla + respetar @@prefers-reduced-motion@@.
T8: auditar los @@backdrop-filter@@ siempre visibles y el canvas del enjambre (bucle en pausa cuando
    no se ve, tope de DPR en equipos humildes).
T9: calidad adaptativa por equipo (saveData, hardwareConcurrency, deviceMemory) para que los equipos
    capaces no pierdan nada y los antiguos no se calienten.
Cada uno se mide con el proxy de CPU por gesto del arnes, con el objetivo de recuperar mas calor del
que costo quitar el render diferido.

## Fase 4 — Guardarrailes

Meta: que esto no vuelva a engordar sin que nadie se entere.

- [x] **T5 — hecho.** `npm run perf` (`scripts/perf-budget.mjs` + `perf/budget.json`) corre el
      protocolo fijo (arranque + scroll continuo en 2400 y 5400, 4g, 3 corridas), compara 12
      presupuestos con nota de origen y sale con codigo distinto de 0 si alguno se pasa.
      Verificado: 12/12 PASS con los presupuestos reales (exit 0) y 1 FAIL con exit 1 cuando se
      incumple un umbral a proposito (con `--budget` a un archivo alternativo, sin tocar el real).
      - Margen consumido: en la corrida real el offset 5400 salio peor que en la calibracion
        (0.17 de ratio y 50.1 ms, contra 0.07 y 0 que se usaron como linea base). Pasa, pero con
        menos aire del que dice la nota. Si se acerca otra vez, el proximo paso es T3.b (menos bytes
        por tarjeta), no subir el umbral.
      - Lo que NO cubre: movil/swiper, la lona de compartir, shareReadyMs, count404, long tasks
        durante el scroll, slow3g, otras rutas (amigos, admin), SEO/prerender, memoria/GPU.
      - Sin cableado en CI: nadie corre `npm run perf` automaticamente y no se guarda linea base
        por commit.

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

Fases 0 a 4 cerradas.

- Fase 0: linea base medida (3.88 MB en frio a 4g, con el desglose por recurso).
- Fase 1 / T1: el preload del export deja de competir con el scroll (frames con hueco 33% -> 17% y
  132 -> 51 ms en 2400). No reduce bytes: los reubica. T2 (collages de 10 sprites) queda diferido.
- Fase 2 / T3: calentador por delante. Caso realista resuelto (2400: 0% de frames con hueco y 0 ms);
  el volantazo de 3000 px en 675 ms no cabe en 8 Mbps, es piso fisico.
- Fase 3 / T4: medido y diagnosticado. El grid no espera a Supabase, el JS critico ya es el minimo y
  lo recortable no pasa el ruido en produccion.
- Fase 4 / T5: presupuesto reproducible con 12 umbrales y fallo demostrado.
- Imagenes: miniaturas y collage a WebP q70 (-11%), sin perdida de alfa.

## Siguiente paso

Pendientes, todos con decision de producto o de infraestructura:

1. **P4 (el mayor que queda en la cadena critica)**: autoalojar Inter y Outfit para quitar el
   stylesheet render-blocking de un tercero (index.html:36). Cero cambio visual, pero exige bajar los
   woff2 y hoy la red esta restringida.
2. **T3.b**: subir el ritmo del calentador (120 -> ~40 ms) y/o bajar bytes por tarjeta. Lo segundo
   toca la nitidez del arte.
3. **T2**: collages de los 10 sprites sin derivada (~118 KB y consistencia de datos).
4. **P1/P2**: cargar solo el locale activo (~ -9 ms reales) y sacar gsap del camino critico
   (~ -22 ms reales, con riesgo de parpadeo en la animacion del hero). Medidos antes de tocar nada.
5. **Cablear `npm run perf` en CI** con una linea base por commit.
