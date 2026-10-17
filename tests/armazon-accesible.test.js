// Invariantes de accesibilidad del ARMAZON de paginas estaticas (src/seo/plantilla.js).
//
// El armazon viste la guia, /acerca, /novedades y las 564 fichas de espiritu. Estas pruebas
// fijan las reglas que el HTML generado debe cumplir en las tres lenguas, porque el mismo
// defecto se multiplica por las 570 paginas: el aria-label "Ruta" en español tambien viajaba a
// las versiones inglesa y portuguesa.
//
// Son pruebas sobre el HTML generado (texto), no sobre el CSS computado: donde el criterio es
// puramente visual (objetivos de 24x24 px) se comprueba que la regla existe en la hoja, y la
// comprobacion de teclado se hace a mano.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlGuia, htmlAcerca, htmlNovedades } from '../src/seo/contenido.js';
import { htmlPaginaEspiritu, htmlHubEspiritus } from '../src/seo/espiritus.js';

const IDIOMAS = ['es', 'en', 'pt-BR'];

// Como se llama la miga en cada lengua. El valor español es el que estaba fijo en el codigo y
// el causante del defecto 3.1.2 en /en y /pt-br.
const MIGA = {
  es: 'Ruta de navegación',
  en: 'Breadcrumb',
  'pt-BR': 'Navegação estrutural'
};

const IDIOMA_UI = {
  es: 'Idioma',
  en: 'Language',
  'pt-BR': 'Idioma'
};

const datosGuia = {
  total: 278,
  familias: 24,
  porRareza: [{ nombre: 'Special', n: 120 }, { nombre: 'Rare', n: 100 }, { nombre: 'Legendary', n: 40 }, { nombre: 'Epic', n: 12 }, { nombre: 'Mythic', n: 6 }],
  costos: 15,
  dropMin: 0.75,
  dropMax: 5,
  fecha: '2026-10-04'
};

const ficha = {
  id: 'spookydash_gold',
  rareza: 'Special',
  generacion: 2,
  drop: '0.75%',
  thumb: '/sprites/thumbs/spookydash_gold.webp',
  lanzamiento: '2026-10-01',
  hermanas: [
    { id: 'spookydash_gold', es: { nombre: 'Impulso aterrador Dorado' }, en: { nombre: 'Gold Spooky Dash' }, 'pt-BR': { nombre: 'Impulso Aterrorizante Dourado' } },
    { id: 'spookydash_basic', es: { nombre: 'Impulso aterrador' }, en: { nombre: 'Spooky Dash' }, 'pt-BR': { nombre: 'Impulso Aterrorizante' } }
  ],
  es: {
    nombre: 'Impulso aterrador Dorado',
    familia: 'Impulso aterrador',
    variante: 'Dorado',
    habilidad: 'Aumenta su poder en cada subida de nivel.',
    perk: 'Suelta un objeto extra.',
    ubicacion: 'Cofres de Sprite & Zonas de Extracción',
    costo: '5,000 Polvo Estelar'
  },
  en: {
    nombre: 'Gold Spooky Dash',
    familia: 'Spooky Dash',
    variante: 'Gold',
    habilidad: 'Grows stronger with every level up.',
    perk: 'Drops an extra item.',
    ubicacion: 'Sprite Chests & Extraction Zones',
    costo: '5,000 Stardust'
  },
  // Los tres idiomas: las paginas se generan para es, en y pt-BR, y un fixture sin pt-BR
  // reventaba con TypeError en vez de fallar la asercion que se queria comprobar.
  'pt-BR': {
    nombre: 'Impulso Aterrorizante Dourado',
    familia: 'Impulso Aterrorizante',
    variante: 'Dourado',
    habilidad: 'Fica mais forte a cada nível.',
    perk: 'Solta um item extra.',
    ubicacion: 'Baús de Espírito & Zonas de Extração',
    costo: '5.000 Poeira Estelar'
  }
};

// Las cinco familias de pagina que usan el armazon, con un nombre para los mensajes de fallo.
const paginas = [
  ['guia', (lang) => htmlGuia(datosGuia, lang)],
  ['acerca', (lang) => htmlAcerca(datosGuia, lang)],
  ['novedades', (lang) => htmlNovedades({ ultimos: [{ ...ficha, slug: 'spookydash-gold' }] }, lang)],
  ['ficha', (lang) => htmlPaginaEspiritu(ficha, lang)],
  ['hub', (lang) => htmlHubEspiritus([ficha], lang)]
];

