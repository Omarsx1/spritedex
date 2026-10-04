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
- [x] T1 (canvasExporter, tests) El trabajo ya verificado de la lona entra como su propio work
      unit antes de tocar assets. Commit `a3ef42d`.
- [x] T2 (public, scripts) `public/sprites 2gen/` pasa a `assets-src/sprites-2gen/` y el
      generador la lee de ahi: deja de desplegarse sin perder el material. Commit `8061195`.
      Medido: −1,73 MB por deploy. Ademas el generador omite y avisa de los origenes cuyo id no
      esta en el catalogo (causa de los derivados huerfanos).
- [x] T3 (public) Borrados los `.DS_Store`. **Los 114 derivados huerfanos NO se borraron**:
      `public.sprites` tiene columna `image` y el admin hace `upsert`, asi que un espiritu de la
      BD puede tener uno de esos ids y su miniatura ser la unica imagen que muestra. Borrarlos
      exige confirmar antes los ids de la BD. Queda pendiente, no bloquea.
- [x] T4+T5 juntos (spriteAssets + consumidores + assets) Commits `7e39b92`. Se hacen en un
      solo work unit a proposito: separarlos dejaria un estado intermedio con la regla en
      `.webp` y los assets todavia en `.png`, es decir imagenes rotas.

## Fuera de alcance (encontrado durante el trabajo)
- [ ] T6 **16 espiritus sin arte real**: los 10 ids sin ningun archivo (`ghost_gem`,
      `dream_gem`, `king_gem`, `fishy_gem`, `striker_gem`, `seven_gem`, `demon_holofoil`,
      `fishy_holofoil`, `boss_holofoil`, `striker_rift`) y los 6 placeholders vectoriales
      (`air_gem`, `aura_holofoil`, `batman_gem`, `boss_gem`, `duck_holofoil`, `peely_candy`).
      Hacen falta los recortes; sin ellos esas fichas caen al `onError` y muestran otro espiritu.
- [ ] T7 Los 114 derivados huerfanos (T3) quedan a la espera de confirmar los ids de la BD.

## Resultado medido (2026-10-04)
| Metrica | Antes | Despues |
|---|---|---|
| Peso de `dist/` | 39 MB | **21 MB** (−46%) |
| Peso de `public/` | 35 MB | 19 MB |
| Espiritus en `public/sprites` | 108 PNG + 169 WebP | **0 PNG** + 270 WebP + 7 SVG |
| Coste por deploy | ~1,17 GB-mes | ~0,63 GB-mes |

- Rutas `/sprites/` literales en el bundle construido: **351, ninguna rota** (las 2 que el
  regex marca son nombres con espacio de miniaturas huerfanas, que existen).
- Ids del catalogo sin archivo: **los mismos 10 de antes** (no se perdio ninguno).
- Assets convertidos: 12/12 cargan desde `rutaAssetEspiritu`, con alfa y 512x512 preservados.
- Los PNG pasaron de 148 KB de media a ~18-40 KB (q85, `-m 6`, `-alpha_q 100`).
- `node --test` 140/140, `oxlint` sin hallazgos nuevos, `vite build` correcto.
- La lona sigue dibujando igual: 3 fichas 93 ms, 64 fichas 241 ms (sin regresion de tiempo).

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
