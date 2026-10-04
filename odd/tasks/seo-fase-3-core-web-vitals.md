# SEO Fase 3: Core Web Vitals

## Objetivo
Que la app cargue como se diseno y que el layout no se mueva. Sin cambios de comportamiento.

## Checklist
- [x] T1 **La fuente Outfit nunca se descargaba.** La CSS declaraba
      `--font-heading: 'Outfit', sans-serif` y `index.html` solo pedia Inter, asi que los
      titulos caian al sans del sistema (y el canvas tambien perdia su primera opcion). Ahora
      se pide como **rango variable 700..900** (los pesos que usan titulos y canvas: 800 y 900)
      en la misma hoja que Inter, y el respaldo de la pila pasa a ser Inter para que el
      intercambio no mueva el layout.
- [x] T2 **Imagenes del grid: ya estaban bien.** `SpriteCard` y `MobileSpriteSwiper` ya usan
      `loading` (eager en las 8 primeras, lazy despues), `fetchPriority="high"` en las 4
      primeras, `decoding="async"` y `alt`; y `.card-image` reserva **125 px de alto fijo**,
      asi que la imagen no desplaza nada al llegar. No se toco nada.
- [x] T3 **Bundle: medido, sin cambio seguro.** index 366 KB (73 KB gzip), vendor-react 255
      (82), vendor-supabase 208 (54). El catalogo se necesita para pintar el grid y Supabase se
      usa para restaurar la sesion al arrancar: diferir cualquiera de los dos puede romper el
      login o dejar el grid vacio. Se documenta y se deja como esta.

## Verificacion
- Chrome headless sobre el build: **Outfit se descarga (31 KB)** y
  `.hero__title-line--accent` (peso 900), `.hero__stat-value` (900) y `.card-name` (800)
  computan **Outfit** de verdad. Antes: sans del sistema.
- 161/161 pruebas y build correcto.

## Coste
31 KB de fuente. El resto de la fase no anadio peso.

## Pendiente
- Arte para los 6 espiritus sin imagen.
- F4 contenido y E-E-A-T; F5 medicion (Search Console + Bing).
- Nada desplegado: el usuario pidio seguir en rama.

