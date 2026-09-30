# Soporte multi idioma (español + inglés)

Estado: **completo y en producción**. Commits `811a0e0` y `e99f5a8` (dev y main).

## Objetivo

La app pública habla español en la raíz (`spritedex.gg/`) e inglés en `/en`. El idioma se
decide por el **idioma del navegador**, nunca por país: un hispanohablante en EE.UU. con
`es-US` ve español. El selector visible manda sobre la detección y se recuerda.

## Restricciones que se respetaron

- Cero dependencias nuevas, cero cambios en Supabase, cero migraciones.
- El texto en español quedó idéntico: la extracción se verificó 388/388 contra `HEAD`.
- La raíz sigue siendo la URL española: ningún enlace ya compartido cambia de destino.
- Ninguna clave de `localStorage` existente se toca.

## Tareas

- [x] Núcleo de idioma: `src/i18n/core.js` (puro), `texto.js` (estado + `t`), `index.jsx` (proveedor).
      Detección, interpolación `{var}`, caída a español y `planDeArranque`.
- [x] Catálogo inglés generado: `scripts/build_locale_catalog.mjs` → `catalog.en.json` (234 ids)
      y `familias.en.json` (46). 218 nombres reales del juego + 16 compuestos con su regla.
- [x] `spritesData.js`: `fullNameEn`, `familyNameEn`, `variantDisplayEn`, `pickName`,
      `pickFamilyName`, `pickThemeName` y rarezas traducidas.
- [x] Extracción de los 19 componentes públicos: 388 claves (`es` y `en`).
- [x] Aviso y política de privacidad traducidos (47 claves).
- [x] Rutas `/en` y `/en/amigos`, redirección en la primera carga, selector en la barra y en
      la página de amigos.
- [x] SEO: `hreflang` (es, en, x-default), `og:locale`, sitemap con las dos versiones.
- [x] 40 pruebas (22 nuevas) y build en verde.

## Correcciones que salieron de paso

- `spritedex.com` (dominio que no existe) en la lona del PNG y en el enlace del resumen de
  `FriendCompareModal`; ahora usan el dominio canónico real.
- `RefreshCw` se usaba sin importar en `FriendCompareModal`: rompía el modal al conectar.
- `RARITY_GLOWS` estaba indexado por etiqueta en español pero se consultaba con la clave de
  la rareza, así que el brillo nunca se aplicaba.
- El placeholder del acceso de admin sugería `@spritedex.com`.

## Pendiente conocido

El texto que viene de los **datos del juego** sigue en español en modo inglés: habilidad,
coste de invocación y ubicación en la ficha del espíritu. Son solo **68 cadenas distintas**
(39 habilidades, 9 perks, 11 ubicaciones, 9 costes; ~5.850 caracteres), así que se puede
cerrar con una pasada de traducción acotada.

## Verificación en producción (medida, no supuesta)

- Navegador en inglés en `/` → aterriza en `/en` con `lang="en"` y EN activo.
- Navegador en español en `/` → se queda en `/` con `lang="es"`.
- Abrir `/en` a mano con navegador español → se respeta la URL.
- El selector cambia de idioma y recarga en la ruta equivalente.
- `/amigos` → "Amigos" y `/en/amigos` → "Friends", con el selector en ambas.
- Chunks desplegados comprobados por contenido: catálogo inglés, diccionarios, `emailRedirectTo`
  intacto y ninguna aparición de `spritedex.com`.

## Trampas aprendidas

- `t()` a nivel de módulo se congela en español: el idioma activo se fija en el primer render
  del proveedor. Traducir siempre dentro del render.
- Los imports en ESM de Node necesitan extensión y no aceptan carpetas: `./locales/index.js`.
- Insertar un import "después del último import" rompe los imports multilínea: el build lo
  detectó en App.jsx.
- Verificar contra el hash del build local es engañoso: Vercel define variables propias y
  cambia el contenido. Lo correcto es seguir las referencias del index desplegado.
