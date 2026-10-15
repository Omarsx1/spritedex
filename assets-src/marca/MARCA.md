# Marca de Spritedex

> **PARKED (2026-10-08)** — esta marca **no está aplicada**. El usuario no aprobó la dirección
> ("no me gustó") y la app sigue con el monograma **F** en la cabecera y el footer. Todo este
> directorio es material de trabajo para la próxima iteración, no un sistema en uso. Nada de
> aquí se sirve: cuando se aplique, los SVG van a `public/` y los PNG se generan con
> `marca-iconos.mjs`.

La marca es **un fantasma**. No es decoración de Halloween: es un *espíritu*, y el nombre del
producto es un índice de espíritus. Por eso la marca funciona igual en octubre que en mayo.

## Los archivos y cuándo usar cada uno

| Archivo (en este directorio) | Qué es | Cuándo |
| --- | --- | --- |
| `Spritedex.svg` | **Marca principal**: fantasma blanco con los ojos en el color de marca | Interfaz, fondos oscuros, cabecera y footer |
| `spritedex-blanco.svg` | Monocroma blanca (un solo color, ojos calados) | Fondos oscuros, marca de agua, grabados, camisetas |
| `spritedex-negro.svg` | Monocroma negra | Fondos claros, impresión sin color, documentos |
| `favicon-icono.svg` | Icono: marca principal dentro de un recuadro `#060714` | Pestaña, PWA, acceso directo |
| `Spritedex-fantasma-original.svg` | El asset original del usuario (fantasma con contorno verde) | Referencia |

Los PNG (`favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon*.png`) son
**derivados**. No se editan a mano: se regeneran desde `favicon.svg` con
`node marca-iconos.mjs`.

## Color

- **Carmesí `#E80653`** es el color de marca. Vive en los **ojos**, no en un contorno.
- Tinta de la marca monocroma: `#0d1117`. Fondo del icono: `#060714`.
- Blanco `#FFFFFF` para el cuerpo sobre fondo oscuro.

El color de marca es **uno solo todo el año**. La temporada (Fortnitemares) no recolorea la
marca: se expresa en el resto del sistema (el wordmark del hero, la paleta, el bosque). Es la
misma regla que aplica Epic: la forma del logotipo es fija y lo que cambia por temporada es el
tratamiento y la capa que lo rodea.

## Construcción

- Artboard de 120 x 120. La pieza ocupa **x 24-96, y 20-100** (72 x 80, proporción 0,9).
- Domo superior + lados rectos + **3 lóbulos** en el borde inferior.
- Ojos: pastilla vertical de 17 x 32, radio 8,5, separados 13,5 del eje. Simétricos y a la misma
  altura: la cara no se dibuja a mano, se construye.
- `favicon.svg` usa una variante de tamaño mínimo: ojos de 24 x 36 para que sobrevivan a 16 px.

## Tamaños y espacio de respeto

- Mínimos: **16 px** (icono, con la variante de ojos grandes), **24 px** (marca principal),
  **8 mm** en impresión.
- Espacio de respeto: **media altura de la marca** por los cuatro lados. Nada entra ahí.

## Usos incorrectos

- No cambiar el color de los ojos fuera del carmesí de marca.
- No poner un contorno grueso alrededor del cuerpo: a tamaño pequeño se come la silueta y lee
  como error de registro.
- No deformar, inclinar ni rotar (la única rotación permitida es el `-12deg` del estado activo
  del botón de la cabecera, que es un gesto de interfaz, no de marca).
- No usar el icono con el recuadro como marca principal en texto corrido.

## Verificación

Cualquier cambio de marca se comprueba **rasterizado a tamaño real** (16 / 24 / 32 / 34 px) sobre
el fondo real de la aplicación, no en un lienzo ampliado. Ahí es donde se decide: a 96 px todo
combina.
