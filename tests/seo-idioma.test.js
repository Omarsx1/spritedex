// Helpers de idioma del SEO: una sola forma de elegir texto por idioma, hreflang completo con
// autorreferencia y x-default, locales de Open Graph y la tabla de rutas con portugues.
import test from 'node:test';
import assert from 'node:assert/strict';
import { porIdioma, ogLocale, ogLocalesAlternos, hreflangsDe, rarezaEnIdioma, numeroEnIdioma } from '../src/seo/idioma.js';
import { RUTAS, SITIO, alternatesDe } from '../src/seo/rutas.js';
import { idiomaDeRuta } from '../src/i18n/core.js';

test('porIdioma devuelve el valor de cada idioma y solo cae a espanol si falta la clave', () => {
  const opciones = { es: 'hola', en: 'hi', 'pt-BR': 'oi' };
  assert.equal(porIdioma('pt-BR', opciones), 'oi');
  assert.equal(porIdioma('en', opciones), 'hi');
  assert.equal(porIdioma('fr', { es: 'hola', en: 'hi' }), 'hola');
});

test('og:locale usa es_MX, en_US y pt_BR, y los alternos son los demas idiomas', () => {
  assert.equal(ogLocale('es'), 'es_MX');
  assert.equal(ogLocale('en'), 'en_US');
  assert.equal(ogLocale('pt-BR'), 'pt_BR');
  assert.deepEqual(ogLocalesAlternos('pt-BR'), ['es_MX', 'en_US']);
  assert.deepEqual(ogLocalesAlternos('es'), ['en_US', 'pt_BR']);
});

test('hreflang tiene los tres idiomas con autorreferencia y x-default en espanol', () => {
  const links = hreflangsDe(SITIO, '/espiritus');
  assert.deepEqual(links.map((l) => l.hreflang), ['es', 'en', 'pt-BR', 'x-default']);
  assert.equal(links.find((l) => l.hreflang === 'pt-BR').href, SITIO + '/pt-br/espiritus');
  assert.equal(links.find((l) => l.hreflang === 'x-default').href, SITIO + '/espiritus');
});

test('el prefijo /pt-br no se confunde con /pt-brasil ni con el retirado /pt-pt', () => {
  assert.equal(idiomaDeRuta('/pt-br/amigos'), 'pt-BR');
  assert.equal(idiomaDeRuta('/pt-pt'), 'es');
  assert.equal(idiomaDeRuta('/pt-brasil'), 'es');
});

test('la tabla de rutas declara pt-BR en la home y en amigos, y privacidad no tiene hreflang', () => {
  const inicio = RUTAS.find((r) => r.ruta === '/');
  assert.ok(inicio.idiomas.includes('pt-BR'));
  const hrefs = alternatesDe('/amigos').map((a) => a.href);
  assert.ok(hrefs.includes(SITIO + '/pt-br/amigos'));
  assert.ok(!hrefs.includes(SITIO + '/pt-pt/amigos'));
  assert.deepEqual(alternatesDe('/privacidad'), []);
});

test('las raridades en portugues usan la etiqueta de la interfaz y el resto conserva el codigo', () => {
  assert.equal(rarezaEnIdioma('Mythic', 'pt-BR'), 'Mítico');
  assert.equal(rarezaEnIdioma('Mythic', 'es'), 'Mythic');
  assert.equal(rarezaEnIdioma('Mythic', 'en'), 'Mythic');
});

test('los decimales usan coma en portugues y punto en espanol e ingles', () => {
  assert.equal(numeroEnIdioma('1.50%', 'pt-BR'), '1,50%');
  assert.equal(numeroEnIdioma('0.0003%', 'pt-BR'), '0,0003%');
  assert.equal(numeroEnIdioma('1.50%', 'es'), '1.50%');
  assert.equal(numeroEnIdioma('1.50%', 'en'), '1.50%');
});
