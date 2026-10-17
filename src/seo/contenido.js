// Paginas de contenido: guia, acerca y novedades.
//
// Las fichas de espiritu son paginas de dato; estas son las que explican el tema y sostienen el
// proyecto de cara a un buscador y a quien llega por primera vez (E-E-A-T: quien lo hace, de
// donde salen los datos y por que). Sin dependencias: reciben los numeros ya calculados y
// devuelven HTML, asi que se prueban con node --test.

import { SITIO, TITULO_SITIO } from './rutas.js';
import { escapar, migas, documento, ctaHtml, recortar, conIdiomaRuta, TEXTO, RUTAS_CONTENIDO, ABRIR_MAIN } from './plantilla.js';
import { modeloGuia, formatearFecha } from './guia.js';
import { hreflangsDe, porIdioma } from './idioma.js';

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
  },
  'pt-BR': {
    guia: 'Guia de espíritos do Fortnite — Spritedex',
    acerca: 'Sobre o Spritedex: quem faz e com quais dados',
    novedades: 'Espíritos novos do Fortnite — Spritedex'
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
  },
  'pt-BR': {
    guia: 'O que são os espíritos do Fortnite, famílias e variantes, raridades, como se conseguem e como sobem de nível do 1 ao 5, com dados da coleção completa.',
    acerca: 'O Spritedex é um rastreador de espíritos do Fortnite feito por fãs: de onde vêm os dados, como seu progresso é guardado e o que este projeto não é.',
    novedades: 'Os últimos espíritos adicionados ao Fortnite com a data, a família, a variante e a probabilidade de obtenção, com link para a ficha de cada um.'
  }
};

function etiquetasDe(clave, lang, extras = {}) {
  const ruta = RUTAS_CONTENIDO[clave];
  return {
    lang,
    titulo: TITULOS[lang][clave],
    tituloDocumento: TITULO_SITIO,
    descripcion: recortar(extras.descripcion || DESCRIPCIONES[lang][clave], 160),
    canonical: SITIO + conIdiomaRuta(ruta, lang),
    alternates: hreflangsDe(SITIO, ruta)
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
  ], lang);
}

// Una celda puede ser un texto suelto o un objeto { texto, color, degradado }: la rareza de la
// guia lleva el color de su rareza, el mismo que muestran las tarjetas de la app.
function celdaHtml(valor, esEncabezadoDeFila) {
  const esObjeto = valor !== null && typeof valor === 'object';
  const texto = escapar(esObjeto ? valor.texto : valor);
  // Degradado y color plano son excluyentes: con la banda, el color va transparente y pintarlo
  // ademas como color dejaria el texto o invisible o sin banda.
  let atributos = '';
  if (esObjeto && valor.degradado) atributos = ' class="rareza-arcoiris"';
  else if (esObjeto && valor.color) atributos = ' style="color: ' + valor.color + '"';
  return esEncabezadoDeFila
    ? '<th scope="row"' + atributos + '>' + texto + '</th>'
    : '<td>' + texto + '</td>';
}

// Una tabla de datos necesita titulo y encabezados con scope: sin ellos, el lector de pantalla
// recorre una rejilla de numeros sin saber que es cada columna (criterio 1.3.1). La primera celda
// de cada fila pasa a ser encabezado de fila cuando nombra la fila, igual que en la vista de la app.
function tabla(cabeceras, filas, { titulo, primeraEsEncabezado = false } = {}) {
  return '<table class="tabla">'
    + (titulo ? '<caption>' + escapar(titulo) + '</caption>' : '')
    + '<thead><tr>' + cabeceras.map((c) => '<th scope="col">' + escapar(c) + '</th>').join('')
    + '</tr></thead><tbody>' + filas.map((f) => '<tr>' + f.map((c, i) => (
      celdaHtml(c, primeraEsEncabezado && i === 0)
    )).join('') + '</tr>').join('')
    + '</tbody></table>';
}

// Un bloque del modelo segun se pinta aqui: parrafo o lista. El modelo no trae HTML.
function bloqueHtml(bloque) {
  if (bloque.tipo === 'lista') {
    return '<ul>' + bloque.items.map((i) => '<li>' + escapar(i) + '</li>').join('') + '</ul>';
  }
  return '<p>' + escapar(bloque.texto) + '</p>';
}

