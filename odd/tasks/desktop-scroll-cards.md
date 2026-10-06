# Tarjetas del grid en escritorio: el sprite aparece tarde al hacer scroll

## Estado

Medicion cerrada, causa identificada, ningun cambio de fuente aplicado.

## Objetivo

Que cada tarjeta del grid de escritorio muestre su sprite sin el hueco en blanco al hacer scroll.

## Sintoma reportado

En escritorio (grid de 6 columnas) las tarjetas entran al viewport con su gradiente, nombre y
boton, pero el arte aparece uno o varios frames despues. En el primer render de la pagina no ocurre.

## Lo que se probo y NO funciono

Hipotesis inicial: `content-visibility: auto` + `contain-intrinsic-size: 0 245px` +
`contain: layout style` en `.sprite-card` (escritorio) dejaba las tarjetas fuera de pantalla sin
renderizar, y dentro de ese subarbol omitido una imagen `loading="lazy"` no entra al arbol de
render, asi que su peticion arrancaba justo al entrar al viewport. Se aplico el arreglo (quitar el
diferido + `EAGER_THUMBS = 18`) y se midio:

- localhost, scroll por salto, cache fria: 24/24 tarjetas del viewport en blanco antes y despues;
  35-55 ms hasta tenerlas todas. Bajo el umbral perceptible: no explica el sintoma.
- 4g sintetico (60 ms RTT, 8/3 Mbps, CPU 4x), salto: +-20 ms, ruido.
- 4g sintetico + CPU 4x, scroll continuo: **30-83 ms MAS lento en 3/3 corridas**
  (102 -> 132 ms en offset 2400; 400 -> 483 ms en offset 5400), rangos sin solapar, mismos o menos
  bytes transferidos.

Conclusion: sin beneficio medido y con una regresion consistente. **Revertido**: `git diff` de los
dos archivos queda vacio y `npm test` sigue en 167/167. Mecanismo probable de la regresion:
`content-visibility: auto` limita que imagenes entran al arbol de render y por tanto cuales se
piden; al quitarlo el navegador abre la banda de peticiones y compite por el mismo ancho de banda.

## Hipotesis descartadas con datos

Cadena de 404 en las 34 miniaturas faltantes: **falsa**. `getSpriteThumb()`
(`src/data/spritesData.js:17`) devuelve `null`, no una URL `thumbs/`, asi que el `src` cae a
`sprite.image`. De los 34 ids sin manifest, 28 tienen arte propio (200) y solo 6 no tienen imagen
(`fishy_holofoil`, `fishy_gem`, `striker_rift`, `striker_gem`, `boss_holofoil`,
`seven_gem`), todos de gen 1, y la vista por defecto arranca en gen 2 (`App.jsx:216`).
`count404 = 0` en las 24 celdas medidas.

## Causa real (medida)

El hueco dura lo que tarda transferir **330-440 KB de miniaturas por paso de scroll**: es ancho de
banda, no una latencia oculta de render. A 4g sintetico: 653 ms (offset 2400) y 1117 ms
(offset 5400) hasta tener todo el viewport listo; en scroll continuo, 28 % y 99 % de los frames con
al menos una tarjeta sin arte.

Competidor grande y arreglable: `App.jsx:300-327` dispara a los **1500 ms** una precarga de
~**3.1 MB** (142 imagenes del exportador, en tandas de 4) que sigue activa hasta ~8.5 s bajo 4g y
solapa con cualquier scroll temprano.

Coste secundario real: el manifest de miniaturas esta viejo (`sprite_thumbs.json` escrito 17:01;
assets nuevos en `public/sprites` a las 22:01). 34 sprites cargan el asset completo (28 KB) en vez
de la miniatura (16 KB).

## Fuera de alcance

- El `filter` de las tarjetas sin atrapar (decision de diseno, no es la causa).
- Virtualizar el grid.
- `src/components/SharePage.jsx` y `src/utils/canvasExporter.js`: trabajo en curso ajeno.

## Restricciones

- Sin commits: la rama `codex/organizar-imagenes-sprites` tiene cambios ajenos sin commitear.
- `.git` es read-only en este perfil: revertir con `apply_patch`, no con `git checkout`, o pedir
  escalacion.
- El bind de puerto se bloquea con `EPERM` en la sandbox: medir exige escalacion con
  `prefix_rule: ["node", "scripts/measure-scroll-cards.mjs"]`.

## Tareas

- [x] T1 — Arnes de medicion `scripts/measure-scroll-cards.mjs` (`--dir`, `--throttle 4g|slow3g`,
      `--scroll-mode jump|continuous`, `--log-network`).
- [x] T2 — Linea base medida (localhost y 4g, salto y continuo, 3 corridas, cache fria).
- [x] T3 — Quitar el render diferido de `.sprite-card`: medido, sin beneficio, revertido.
- [x] T4 — `EAGER_THUMBS = 18`: medido, sin beneficio, revertido. Ademas no cubria el viewport
      real medido: 24 tarjetas a 1440x900.
- [x] T5 — Medir despues con el mismo protocolo.
- [x] T6 — `npx oxlint` (pass) y `npm test` (167/167 pass).
- [ ] T7 — Prefetch propio por delante del viewport y volver a medir.
- [ ] T8 — Decidir el destino de la precarga del exportador (~3.1 MB a los 1500 ms).
- [ ] T9 — Regenerar las 34 miniaturas faltantes.

## Criterios de aceptacion (para T7)

- Con `--throttle 4g --scroll-mode continuous`, `framesWithBlank / framesSampled` debe bajar de
  forma consistente frente a la linea base (hoy 0.28 en offset 2400 y 0.99 en offset 5400).
- Sin regresion en `npm test` ni en `npx oxlint`.

## Comprobaciones

- `node scripts/measure-scroll-cards.mjs --dir <dist> --throttle 4g --scroll-mode continuous --runs 3 --log-network --out <json>`
- `npx oxlint`
- `npm test`

## Evidencia

- `/tmp/m-baseline-jump.json`, `/tmp/m-baseline-cont.json`, `/tmp/m-after-jump.json`,
  `/tmp/m-after-cont.json` — 4g sintetico, 3 corridas, cache fria.
- `/tmp/scroll-baseline.json`, `/tmp/scroll-after.json` — localhost sin throttle.
- `/tmp/dist-baseline/` — build sin el arreglo. `/tmp/fix-scroll-cards.patch` — el arreglo, revertido.

## Progreso

Diagnostico cerrado. El arbol de trabajo quedo como estaba mas el arnes y este documento.

## Siguiente paso

T7: implementar el prefetch por delante del viewport y medir en 4g continuo. T8 depende de tu decision.

