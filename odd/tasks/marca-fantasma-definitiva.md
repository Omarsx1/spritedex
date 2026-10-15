# Marca definitiva: el fantasma como logotipo (Spritedex)

**Feature**: `marca-fantasma-definitiva`
**Estado**: PARKED — la dirección no fue aprobada; la app sigue con el monograma F
**Fecha**: 2026-10-08

## Objetivo

Convertir el fantasma de `public/Spritedex.svg` en una **marca definitiva** (logotipo + sistema)
que aguante 16 px de favicon, 34 px de navbar y 512 px de icono, en un solo color cuando haga
falta, y que se lea como marca de empresa y no como calcomanía.

## Problema (diagnóstico del asset actual)

1. **El contorno es una copia desplazada**, no un trazo: a tamaño pequeño lee como error de
   registro de imprenta (efecto calcomanía medido en la comparación de color).
2. **Geometría irregular**: silueta asimétrica, ojos de distinto eje y tamaño, borde inferior
   ondulado "dibujado a mano".
3. **No tiene sistema**: no hay versión monocroma, ni variante para tamaños mínimos, ni lockup
   con el wordmark, ni reglas de espacio de respeto.
4. **Falla a 16 px**: los ojos se cierran y el borde inferior se convierte en ruido.
5. **Peso óptico descentrado** dentro de su caja.

## Por qué ahora

