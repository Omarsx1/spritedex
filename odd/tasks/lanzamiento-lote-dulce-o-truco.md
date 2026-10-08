# Lanzamiento: lote "Dulce o Truco" (23 espíritus)

**Feature**: `lanzamiento-lote-dulce-o-truco`
**Estado**: publicado (push a main, lote adelantado por decision del usuario)
**Fecha**: 2026-10-08

## Objetivo

Publicar el lote "Dulce o Truco" **ya** (el usuario adelanta el lanzamiento previsto para las
03:00 de Perú) con el aviso flotante de nuevos activo para todo el mundo.

## Contexto verificado

- El lote son **23 fichas** `*_tricktreat` en `src/data/official_sprites.json`, todas con imagen
  presente en `public/sprites/` (comprobado: 0 imágenes faltantes).
- Estaban programadas a `2026-10-08T08:00:00.000Z` = 03:00 en Perú.
- El mecanismo es una fecha en el catálogo empaquetado (`official_sprites.json` viaja con el
  código), así que publicar exige **despliegue**: no basta con un cambio local.
- `src/utils/lanzamiento.js` marca `programado` si la fecha es futura y `nuevo` durante 7 días
  completos; `src/data/spritesData.js` recalcula `isNew` desde la fecha (la fecha manda).
- `src/utils/novedadesAviso.js` genera la clave del aviso a partir de la fecha del lote más
  reciente, así que un lote nuevo vuelve a avisar una vez por navegador.
- El lote anterior (21 fichas del 1 de octubre) deja de contar como nuevo solo, por la regla de
  7 días completos: un solo lote nuevo a la vez.

## Tareas

- [x] **T1** Verificar el lote, las imágenes y el mecanismo de lanzamiento. *(ruta: inline)*
- [x] **T2** Documento de feature. *(ruta: inline)*
- [x] **T3** Mover el instante del lote a un momento ya pasado (`05:00Z` = 00:00 de Perú). *(ruta: inline)*
- [x] **T4** Verificación: tests del proyecto, aviso flotante y presencia de las 23 fichas en la app real.
- [x] **T5** Publicación (despliegue a producción). Publicado con este push a main.
- [x] **T6** Memoria + limpieza.

## Riesgos abiertos

1. **El sync puede revertirlo.** `scripts/sync-sprites.js` marca de nuevo `unreleased` cuando la
   fuente externa dice que la ficha no está publicada y la fecha ya no es futura (regla pensada
   para "programado hasta que la fuente confirme"). Si adelantamos el lanzamiento y la fuente
   todavía no lo da por publicado, el workflow (jueves, desde las 10:00Z = 05:00 de Perú) lo
   revierte y además commitea ese cambio.
2. **Adelanto frente al juego.** Publicar antes de que Fortnite lo suelte enseña fichas que nadie
   puede conseguir todavía.
3. **El despliegue es la publicación.** Hasta que no llegue a producción, "para todo el mundo" no
   es cierto.

## Criterios de aceptación

1. Las 23 fichas se ven en la rejilla.
2. El aviso flotante dice 23 nuevas.
3. El lote del 1 de octubre ya no cuenta como nuevo.
4. `node --test` sin fallos nuevos.

## Estrategia de entrega

- Pronóstico: ~30 líneas autoradas (23 fechas + doc). Estrategia `single-pr` si el usuario decide
  publicar por PR; si publica directo, un solo commit.


## Evidencia

- node --test: 224/224 en verde.
- Aviso flotante real: 23 Nuevos espiritus con boton VER y badge 23.
- La rejilla muestra 24 tarjetas con Dulce o Truco: las 23 de hoy mas crown_tricktreat (Victorioso, del 1 de octubre), que hoy deja de contar como nuevo.
- Las 23 imagenes del lote existen en public/sprites/: 0 faltantes.
