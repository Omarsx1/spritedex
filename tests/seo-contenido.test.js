// Invariantes de las paginas de contenido (guia, novedades, acerca): etiquetas en rango,
// canonical autorreferente, y sobre todo que el marcado diga lo mismo que se ve.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlGuia, htmlAcerca, htmlNovedades, etiquetasGuia, etiquetasAcerca, etiquetasNovedades } from '../src/seo/contenido.js';

const guia = {
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
  drop: '0.75%',
  lanzamiento: '2026-10-01',
  es: { nombre: 'Impulso aterrador Dorado', familia: 'Impulso aterrador', variante: 'Dorado' },
  en: { nombre: 'Gold Spooky Dash', familia: 'Spooky Dash', variante: 'Gold' }
};

const paginas = [
  ['guia', etiquetasGuia, (lang) => htmlGuia(guia, lang)],
  ['novedades', etiquetasNovedades, (lang) => htmlNovedades({ ultimos: [{ ...ficha, slug: 'spookydash-gold' }] }, lang)],
  ['acerca', etiquetasAcerca, (lang) => htmlAcerca(guia, lang)]
];

test('etiquetas en rango y canonical autorreferente en las tres paginas y dos idiomas', () => {
  for (const [nombre, etiquetasDe, htmlDe] of paginas) {
    for (const lang of ['es', 'en']) {
      const e = etiquetasDe(lang);
      assert.ok(e.titulo.length <= 60, nombre + '/' + lang + ': titulo de ' + e.titulo.length);
      assert.ok(e.descripcion.length >= 70 && e.descripcion.length <= 160, nombre + '/' + lang + ': descripcion de ' + e.descripcion.length);
      const html = htmlDe(lang);
      assert.equal((html.match(/<h1>/g) || []).length, 1, nombre + '/' + lang + ': un solo h1');
      assert.ok(html.includes('<link rel="canonical" href="' + e.canonical + '" />'));
      // Tres alternates en el head; el conmutador de idioma visible lleva su propio hreflang.
      assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, 3, nombre + '/' + lang + ': tres hreflang en el head');
      assert.ok(html.includes('hreflang="' + (lang === 'en' ? 'es' : 'en') + '"'), nombre + '/' + lang + ': falta el enlace al otro idioma');
      assert.equal((html.match(/application\/ld\+json/g) || []).length, 1, nombre + '/' + lang + ': un JSON-LD');
      assert.ok(html.includes('<html lang="' + lang + '">'));
      const rutaGuia = lang === 'en' ? '/en/guia-espiritus' : '/guia-espiritus';
      assert.ok(html.includes('href="' + rutaGuia + '"'), nombre + '/' + lang + ': el pie no enlaza la guia');
    }
  }
});

test('las preguntas del marcado son las mismas que se ven en la guia', () => {
  for (const lang of ['es', 'en']) {
    const html = htmlGuia(guia, lang);
    const preguntasJson = [...html.matchAll(/"name":"([^"]+?)","acceptedAnswer"/g)].map((m) => m[1]);
    assert.ok(preguntasJson.length >= 5, lang + ': el FAQPage deberia llevar al menos 5 preguntas');
    for (const p of preguntasJson) {
      const visible = p.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      assert.ok(html.includes('>' + visible + '</summary>'), lang + ': pregunta del marcado que no se ve: ' + p);
    }
    assert.equal((html.match(/<details class="faq">/g) || []).length, preguntasJson.length, lang + ': preguntas visibles y marcadas no cuadran');
  }
});

test('la guia usa los numeros reales de la coleccion', () => {
  for (const lang of ['es', 'en']) {
    const html = htmlGuia(guia, lang);
    assert.ok(html.includes('278'), lang + ': falta el total');
    assert.ok(html.includes(String(guia.familias)), lang + ': faltan las familias');
    assert.ok(html.includes('0.75') && html.includes('5'), lang + ': falta el rango de probabilidad');
    assert.equal((html.match(/<tr>/g) || []).length, guia.porRareza.length + 1, lang + ': filas de rareza');
    const fecha = html.includes('2026') || html.includes('4 de octubre');
    assert.ok(fecha, lang + ': falta la fecha de revision');
  }
});

test('las novedades enlazan a la ficha de cada espiritu', () => {
  for (const lang of ['es', 'en']) {
    const html = htmlNovedades({ ultimos: [{ ...ficha, slug: 'spookydash-gold' }] }, lang);
    assert.ok(html.includes('/espiritu/spookydash-gold'));
    assert.ok(html.includes(ficha[lang].nombre));
  }
});

test('acerca dice que no hay relacion con Epic Games y enlaza la privacidad', () => {
  assert.ok(htmlAcerca(guia, 'es').includes('sin relación con Epic Games'));
  assert.ok(htmlAcerca(guia, 'en').includes('not affiliated with Epic Games'));
  assert.ok(htmlAcerca(guia, 'es').includes('/privacidad'));
});

test('un nombre con etiquetas en las novedades se escapa', () => {
  const raro = { ultimos: [{ ...ficha, slug: 'x', es: { ...ficha.es, nombre: '<script>alert(1)</script>' }, en: ficha.en }] };
  const html = htmlNovedades(raro, 'es');
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
