// Paginas de contenido: guia, acerca y novedades.
//
// Las fichas de espiritu son paginas de dato; estas son las que explican el tema y sostienen el
// proyecto de cara a un buscador y a quien llega por primera vez (E-E-A-T: quien lo hace, de
// donde salen los datos y por que). Sin dependencias: reciben los numeros ya calculados y
// devuelven HTML, asi que se prueban con node --test.

import { SITIO } from './rutas.js';
import { escapar, migas, documento, ctaHtml, recortar, conIdiomaRuta, TEXTO, RUTAS_CONTENIDO } from './plantilla.js';

const CLAVES = { guia: 'guia', acerca: 'acerca', novedades: 'novedades' };

const TITULOS = {
  es: {
    guia: 'Guía de espíritus de Fortnite — Spritedex',
    acerca: 'Acerca de Spritedex: quién lo hace y con qué datos',
    novedades: 'Espíritus nuevos de Fortnite — Spritedex'
  },
  en: {
    guia: 'Fortnite sprite guide — Spritedex',
    acerca: 'About Spritedex: who makes it and with what data',
    novedades: 'New Fortnite sprites — Spritedex'
  }
};

const DESCRIPCIONES = {
  es: {
    guia: 'Qué son los espíritus de Fortnite, familias y variantes, rarezas, cómo se consiguen y cómo suben de nivel del 1 al 5, con datos de la colección completa.',
    acerca: 'Spritedex es un rastreador de espíritus de Fortnite hecho por fans: de dónde salen los datos, cómo se guarda tu progreso y qué no es este proyecto.',
    novedades: 'Los últimos espíritus añadidos a Fortnite con su fecha, familia, variante y probabilidad de drop, enlazados a su ficha.'
  },
  en: {
    guia: 'What Fortnite sprites are: families, variants, rarities, how to get them and how they level from 1 to 5, with data from the full collection.',
    acerca: 'Spritedex is a fan-made Fortnite sprite tracker: where the data comes from, how your progress is stored and what this project is not.',
    novedades: 'The latest sprites added to Fortnite with their release date, family, variant and drop chance, linked to their page.'
  }
};

function etiquetasDe(clave, lang, extras = {}) {
  const ruta = RUTAS_CONTENIDO[clave];
  return {
    lang,
    titulo: TITULOS[lang][clave],
    descripcion: recortar(extras.descripcion || DESCRIPCIONES[lang][clave], 160),
    canonical: SITIO + conIdiomaRuta(ruta, lang),
    alternates: [
      { hreflang: 'es', href: SITIO + conIdiomaRuta(ruta, 'es') },
      { hreflang: 'en', href: SITIO + conIdiomaRuta(ruta, 'en') },
      { hreflang: 'x-default', href: SITIO + conIdiomaRuta(ruta, 'es') }
    ]
  };
}

export const etiquetasGuia = (lang) => etiquetasDe(CLAVES.guia, lang);
export const etiquetasAcerca = (lang) => etiquetasDe(CLAVES.acerca, lang);
export const etiquetasNovedades = (lang) => etiquetasDe(CLAVES.novedades, lang);

function migasContenido(lang, nombre) {
  return migas([
    { nombre: TEXTO[lang].inicio, href: conIdiomaRuta('/', lang) },
    { nombre: TEXTO[lang].espiritus, href: conIdiomaRuta('/espiritus', lang) },
    { nombre }
  ]);
}

function tabla(cabeceras, filas) {
  return '<table class="tabla"><thead><tr>' + cabeceras.map((c) => '<th>' + escapar(c) + '</th>').join('')
    + '</tr></thead><tbody>' + filas.map((f) => '<tr>' + f.map((c) => '<td>' + escapar(c) + '</td>').join('') + '</tr>').join('')
    + '</tbody></table>';
}

// La fecha va en el texto y en el idioma de la pagina: "4 de octubre de 2026" / "October 4, 2026".
function formatearFecha(iso, lang) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(iso + 'T00:00:00Z'));
  } catch {
    return iso;
  }
}