El usuario decidió que el fantasma es la marca (hace referencia a espíritus) y pidió elevarla
"como las grandes empresas". La investigación del patrón de Epic ([designyourway](https://www.designyourway.net/blog/fortnite-logo/))
confirma la regla de marca: **la forma del logotipo es fija; lo que cambia por temporada es el
tratamiento (color, sombra, peso) y la capa que lo rodea (key art, lockup del evento, paleta, UI)**.
Es decir: hace falta una forma sólida y un sistema, no un asset por temporada.

## Alcance

- Reescribir la geometría de la marca (vectorial, geométrica, simétrica donde debe serlo).
- Entregar el sistema de archivos: principal, monocroma, variante pequeña, icono de app.
- Regenerar los derivados rasterizados (favicon.png, icon-192, icon-512, apple-touch, og).
- Aplicarlo en la app (navbar 34 px, footer 28 px, favicon 16/32) sin tocar layout.
- Hoja de marca con tamaños, espacio de respeto, color, mono y usos incorrectos.

## Fuera de alcance

- Rediseñar el wordmark del hero (FORTNITE/FORTNITEMARES): se queda como está.
- Cambiar la paleta de temporada o el comportamiento de la cinemática.
- Cualquier cambio en móvil más allá de la marca (el swiper y el layout móvil son intocables).

## Restricciones

- Sin atribución de IA en commits. Conventional Commits.
- La marca debe leerse **fuera** de temporada (no puede ser un disfraz de Halloween).
- El color de marca es `#E80653` (carmesí), decidido y verificado in/out of season.
- Cualquier uso dentro de la app mantiene la caja de 34x34 px: cero cambios de layout.

## Tareas

- [x] **T1** Documento de feature + espejo en Engram. *(ruta: inline)*
- [x] **T2** Geometría de la marca y hojas de propuesta (3 direcciones, 2 tratamientos, 2 pasadas). *(ruta: inline + verificación visual real)*
- [x] **T3** Sistema de archivos: principal, mono blanca, mono negra, icono con variante de tamaño mínimo, y 5 derivados PNG. *(ruta: inline)*
- [x] **T4** Aplicar en la app y verificar a tamaño real (temporada y base, escritorio y móvil). *(ruta: inline)*
- [x] **T5** `MARCA.md` + `scripts/marca-iconos.mjs` (regeneración reproducible de los derivados). *(ruta: inline)*
- [x] **T6** Memoria + limpieza de temporales. *(ruta: inline)*

**Commits**: pendientes a propósito. La dirección de marca la confirma el usuario y la rama
actual (`codex/tinte-tema-maxeada`) es de otra feature: no se mezcla.

## Criterios de aceptación

1. La marca se lee a **16 px** sobre pestaña clara y oscura.
2. Misma marca reconocible a 34 px y a 512 px, sin variantes que parezcan logos distintos.
3. Existe versión **monocroma** usable a un solo color.
4. Cero cambio de layout: la caja sigue siendo 34x34 en navbar y 28x28 en footer.
5. `npx oxlint` limpio y render verificado en el navegador real.

## Estrategia de entrega

- Pronóstico de líneas: ~250 líneas autoradas (SVGs + CSS puntual + hoja de marca + iconos regenerados).
- Estrategia: `ask-on-risk` (por defecto). Al pasar ~400 líneas, preguntar por cadena de PRs.
- Checks por tarea: render real en navegador (headless Chrome) + `oxlint`.

## Evidencia

- **T2** Propuesta a 3 direcciones y segunda pasada con 4 tratamientos; comparación final A vs D a
  16 / 24 / 32 px rasterizados de verdad (ampliados 8x con pixelado, sin suavizado que engañe) y a
  34 px 1:1 sobre el fondo real de temporada y del tema base.
- **T2 (hallazgo)** El contorno carmesí se come el cuerpo a 16 px y lee como calcomanía. La
  solución que sí lleva el color de marca al tamaño mínimo es **los ojos en carmesí**: se leen a
  16 px y no inventan un borde que no existe.
- **T2 (hallazgo)** Dirección D (encapuchada con barrido) conserva mejor la idea del asset
  original, pero a 16 px pierde la lectura de fantasma y parece un huevo. Se descarta: la marca
  tiene que leerse al tamaño mínimo.
- **T3** `public/Spritedex.svg` (blanco + ojos `#e80653`), `public/spritedex-blanco.svg`,
  `public/spritedex-negro.svg`, `public/favicon.svg` (recuadro `#060714` y ojos de la variante
  mínima, 24 x 36) y los 5 PNG regenerados a 64 / 192 / 512 / 180 / 180 px.
- **T4** Render verificado en la app real: cabecera escritorio y móvil, footer 28 px, temporada y
  tema base. La caja sigue siendo 34 x 34: cero cambio de layout. `oxlint` limpio en los archivos
  tocados y en el script nuevo.
- **T5** `scripts/marca-iconos.mjs` probado: reproduce los 5 PNG desde `favicon.svg`.

## Resultado (2026-10-08) — PARKED

El usuario **no aprobó** la dirección ("no me gustó") y pidió seguir con el monograma **F**
mientras la retoma más adelante. Se revirtió todo lo aplicado:

- `src/components/Navbar.jsx`, `src/components/Footer.jsx`, `src/styles/index.css` y los 6
  iconos de `public/` volvieron a HEAD con `git checkout` (el árbol queda limpio).
- El trabajo de marca se guardó en **`assets-src/marca/`**: `Spritedex.svg` (la marca
  propuesta), `spritedex-blanco.svg`, `spritedex-negro.svg`, `favicon-icono.svg`,
  `marca-iconos.mjs`, `MARCA.md` y `Spritedex-fantasma-original.svg` (el asset original del
  usuario, que se sobrescribió y era untracked: sin esta copia no habría forma de recuperarlo).
- Ninguno de esos archivos se sirve ni está referenciado por la app.

Lo que sí queda aprendido para la próxima vuelta:

1. El contorno de color no sobrevive a 16 px (se come el cuerpo y lee a calcomanía); los ojos en
   el color de marca sí.
2. Rasterizar a tamaño real es el único juez: a 96 px todo combina.
3. Una forma más original (encapuchada) que pierde la lectura al tamaño mínimo no sirve como
   marca, aunque sea más interesante en grande.

**Sin commits**: no se mezcló nada en la rama de `tinte-tema-maxeada`, que es de otra feature.
