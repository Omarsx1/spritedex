# SEO Fase 5: medicion

## Objetivo
Poder comprobar que lo publicado es lo que creemos y seguir la evolucion en los buscadores.

## Lo que si depende del codigo (hecho)
- [x] **Verificador** `scripts/verificar-seo.mjs`: revisa robots.txt, sitemap y cada pagina
      (estado, canonical autorreferente, title, h1 y hreflang), y sigue los enlaces y las
      imagenes para cazar rotos.
      - `node scripts/verificar-seo.mjs --local` -> revisa `dist/` sin red (lee los archivos).
      - `node scripts/verificar-seo.mjs https://spritedex.gg` -> revisa lo publicado.
      - `--todas` -> las 569 URLs del sitemap en vez de una muestra.
- [x] **Enlazado desde la app**: el pie enlaza la guia y el catalogo, y el detalle de cada
      espiritu enlaza su ficha publica. Antes las paginas nuevas solo se descubrian por el
      sitemap: eran islas.
- Resultado de la ultima pasada local: **23 paginas, 567 enlaces y 11 imagenes revisadas, 0
  rotos**. Las 4 rutas de la app no llevan h1 en el HTML porque lo pinta React: el verificador
  lo tiene en cuenta.

## Lo que depende de ti (cuentas)
1. **Google Search Console**: alta del dominio `spritedex.gg`. La verificacion se puede hacer
   por **registro TXT en el DNS** (en Spaceship), sin tocar el codigo. Enviar
   `https://spritedex.gg/sitemap.xml`.
2. **Bing Webmaster Tools**: se puede **importar desde Search Console** con un clic.
3. Que mirar las primeras semanas: paginas **indexadas** (objetivo: las 569), consultas con
   impresiones pero sin clics (ahi se retoca el titulo), y el informe de **Core Web Vitals**.
4. Cuando esten verificados, los avisos de errores de marcado diran si el JSON-LD (FAQPage,
   BreadcrumbList, ItemList) tiene algun problema real en produccion.

## Pendiente
- Desplegar: **todo esto es inerte hasta que se suba**.
- Arte para los 6 espiritus sin imagen.
- Contacto: cuando compres el buzon, va en `/acerca` y en la linea de derechos de la politica.

