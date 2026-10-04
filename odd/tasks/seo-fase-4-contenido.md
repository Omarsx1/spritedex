# SEO Fase 4: contenido y E-E-A-T

## Objetivo
Que las 558 fichas de dato no esten solas: alguien tiene que explicar el tema, decir quien esta
detras y con que datos. Es lo que un buscador (y una persona) espera de un sitio de catalogo.

## Checklist
- [x] T1 **Guia** (`/guia-espiritus` y `/en/guia-espiritus`): que es un espiritu, familias y
      variantes, rarezas (tabla con el reparto real), como se consiguen con el rango real de
      probabilidad, niveles 1-5, costo de invocacion y como seguir la coleccion. Cierra con
      **6 preguntas frecuentes** visibles y su `FAQPage`.
- [x] T2 **Novedades** (`/novedades`): los 16 espiritus mas recientes con fecha, familia,
      variante y probabilidad, enlazados a su ficha. Se regenera en cada build: es la senal de
      frescura del sitio sin tener que escribir nada a mano.
- [x] T3 **Acerca de** (`/acerca`): que es, por que existe, **de donde salen los datos** (juego
      y fuentes de la comunidad, revisados y fechados en cada build, "puede tener errores"),
      quien lo hace (proyecto personal de fans) y que **no** es (sin relacion con Epic Games).
- [x] T4 Armazon compartido (`src/seo/plantilla.js`): cabecera, migas, pie, estilos y
      **conmutador de idioma** para todas las paginas estaticas.
- [x] T5 Sitemap: **569 URLs** (las 564 de espiritu + estas 6 + las de la fase 1).

## Verificacion
- 167/167 pruebas. Las nuevas cazaron tres bugs reales antes del commit:
  1. **Todos los enlaces de las paginas inglesas estaban rotos** (`/enguia-espiritus`,
     `/enespiritus`): se concatenaba el prefijo sin barra. Ahora sale todo de `conIdiomaRuta`.
  2. El **FAQPage viajaba duplicado** (como `mainEntity` y como nodo del grafo): las preguntas
     aparecian dos veces en el marcado.
  3. Los enlaces a `/en/privacidad` apuntaban a una pagina que no existe (la privacidad es solo
     en español): ahora se enlaza la real y se dice "(Spanish)".
- Comprobacion de enlaces de pagina del build: **6220 revisados, 0 rotos**.
- Revisado a ojo con capturas: guia, novedades y una ficha en ingles.

## Coste
`dist/` pasa de 26 a **27 MB**. Las 6 paginas nuevas son HTML estatico y ligero.

## Pendiente
- **Falta un canal de contacto** para cerrar E-E-A-T (no hay ningun correo publico en el sitio y
  no me lo puedo inventar). Cuando lo haya, va en la pagina de acerca.
- Terminos de uso: no lo escribo yo (es texto legal).
- F5 medicion (Search Console + Bing) y arte para los 6 espiritus sin imagen.
- Nada desplegado.