test('2.4.1: cada pagina ofrece saltar al contenido y el destino existe y es enfocable', () => {
  for (const [nombre, htmlDe] of paginas) {
    for (const lang of IDIOMAS) {
      const html = htmlDe(lang);
      const donde = nombre + '/' + lang;
      // El enlace va antes que la cabecera y el conmutador: si no, quien navega con teclado
      // tiene que atravesar la navegacion en cada pagina para llegar al texto.
      assert.match(html, /<body>\s*<a class="saltar" href="#contenido">/, donde + ': falta el enlace de salto al principio del body');
      // tabindex="-1" permite que el foco caiga en el destino sin meterlo en el orden del tabulador.
      assert.match(html, /<main id="contenido"[^>]*tabindex="-1"/, donde + ': el main no es destino enfocable del salto');
    }
  }
});

test('2.4.7 / 2.4.11: la hoja define un anillo de foco visible', () => {
  for (const [nombre, htmlDe] of paginas) {
    const html = htmlDe('es');
    assert.match(html, /:focus-visible\s*\{/, nombre + ': no hay regla :focus-visible');
    assert.match(html, /outline:\s*\d+px solid var\(--acento\)/, nombre + ': el anillo de foco no usa el acento');
  }
});

test('3.1.2: el aria-label de las migas va en el idioma de la pagina', () => {
  for (const [nombre, htmlDe] of paginas) {
    for (const lang of IDIOMAS) {
      const html = htmlDe(lang);
      const donde = nombre + '/' + lang;
      assert.ok(html.includes('aria-label="' + MIGA[lang] + '"'), donde + ': la miga deberia decir "' + MIGA[lang] + '"');
      if (lang !== 'es') {
        assert.ok(!html.includes('aria-label="Ruta"'), donde + ': quedo el aria-label en español');
      }
    }
  }
});

test('3.1.1: el conmutador de idioma se anuncia en el idioma de la pagina', () => {
  for (const [nombre, htmlDe] of paginas) {
    for (const lang of IDIOMAS) {
      const html = htmlDe(lang);
      assert.ok(html.includes('aria-label="' + IDIOMA_UI[lang] + '"'), nombre + '/' + lang + ': falta el aria-label del conmutador');
    }
  }
});

test('1.3.1: las tablas marcan encabezados de columna y de fila, y llevan titulo', () => {
  const guia = htmlGuia(datosGuia, 'es');
  assert.ok(guia.includes('<th scope="col">'), 'guia: la cabecera de columna no lleva scope');
  // La primera celda de cada fila nombra la rareza: es encabezado de fila, como en la vista de la app.
  assert.ok(guia.includes('<th scope="row">'), 'guia: la rareza deberia ser encabezado de fila');
  assert.match(guia, /<caption[^>]*>[^<]+<\/caption>/, 'guia: la tabla no lleva titulo');

  const novedades = htmlNovedades({ ultimos: [{ ...ficha, slug: 'spookydash-gold' }] }, 'es');
  assert.ok(novedades.includes('<th scope="col">'), 'novedades: falta scope en las cabeceras');
  assert.match(novedades, /<caption[^>]*>[^<]+<\/caption>/, 'novedades: la tabla no lleva titulo');
});

test('S4: las paginas estaticas siguen sin JavaScript', () => {
  for (const [nombre, htmlDe] of paginas) {
    for (const lang of IDIOMAS) {
      const html = htmlDe(lang);
      const donde = nombre + '/' + lang;
      // Un unico <script>, el del JSON-LD. Ninguno con src: el armazon no carga bundle.
      assert.equal((html.match(/<script/g) || []).length, 1, donde + ': deberia haber exactamente un script (el JSON-LD)');
      assert.ok(!/<script[^>]+src=/.test(html), donde + ': el armazon no debe cargar JavaScript');
      assert.match(html, /<script type="application\/ld\+json">/, donde + ': el script que hay deberia ser el JSON-LD');
    }
  }
});

test('2.5.8: los objetivos del conmutador de idioma llegan a 24x24 px', () => {
  const html = htmlGuia(datosGuia, 'es');
  // Comprobacion de presencia de la regla, no de medida real: el layout se verifica a mano.
  assert.match(html, /min-height:\s*24px/, 'falta la altura minima de los objetivos');
  assert.match(html, /\.saltar:focus/, 'el enlace de salto no se muestra al recibir foco');
});
