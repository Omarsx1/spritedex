// Invariantes de las paginas de espiritu: URLs estables, etiquetas en rango, canonical
// autorreferente y contenido en el idioma que toca (el ingles no puede llevar texto español).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugDeEspiritu, rutaEspiritu, canonicalEspiritu, alternatesDeEspiritu,
  etiquetasEspiritu, etiquetasHubEspiritus, htmlPaginaEspiritu, htmlHubEspiritus
} from '../src/seo/espiritus.js';

const ficha = {
  id: 'spookydash_gold',
  rareza: 'Special',
  generacion: 2,
  drop: '0.75%',
  thumb: '/sprites/thumbs/spookydash_gold.webp',
  lanzamiento: '2026-10-01',
  hermanas: [
    { id: 'spookydash_gold', es: { nombre: 'Impulso aterrador Dorado' }, en: { nombre: 'Gold Spooky Dash' } },
    { id: 'spookydash_basic', es: { nombre: 'Impulso aterrador' }, en: { nombre: 'Spooky Dash' } }
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
  }
};

test('el slug es estable, sin guiones bajos ni mayusculas', () => {
  assert.equal(slugDeEspiritu('spookydash_gold'), 'spookydash-gold');
  assert.equal(slugDeEspiritu('8bit_basic'), '8bit-basic');
  for (const id of ['spookydash_gold', '8bit_basic', 'theburntpeanut_basic', 'pond_gold']) {
    const slug = slugDeEspiritu(id);
    assert.match(slug, /^[a-z0-9-]+$/, 'slug invalido: ' + slug);
    assert.ok(!slug.includes('_'), 'el slug lleva guion bajo: ' + slug);
  }
  assert.equal(rutaEspiritu('spookydash_gold'), '/espiritu/spookydash-gold');
});

test('cada idioma tiene su canonical y esta dentro del hreflang', () => {
  const es = canonicalEspiritu(ficha.id, 'es');
  const en = canonicalEspiritu(ficha.id, 'en');
  assert.notEqual(es, en);
  const alternates = alternatesDeEspiritu(ficha.id);
  assert.ok(alternates.some((a) => a.href === es));
  assert.ok(alternates.some((a) => a.href === en));
  assert.ok(alternates.some((a) => a.hreflang === 'x-default'));
});

test('titulo y descripcion en rango en los dos idiomas', () => {
  for (const lang of ['es', 'en']) {
    const e = etiquetasEspiritu(ficha, lang);
    assert.ok(e.titulo.length <= 60, lang + ': titulo de ' + e.titulo.length);
    assert.ok(e.titulo.includes(ficha[lang].nombre), lang + ': el titulo no lleva el nombre');
    assert.ok(e.descripcion.length >= 70 && e.descripcion.length <= 160, lang + ': descripcion de ' + e.descripcion.length);
  }
});

test('un nombre larguisimo no rompe el limite de 60', () => {
  const largo = { ...ficha, es: { ...ficha.es, nombre: 'Aventurero Cazarrecompensas del Punto Cero Dorado Mejorado' } };
  const e = etiquetasEspiritu(largo, 'es');
  assert.ok(e.titulo.length <= 60, 'titulo de ' + e.titulo.length);
});

test('la pagina lleva un solo h1, el canonical, el hreflang y el JSON-LD', () => {
  for (const lang of ['es', 'en']) {
    const html = htmlPaginaEspiritu(ficha, lang);
    assert.equal((html.match(/<h1>/g) || []).length, 1, lang + ': h1 unico');
    assert.ok(html.includes('<link rel="canonical" href="' + canonicalEspiritu(ficha.id, lang) + '" />'));
    assert.equal((html.match(/hreflang=/g) || []).length, 3, lang + ': tres hreflang');
    assert.equal((html.match(/application\/ld\+json/g) || []).length, 1, lang + ': un JSON-LD');
    assert.ok(html.includes('<html lang="' + lang + '">'));
    assert.ok(html.includes('alt="' + ficha[lang].nombre + '"'), lang + ': falta el alt');
  }
});

test('la pagina en ingles no lleva texto en español (ni al reves)', () => {
  const es = htmlPaginaEspiritu(ficha, 'es');
  const en = htmlPaginaEspiritu(ficha, 'en');
  assert.ok(es.includes(ficha.es.habilidad));
  assert.ok(!en.includes(ficha.es.habilidad), 'la version inglesa lleva la habilidad en español');
  assert.ok(!en.includes(ficha.es.ubicacion), 'la version inglesa lleva la ubicacion en español');
  assert.ok(!en.includes(ficha.es.costo), 'la version inglesa lleva el costo en español');
  assert.ok(en.includes(ficha.en.habilidad));
  assert.ok(!es.includes(ficha.en.habilidad), 'la version española lleva la habilidad en ingles');
});

test('enlaza a sus variantes y marca la actual como pagina actual', () => {
  const html = htmlPaginaEspiritu(ficha, 'es');
  assert.ok(html.includes('/espiritu/spookydash-basic'), 'no enlaza a la hermana');
  assert.ok(html.includes('aria-current="page"'), 'la variante actual deberia ser texto, no enlace');
});

test('el indice enlaza a todas las fichas y su ItemList las cuenta', () => {
  const fichas = [ficha, { ...ficha, id: 'water_basic', hermanas: [], es: { ...ficha.es, nombre: 'Agua' }, en: { ...ficha.en, nombre: 'Water' } }];
  for (const lang of ['es', 'en']) {
    const html = htmlHubEspiritus(fichas, lang);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes('/espiritu/spookydash-gold'));
    assert.ok(html.includes('/espiritu/water-basic'));
    assert.ok(html.includes('"numberOfItems":2'), lang + ': ItemList mal contado');
    const e = etiquetasHubEspiritus(2, lang);
    assert.ok(e.titulo.length <= 60 && e.descripcion.length <= 160);
  }
});

test('el contenido se escapa: un nombre con etiquetas no rompe el HTML', () => {
  const raro = { ...ficha, es: { ...ficha.es, nombre: 'Espíritu <script>alert(1)</script>' } };
  const html = htmlPaginaEspiritu(raro, 'es');
  assert.ok(!html.includes('<script>alert(1)</script>'), 'se colo HTML sin escapar');
  assert.ok(html.includes('&lt;script&gt;'), 'deberia ir escapado');
});