// Cada seccion es una region navegable: `aria-labelledby` apunta a su propio encabezado y el id
// de ese encabezado es tambien el ancla del indice. El id viene del modelo —no se deriva del
// titulo— para que sea el mismo en los tres idiomas y un enlace con ancla no se rompa al cambiar
// de version.
function seccionHtml(seccion) {
  const idTitulo = seccion.id + '-titulo';
  const contenido = '<h2 id="' + idTitulo + '">' + escapar(seccion.titulo) + '</h2>'
    + seccion.bloques.map(bloqueHtml).join('')
    + (seccion.tabla
      ? tabla(seccion.tabla.cabeceras, seccion.tabla.filas, {
        titulo: seccion.tabla.titulo,
        primeraEsEncabezado: true
      })
      : '');
  return '<section id="' + seccion.id + '" aria-labelledby="' + idTitulo + '">' + contenido + '</section>';
}

// Ocho secciones de lectura larga sin navegacion interna obligan a desplazarse a ciegas. El
// indice sale de los mismos ids que usan las secciones, asi que no pueden desincronizarse.
function indiceHtml(modelo) {
  const enlaces = modelo.secciones.concat([modelo.faq]).map((s) => (
    '<li><a href="#' + s.id + '">' + escapar(s.titulo) + '</a></li>'
  )).join('');
  return '<nav class="indice" aria-label="' + escapar(modelo.indice) + '"><ol>' + enlaces + '</ol></nav>';
}

// El FAQ visible sale de los mismos pares que el JSON-LD: si divergieran, el marcado diria algo
// que el usuario no lee.
function faqHtml(entradas) {
  return entradas.map(([p, r]) => (
    '<details class="faq"><summary>' + escapar(p) + '</summary><p>' + escapar(r) + '</p></details>'
  )).join('');
}

function jsonLdFaq(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.entradas.map(([p, r]) => ({
      '@type': 'Question',
      name: p,
      acceptedAnswer: { '@type': 'Answer', text: r }
    }))
  };
}

function jsonLdPagina(tipo, etiquetas, lang, extra = {}) {
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
          { '@type': 'ListItem', position: 1, name: TEXTO[lang].inicio, item: SITIO + conIdiomaRuta('/', lang) },
          { '@type': 'ListItem', position: 2, name: TEXTO[lang].espiritus, item: SITIO + conIdiomaRuta('/espiritus', lang) },
          { '@type': 'ListItem', position: 3, name: etiquetas.titulo.replace(' — Spritedex', ''), item: etiquetas.canonical }
        ]
      }
    ]
  };
}