// Preguntas frecuentes. Son las mismas que se ven en la pagina y las que van al JSON-LD: si
// divergieran, el marcado diria algo que el usuario no lee.
function preguntas(lang, datos) {
  const t = datos;
  if (lang === 'en') {
    return [
      ['What are Fortnite sprites?', 'Sprites are companions you find during a match. Each one grants an ability while you carry it, from extra shields to a double jump, and it gets stronger as you level it up.'],
      ['How many sprites are there?', 'Spritedex tracks ' + t.total + ' sprites: ' + t.familias + ' families with their variants.'],
      ['How do you get a sprite?', 'They appear in sprite chests and extraction zones, and some have specific spawn spots. Each page lists where that sprite is found and its drop chance, from ' + t.dropMin + '% to ' + t.dropMax + '%.'],
      ['How do sprite levels work?', 'Each sprite goes from level 1 to 5 and its ability scales with the level. Tracking them here is how you see which ones still need leveling.'],
      ['Do I need an account?', 'No. Your progress is stored in your own browser, so nothing is uploaded and no sign-up is required.'],
      ['Is Spritedex official?', 'No. It is a fan project with no relation to Epic Games.']
    ];
  }
  return [
    ['¿Qué son los espíritus de Fortnite?', 'Son compañeros que aparecen durante la partida. Cada uno concede una habilidad mientras lo llevas, desde escudo extra hasta un salto doble, y se vuelve más fuerte según sube de nivel.'],
    ['¿Cuántos espíritus hay?', 'El Spritedex sigue ' + t.total + ' espíritus: ' + t.familias + ' familias con sus variantes.'],
    ['¿Cómo se consigue un espíritu?', 'Aparecen en cofres de espíritu y zonas de extracción, y algunos tienen sitios concretos. Cada ficha dice dónde aparece el suyo y su probabilidad, que va del ' + t.dropMin + '% al ' + t.dropMax + '%.'],
    ['¿Cómo funcionan los niveles?', 'Cada espíritu va del nivel 1 al 5 y su habilidad mejora con cada subida. Aquí es donde se ve cuáles te faltan por subir.'],
    ['¿Necesito una cuenta?', 'No. Tu progreso se guarda en tu propio navegador, así que no se sube nada y no hay que registrarse.'],
    ['¿Spritedex es oficial?', 'No. Es un proyecto de fans sin relación con Epic Games.']
  ];
}

function faqHtml(lang, datos) {
  return preguntas(lang, datos).map(([p, r]) => (
    '<details class="faq"><summary>' + escapar(p) + '</summary><p>' + escapar(r) + '</p></details>'
  )).join('');
}

function jsonLdFaq(lang, datos) {
  return {
    '@type': 'FAQPage',
    mainEntity: preguntas(lang, datos).map(([p, r]) => ({
      '@type': 'Question',
      name: p,
      acceptedAnswer: { '@type': 'Answer', text: r }
    }))
  };
}

function jsonLdPagina(tipo, etiquetas, lang, extra = {}) {
  const enIngles = lang === 'en';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': tipo,
        '@id': etiquetas.canonical + '#webpage',
        url: etiquetas.canonical,
        name: etiquetas.titulo,
        description: etiquetas.descripcion,
        inLanguage: lang,
        isPartOf: { '@id': SITIO + '/#website' },
        ...extra
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: enIngles ? 'Home' : 'Inicio', item: SITIO + conIdiomaRuta('/', lang) },
          { '@type': 'ListItem', position: 2, name: enIngles ? 'Sprites' : 'Espíritus', item: SITIO + conIdiomaRuta('/espiritus', lang) },
          { '@type': 'ListItem', position: 3, name: etiquetas.titulo.replace(' — Spritedex', ''), item: etiquetas.canonical }
        ]
      }
    ]
  };
}

