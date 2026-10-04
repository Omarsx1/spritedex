# Organizar las imagenes de espiritus y bajar el peso del deploy

## Objetivo
Que cada imagen desplegada tenga un lector (que no exista peso muerto), que todas las
imagenes de espiritus esten en WebP y que la ruta del asset se resuelva en un solo sitio.
Sin afectar a los usuarios: ningun cambio visible, ninguna ruta rota.

## Problema (medido)
- Auditoria de `public/sprites` contra el catalogo (278 ids):
  - `public/sprites 2gen/` son 61 WebP (1,73 MB) cuyo nombre no existe en el catalogo. Su
    unica mencion en el repo es `scripts/generate_sprite_thumbs.js:13` como carpeta de
    origen, y nada en `src/` ni en el JS construido la usa: se despliega en cada deploy
    sin que nada la lea.
  - El generador de miniaturas le creo 57 thumbs + 57 collage huerfanos (de 63 huerfanos en
    cada carpeta), mas `improvedslide_basic.webp` (0 referencias) y un `.DS_Store`.
  - Total inalcanzable: ~3,2 MB de los 39 MB que se despliegan.
- Gen 1 son 108 archivos `.png` (15,6 MB, 512x512, 148 KB de media) y gen 2 usa `.webp`. La
  extension no se eligio: la hereda el pipeline (`download_all_fnsprites.cjs` guarda
  siempre como `.png`; `sync-sprites.js:348` copia la extension de la URL). Los thumbs y el
  collage si son WebP porque se generaron despues.
- 7 archivos mienten de extension: `air_gem`, `aura_holofoil`, `batman_gem`, `boss_gem`,
  `duck_holofoil` y `peely_candy` son SVG guardados como `.png`, y `zeropoint_rift.png` es
  WebP.
- La ruta `/sprites/<id>.<ext>` se construye en 12+ sitios (datos, 6 componentes con su
  `onError`, 2 del admin, el canvas). Un sitio olvidado = imagen rota en un estado concreto.
- Contexto: Vercel mide "Deployment Storage" en GB-mes y es una cuota **del equipo**, no del
  proyecto; cada deploy de este repo pesa 39 MB.

## Fuera de alcance
- Los 10 espiritus del catalogo sin arte (`ghost_gem`, `dream_gem`, `king_gem`, `fishy_gem`,
  `striker_gem`, `seven_gem`, `demon_holofoil`, `fishy_holofoil`, `boss_holofoil`,
  `striker_rift`): falta material de origen. Hoy caen al `onError` y muestran otro espiritu.
  Se reporta, no se inventa arte.
- Iconos de PWA (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `favicon.png`):
  iOS y el manifest los leen por nombre y formato. No se tocan.

## Checklist
- [ ] T1 (canvasExporter, tests) El trabajo ya verificado de la lona (nombre en su banda +
      espiritu que falta apagado) entra como su propio work unit, antes de tocar assets.
- [ ] T2 (public, scripts) Sacar `public/sprites 2gen/` de `public/` a `assets-src/sprites-2gen/`
      y quitarla de `SOURCE_DIRS`. El material fuente se conserva, deja de desplegarse.
- [ ] T3 (public) Borrar miniaturas y collages huerfanos (id que no esta en el catalogo y
      nombre sin referencias en `src/`), `improvedslide_basic.webp` y los `.DS_Store`.
- [ ] T4 (src/utils/spriteAssets.js + consumidores) Una sola resolucion de ruta para el
      asset del espiritu; mismo resultado que hoy. Refactor sin cambio visible.
- [ ] T5 (public/sprites) Convertir los PNG reales de gen 1 a WebP 512 px q88 y actualizar
      la resolucion para que devuelva `.webp`. Los 7 con extension mentirosa se arreglan:
      los 6 SVG se rasterizan a WebP y el WebP disfrazado se renombra.

## Restricciones
- Nada de arte inventado ni de ocultar fichas sin permiso.
- Un work unit por tarea; cada uno desplegable y revertible por separado.
- Renombrar un asset y actualizar su referencia van SIEMPRE en el mismo commit.
- No tocar la base ni Supabase.

## Verificacion
- Por tarea: `node --test` (140 pruebas) y `npx oxlint` sin hallazgos nuevos.
- T3 y T5: script de comprobacion de que **cada id del catalogo resuelve a un archivo
  existente** (antes y despues) y que ningun archivo de `public/sprites` queda sin lector.
- T4 y T5: render headless de la lona en 3 escenarios (3, 12 y 64 fichas) + la ficha de
  detalle de un espiritu de gen 1, comparando que todas las imagenes cargan.
- Cierre: `pnpm build` y peso final de `dist/`.