export function htmlGuia(datos, lang) {
  const etiquetas = etiquetasGuia(lang);
  // El FAQPage va como nodo del grafo, una sola vez: si ademas fuera mainEntity, las preguntas
  // viajarian duplicadas en el marcado.
  const jsonLd = jsonLdPagina('WebPage', etiquetas, lang);
  const modelo = modeloGuia(lang, datos);
  jsonLd['@graph'].push(jsonLdFaq(modelo.faq));
  const cuerpo = [
    migasContenido(lang, porIdioma(lang, { es: 'Guía', en: 'Guide', 'pt-BR': 'Guia' })),
    ABRIR_MAIN,
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    indiceHtml(modelo),
    ...modelo.secciones.map(seccionHtml),
    ctaHtml(lang),
    '<section id="' + modelo.faq.id + '" aria-labelledby="' + modelo.faq.id + '-titulo">',
    '<h2 id="' + modelo.faq.id + '-titulo">' + escapar(modelo.faq.titulo) + '</h2>',
    faqHtml(modelo.faq.entradas),
    '</section>',
    '<p class="nota">' + escapar(modelo.nota) + '</p>',
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}

const CABECERAS_NOVEDADES = {
  es: ['Lanzamiento', 'Espíritu', 'Familia', 'Variante', 'Probabilidad'],
  en: ['Release', 'Sprite', 'Family', 'Variant', 'Drop'],
  'pt-BR': ['Lançamento', 'Espírito', 'Família', 'Variante', 'Probabilidade']
};

// Titulo de la tabla de novedades. No repite el h1: describe que hay dentro (criterio 1.3.1).
const CAPTIONS_NOVEDADES = {
  es: 'Últimos espíritus añadidos, con su fecha de lanzamiento y su probabilidad',
  en: 'Latest sprites added, with their release date and drop chance',
  'pt-BR': 'Últimos espíritos adicionados, com data de lançamento e probabilidade'
};

export function htmlNovedades(datos, lang) {
  const etiquetas = etiquetasNovedades(lang);
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
    migasContenido(lang, TEXTO[lang].novedades),
    ABRIR_MAIN,
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    tabla(
      CABECERAS_NOVEDADES[lang],
      filas,
      { titulo: CAPTIONS_NOVEDADES[lang] }
    ),
    '<p class="nota">' + escapar(porIdioma(lang, {
      es: 'Las fechas son las registradas en los datos del juego. El detalle completo está en la ficha de cada espíritu.',
      en: 'Dates are the ones recorded in the game data. The sprite pages carry the full detail.',
      'pt-BR': 'As datas são as registradas nos dados do jogo. O detalhe completo está na ficha de cada espírito.'
    })) + '</p>',
    ctaHtml(lang),
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}

// Acerca en portugues: mismo esquema que los objetos de es/en de abajo.
const ACERCA_PT = {
  'pt-BR': {
    que: 'O que é o Spritedex',
    queTexto: 'Um rastreador gratuito de coleções de espíritos do Fortnite. Mostra cada espírito com sua família, variante, raridade, probabilidade, custo de invocação, habilidade e onde aparece, e deixa você marcar quais já tem e até que nível os subiu.',
    por: 'Por que existe',
    porTexto: 'Guardar a coleção de cabeça deixa de funcionar lá pelos vinte espíritos: você esquece qual variante falta e qual ainda está no nível 2. O Spritedex transforma isso em uma lista que você pode consultar e em um cartão que pode enviar para quem troca com você.',
    datos: 'De onde vêm os dados',
    datosTexto: 'Nomes, raridades, probabilidades, custos, habilidades e locais de aparição vêm do jogo e de fontes da comunidade. A coleção é revisada à mão e datada a cada atualização, então o que você lê aqui pode mudar quando o jogo muda. Pode conter erros.',
    quien: 'Quem faz',
    quienTexto: 'É um projeto pessoal de fãs, não uma empresa. A coleção é mantida à mão e o aplicativo foi feito para ser rápido e funcionar sem conta.',
    no: 'O que não é',
    noTexto: 'O Spritedex não tem relação com a Epic Games e não vende nada. Também não é um site de notícias nem de estatísticas: só acompanha espíritos.',
    privacidad: 'Privacidade',
    privacidadTexto: 'Seu progresso fica guardado no seu próprio navegador. Não há cadastro e nada é enviado.',
    fecha: (f) => 'Coleção revisada em ' + f + '.'
  }
};

export function htmlAcerca(datos, lang) {
  const etiquetas = etiquetasAcerca(lang);
  const fecha = formatearFecha(datos.fecha, lang);
  const jsonLd = jsonLdPagina('AboutPage', etiquetas, lang, {
    about: { '@type': 'VideoGame', name: 'Fortnite' }
  });
  const h = ACERCA_PT[lang] ? { ...ACERCA_PT[lang], fecha: ACERCA_PT[lang].fecha(fecha) } : porIdioma(lang, {
    en: {
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
      },
    es: {
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
      }
    });
  const cuerpo = [
    migasContenido(lang, TEXTO[lang].acerca),
    ABRIR_MAIN,
    '<h1>' + escapar(etiquetas.titulo.replace(' — Spritedex', '')) + '</h1>',
    '<p class="lead">' + escapar(etiquetas.descripcion) + '</p>',
    '<h2>' + escapar(h.que) + '</h2><p>' + escapar(h.queTexto) + '</p>',
    '<h2>' + escapar(h.por) + '</h2><p>' + escapar(h.porTexto) + '</p>',
    '<h2>' + escapar(h.datos) + '</h2><p>' + escapar(h.datosTexto) + '</p>',
    '<h2>' + escapar(h.quien) + '</h2><p>' + escapar(h.quienTexto) + '</p>',
    '<h2>' + escapar(h.no) + '</h2><p>' + escapar(h.noTexto) + '</p>',
    '<h2>' + escapar(h.privacidad) + '</h2><p>' + escapar(h.privacidadTexto + ' ') + '<a href="/privacidad">' + escapar(porIdioma(lang, {
      es: 'Política de privacidad',
      en: 'Privacy policy (in Spanish)',
      'pt-BR': 'Política de privacidade (em espanhol)'
    })) + '</a>.</p>',
    ctaHtml(lang),
    '<p class="nota">' + escapar(h.fecha) + '</p>',
    '</main>'
  ].join('\n');
  return documento({ lang, etiquetas, jsonLd, cuerpo });
}