export function htmlGuia(datos, lang) {
  const etiquetas = etiquetasGuia(lang);
  const enIngles = lang === 'en';
  const fecha = formatearFecha(datos.fecha, lang);
  // El FAQPage va como nodo del grafo, una sola vez: si ademas fuera mainEntity, las preguntas
  // viajarian duplicadas en el marcado.
  const jsonLd = jsonLdPagina('WebPage', etiquetas, lang);
  jsonLd['@graph'].push(jsonLdFaq(lang, datos));
  // Hay drops de una entre cien mil: decir "del 0.00001%" es cierto pero no se lee. Por debajo
  // del 0.01% se redacta como "menos del 0.01%", que sigue siendo verdad.
  const bajo = datos.dropMin > 0 && datos.dropMin < 0.01 ? null : datos.dropMin;
  const fraseDrop = enIngles
    ? (bajo === null ? 'goes from less than 0.01% to ' : 'goes from ' + bajo + '% to ') + datos.dropMax + '%'
    : (bajo === null ? 'va de menos del 0.01% al ' : 'va del ' + bajo + '% al ') + datos.dropMax + '%';
  const h = enIngles
    ? {
        que: 'What a sprite is',
        queTexto: 'A sprite is a companion you pick up during a match. While you carry it, it works on its own: it gives you shields, reloads your weapons, lets you double jump, drops loot. Its power grows with its level, so the same sprite is worth much more at 5 than at 1.',
        familias: 'Families and variants',
        familiasTexto: 'Sprites are grouped by family (Water, Fire, Ghost, Jonesy, Peely…) and each family has variants that change how it looks: Basic, Gold, Hacker, Loot Hacker, Bounty Hunter, Trick or Treat, Quack and a few more. Spritedex tracks ' + datos.total + ' sprites across ' + datos.familias + ' families.',
        rarezas: 'Rarities',
        rarezasTexto: 'Rarity describes how hard a sprite is to find. These are the rarities in the current collection:',
        conseguir: 'How to get them',
        conseguirTexto: 'They show up in sprite chests and extraction zones, and some have their own spawn spots (rivers, forests, cities, at night…). The drop chance changes a lot from one sprite to another: in this collection it ' + fraseDrop + '. Each sprite page says where that one is found.',
        niveles: 'Levels 1 to 5',
        nivelesTexto: 'Every sprite levels up and its ability scales with it. Levelling is what turns a sprite you already have into a better one, so a collection tracker is really two lists: what you own and what you still have to level.',
        costo: 'Summon cost',
        costoTexto: 'Summoning a sprite costs Stardust, and the amount depends on the sprite. This collection has ' + datos.costos + ' different costs.',
        coleccion: 'Tracking the collection',
        coleccionTexto: 'Spritedex keeps the whole list with family, variant, rarity and drop chance, marks what you own, levels from 1 to 5, compares with friends and exports a card to share. No account and no install: everything is stored in your browser.',
        faq: 'Frequent questions',
        datos: 'Data revised on ' + fecha + ' from the game and community sources. It can contain mistakes: if you see one, it is worth telling us.'
      }
    : {
        que: 'Qué es un espíritu',
        queTexto: 'Un espíritu es un compañero que recoges durante la partida. Mientras lo llevas, trabaja solo: te da escudo, recarga tus armas, te deja hacer un salto doble, suelta botín. Su poder crece con el nivel, así que el mismo espíritu vale mucho más en el 5 que en el 1.',
        familias: 'Familias y variantes',
        familiasTexto: 'Los espíritus se agrupan por familia (Agua, Fuego, Fantasma, Jonesy, Peely…) y cada familia tiene variantes que cambian su aspecto: Básico, Dorado, Hacker, Hacker de Botín, Cazarrecompensas, Dulce o Truco, Patito y algunas más. El Spritedex sigue ' + datos.total + ' espíritus repartidos en ' + datos.familias + ' familias.',
        rarezas: 'Rarezas',
        rarezasTexto: 'La rareza indica lo difícil que es encontrar un espíritu. Estas son las de la colección actual:',
        conseguir: 'Cómo conseguirlos',
        conseguirTexto: 'Aparecen en cofres de espíritu y zonas de extracción, y algunos tienen sitios propios (ríos, bosques, ciudades, de noche…). La probabilidad cambia mucho de uno a otro: en esta colección ' + fraseDrop + '. La ficha de cada espíritu dice dónde aparece el suyo.',
        niveles: 'Niveles del 1 al 5',
        nivelesTexto: 'Todos los espíritus suben de nivel y su habilidad mejora con cada subida. Subir de nivel es lo que convierte un espíritu que ya tienes en uno mejor, así que un rastreador de colección son en realidad dos listas: lo que tienes y lo que te falta subir.',
        costo: 'Costo de invocación',
        costoTexto: 'Invocar un espíritu cuesta Polvo Estelar, y la cantidad depende del espíritu. En esta colección hay ' + datos.costos + ' costos distintos.',
        coleccion: 'Seguir la colección',
        coleccionTexto: 'El Spritedex tiene la lista completa con familia, variante, rareza y probabilidad, marca lo que tienes, los niveles del 1 al 5, compara con amigos y exporta una tarjeta para compartir. Sin cuenta y sin instalar: todo se guarda en tu navegador.',
        faq: 'Preguntas frecuentes',
        datos: 'Datos revisados el ' + fecha + ' a partir del juego y de fuentes de la comunidad. Pueden tener errores: si ves uno, merece la pena avisar.'
      };
  const cuerpo = [
    migasContenido(lang, h.familias === 'Families and variants' ? 'Guide' : 'Guía'),
    '<main>',
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    '<h2>' + escapar(h.que) + '</h2><p>' + escapar(h.queTexto) + '</p>',
    '<h2>' + escapar(h.familias) + '</h2><p>' + escapar(h.familiasTexto) + '</p>',
    '<h2>' + escapar(h.rarezas) + '</h2><p>' + escapar(h.rarezasTexto) + '</p>',
    tabla([enIngles ? 'Rarity' : 'Rareza', enIngles ? 'Sprites' : 'Espíritus'], datos.porRareza.map((r) => [r.nombre, String(r.n)])),
    '<h2>' + escapar(h.conseguir) + '</h2><p>' + escapar(h.conseguirTexto) + '</p>',
    '<h2>' + escapar(h.niveles) + '</h2><p>' + escapar(h.nivelesTexto) + '</p>',
    '<h2>' + escapar(h.costo) + '</h2><p>' + escapar(h.costoTexto) + '</p>',
    '<h2>' + escapar(h.coleccion) + '</h2><p>' + escapar(h.coleccionTexto) + '</p>',
    ctaHtml(lang),
    '<h2>' + escapar(h.faq) + '</h2>',
    faqHtml(lang, datos),
    '<p class="nota">' + escapar(h.datos) + '</p>',
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}

export function htmlNovedades(datos, lang) {
  const etiquetas = etiquetasNovedades(lang);
  const enIngles = lang === 'en';
  const jsonLd = jsonLdPagina('CollectionPage', etiquetas, lang);
  jsonLd['@graph'].push({
    '@type': 'ItemList',
    numberOfItems: datos.ultimos.length,
    itemListElement: datos.ultimos.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: f[lang].nombre,
      url: SITIO + conIdiomaRuta('/espiritu/' + f.slug, lang)
    }))
  });
  const filas = datos.ultimos.map((f) => [
    f.lanzamiento || '—',
    f[lang].nombre,
    f[lang].familia,
    f[lang].variante,
    f.drop
  ]);
  const cuerpo = [
    migasContenido(lang, enIngles ? 'Updates' : 'Novedades'),
    '<main>',
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    tabla(
      [enIngles ? 'Release' : 'Lanzamiento', enIngles ? 'Sprite' : 'Espíritu', enIngles ? 'Family' : 'Familia', enIngles ? 'Variant' : 'Variante', enIngles ? 'Drop' : 'Probabilidad'],
      filas
    ),
    '<p class="nota">' + escapar(enIngles
      ? 'Dates are the ones recorded in the game data. The sprite pages carry the full detail.'
      : 'Las fechas son las registradas en los datos del juego. El detalle completo está en la ficha de cada espíritu.') + '</p>',
    ctaHtml(lang),
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}

