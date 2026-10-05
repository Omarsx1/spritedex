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

- [ ] T4 — Medir LCP, long tasks y que bloquea el primer pintado; dividir y diferir lo que no es
      critico (el JS es el 25% de la carga en frio).

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
alcanza a cubrir un volantazo de 3000 px en 675 ms, por piso de ancho de banda.

## Siguiente paso

T3.b (opcional): subir el ritmo del calentador en ocio (120 ms -> ~40 ms, ventana 30 -> 60) para
llenar mas rapido la ventaja, y/o bajar bytes por tarjeta. Lo segundo toca la nitidez del arte:
decision de producto. Fase 3 / T4: LCP, long tasks y que bloquea el primer pintado (el JS es el 25%
de la carga en frio).
