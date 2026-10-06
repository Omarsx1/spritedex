# SEO Fase 1: canonical y meta por ruta

## Objetivo
Que cada URL indexable tenga su propio titulo, descripcion, canonical y hreflang, y que el
sitemap describa lo que de verdad existe. Sin cambiar nada de lo que ve el usuario.

## Problema (verificado en produccion con curl, no supuesto)
`/`, `/en` y `/amigos` devolvian el MISMO titulo, la MISMA descripcion y el MISMO canonical
(`https://spritedex.gg/`) porque la app nunca tocaba el `<head>` (0 coincidencias de
`document.title` en `src/`). Consecuencias:
- `/en` con canonical cruzado: Google suprime el ingles, y un canonical fuera del juego
  hreflang **invalida todo el hreflang**.
- `/amigos` y `/en/amigos`, que estaban en el sitemap, se autocanonicalizaban a la home.
- El sitemap no incluia `/privacidad`, que si es indexable.
- `robots.txt` bloqueaba `/studio`, `/override`, `/nexus` en vez de las rutas reales del
  portal (`/studio-override`, `/nexus-core`, `/portal-override`, `?studio=true`):
  `/portal-override` quedaba fuera.
- `viewport` con `user-scalable=no`: problema de accesibilidad y de validacion movil.

## Checklist
- [x] T1 Tabla unica de rutas (`src/seo/rutas.js`) con titulos, descripciones, canonical,
      hreflang y JSON-LD; gestor de head en runtime (`src/seo/head.js`) enganchado en App.jsx
      para la navegacion interna; noindex para rutas desconocidas y para el portal de admin.
- [x] T2 Prerender por ruta en el build (`scripts/prerender-seo.mjs`) y sitemap generado desde
      la misma tabla (5 URLs, ya con `/privacidad`); `robots.txt` con las rutas reales;
      `X-Robots-Tag: noindex` para el portal en `vercel.json`.
- [x] T3 `viewport` sin `maximum-scale` ni `user-scalable=no`.

## Verificacion
- 4 HTML prerenderizados (`/`, `/en`, `/amigos`, `/en/amigos`): exactamente 1 title, 1
  canonical autorreferente, 3 hreflang, 1 JSON-LD y 1 description cada uno; titulos distintos.
- `node --test`: 147/147 (7 pruebas nuevas de invariantes SEO que fallaban con el codigo
  anterior).
- **Decisivo**: se comprobo en produccion que Vercel sirve los archivos antes que el rewrite
  catch-all (`/sprites/water_basic.png` -> image/png, `/privacidad` -> text/html), que era la
  unica suposicion del plan. Por eso los HTML prerenderizados se servirán sin tocar `vercel.json`.
- `oxlint` sin hallazgos nuevos. Build completo (vite + prerender) correcto.

## Pendiente (fases siguientes)
- F2: paginas por espiritu prerenderizadas (`/espiritu/<slug>`), 556 URLs con datos propios.
- F3: Core Web Vitals (fuente Outfit que no se carga, `lazy` y `width/height` en el grid).
- F4: contenido y E-E-A-T (hub de guia, about/contacto).
- F5: medicion (Search Console + Bing, sitemap index).
- Aparte: no se ha desplegado nada; el usuario pidio seguir en rama.