export function htmlAcerca(datos, lang) {
  const etiquetas = etiquetasAcerca(lang);
  const enIngles = lang === 'en';
  const fecha = formatearFecha(datos.fecha, lang);
  const jsonLd = jsonLdPagina('AboutPage', etiquetas, lang, {
    about: { '@type': 'VideoGame', name: 'Fortnite' }
  });
  const h = enIngles
    ? {
        que: 'What Spritedex is',
        queTexto: 'A free tracker for Fortnite sprite collections. It shows every sprite with its family, variant, rarity, drop chance, summon cost, ability and where it is found, and lets you mark what you own and how far you have levelled it.',
        por: 'Why it exists',
        porTexto: 'Keeping the collection in your head stops working at around twenty sprites: you forget which variant is missing and which one is still at level 2. Spritedex turns that into a list you can check, and into a card you can send to whoever you trade with.',
        datos: 'Where the data comes from',
        datosTexto: 'Names, rarities, drop chances, costs, abilities and spawn locations come from the game and from community sources. The collection is revised by hand and dated on every rebuild, so what you read here may change when the game does. It can contain mistakes.',
        quien: 'Who makes it',
        quienTexto: 'It is a personal fan project, not a company. The collection is maintained by hand and the app is built to be fast and to work without an account.',
        no: 'What it is not',
        noTexto: 'Spritedex has no relation to Epic Games and does not sell anything. It is not a stats site or a news site either: it only tracks sprites.',
        privacidad: 'Privacy',
        privacidadTexto: 'Your progress is stored in your own browser. There is no sign-up and nothing is uploaded.',
        fecha: 'Collection revised on ' + fecha + '.'
      }
    : {
        que: 'Qué es Spritedex',
        queTexto: 'Un rastreador gratuito de colecciones de espíritus de Fortnite. Muestra cada espíritu con su familia, variante, rareza, probabilidad, costo de invocación, habilidad y dónde aparece, y te deja marcar cuáles tienes y hasta qué nivel los subiste.',
        por: 'Por qué existe',
        porTexto: 'Llevar la colección en la cabeza deja de funcionar a los veinte espíritus: se te olvida qué variante te falta y cuál sigue en nivel 2. El Spritedex convierte eso en una lista que puedes consultar y en una tarjeta que puedes enviar a quien intercambia contigo.',
        datos: 'De dónde salen los datos',
        datosTexto: 'Nombres, rarezas, probabilidades, costos, habilidades y sitios de aparición salen del juego y de fuentes de la comunidad. La colección se revisa a mano y se fecha en cada compilación, así que lo que lees puede cambiar cuando cambia el juego. Puede tener errores.',
        quien: 'Quién lo hace',
        quienTexto: 'Es un proyecto personal de fans, no una empresa. La colección se mantiene a mano y la aplicación está hecha para ir rápido y funcionar sin cuenta.',
        no: 'Qué no es',
        noTexto: 'Spritedex no tiene relación con Epic Games y no vende nada. Tampoco es una web de noticias ni de estadísticas: solo sigue espíritus.',
        privacidad: 'Privacidad',
        privacidadTexto: 'Tu progreso se guarda en tu propio navegador. No hay registro y no se sube nada.',
        fecha: 'Colección revisada el ' + fecha + '.'
      };
  const cuerpo = [
    migasContenido(lang, enIngles ? 'About' : 'Acerca de'),
    '<main>',
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    '<h2>' + escapar(h.que) + '</h2><p>' + escapar(h.queTexto) + '</p>',
    '<h2>' + escapar(h.por) + '</h2><p>' + escapar(h.porTexto) + '</p>',
    '<h2>' + escapar(h.datos) + '</h2><p>' + escapar(h.datosTexto) + '</p>',
    '<h2>' + escapar(h.quien) + '</h2><p>' + escapar(h.quienTexto) + '</p>',
    '<h2>' + escapar(h.no) + '</h2><p>' + escapar(h.noTexto) + '</p>',
    '<h2>' + escapar(h.privacidad) + '</h2><p>' + escapar(h.privacidadTexto + ' ') + '<a href="/privacidad">' + escapar(enIngles ? 'Privacy policy (in Spanish)' : 'Política de privacidad') + '</a>.</p>',
    ctaHtml(lang),
    '<p class="nota">' + escapar(h.fecha) + '</p>',
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}
