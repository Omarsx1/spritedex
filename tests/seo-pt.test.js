// Salida en portugues del SEO: pt-PT sin formas de Brasil ni signos de apertura, idioma del
// <html>, og:locale, conmutador de cuatro idiomas, JSON-LD con inLanguage y rotulos en portugues.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlPaginaEspiritu, etiquetasHubEspiritus, jsonLdEspiritu } from '../src/seo/espiritus.js';
import { modeloGuia } from '../src/seo/guia.js';
import { SITIO } from '../src/seo/rutas.js';

const hermana = (id, nombre) => ({ id, es: { nombre }, en: { nombre }, 'pt-BR': { nombre }, 'pt-PT': { nombre } });

function fichaDePrueba() {
  const base = {
    nombre: 'Espíritu Prueba',
    familia: 'Agua',
    variante: 'Básico',
    habilidad: 'Da escudo extra al equipo.',
    perk: '',
    ubicacion: 'Río',
    costo: '500 Polvo Estelar'
  };
  return {
    id: 'prueba_basico',
    rareza: 'Mythic',
    generacion: 2,
    drop: '1.50%',
    thumb: '',
    lanzamiento: '2026-04-01',
    hermanas: [hermana('prueba_basico', 'Espíritu Prueba'), hermana('prueba_dorado', 'Espíritu Dorado')],
    es: base,
    en: { ...base, nombre: 'Test Sprite', familia: 'Water', variante: 'Basic', habilidad: 'Gives extra shield.', ubicacion: 'River', costo: '500 Stardust' },
    'pt-BR': { ...base, nombre: 'Espírito Teste', familia: 'Água', variante: 'Básico', habilidad: 'Dá escudo extra.', ubicacion: 'Rio', costo: '500 Poeira Estelar' },
    'pt-PT': { ...base, nombre: 'Espírito Teste', familia: 'Água', variante: 'Básico', habilidad: 'Dá escudo extra.', ubicacion: 'Rio', costo: '500 Pó Estelar' }
  };
}

test('la pagina pt-PT declara su idioma, canonical, og:locale y las cuatro hreflang', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-PT');
  assert.match(html, /<html lang="pt-PT"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/spritedex\.gg\/pt-pt\/espiritu\/prueba-basico" \/>/);
  assert.match(html, /<meta property="og:locale" content="pt_PT" \/>/);
  assert.match(html, /<meta property="og:locale:alternate" content="es_MX" \/>/);
  for (const lang of ['es', 'en', 'pt-BR', 'pt-PT', 'x-default']) {
    assert.match(html, new RegExp('<link rel="alternate" hreflang="' + lang + '"'));
  }
});

test('el conmutador lista los cuatro idiomas, marca el actual y enlaza cada version', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-PT');
  const nav = html.match(/<nav class="idiomas"[\s\S]*?<\/nav>/)[0];
  assert.match(nav, /<a href="\/espiritu\/prueba-basico" hreflang="es">Español<\/a>/);
  assert.match(nav, /<a href="\/en\/espiritu\/prueba-basico" hreflang="en">English<\/a>/);
  assert.match(nav, /<a href="\/pt-br\/espiritu\/prueba-basico" hreflang="pt-BR">Português \(Brasil\)<\/a>/);
  assert.match(nav, /<span aria-current="true">Português \(Portugal\)<\/span>/);
});

test('el texto pt-PT no usa "você", ni signos de apertura, ni el registro de Brasil', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-PT');
  assert.doesNotMatch(html, /você/i);
  assert.doesNotMatch(html, /[¡¿]/);
  assert.doesNotMatch(html, /\bestou [a-zà-ú]+ndo\b/i);
});

test('la ficha pt-PT traduce la rareza, usa coma decimal y su JSON-LD lleva inLanguage pt-PT', () => {
  const ficha = fichaDePrueba();
  const html = htmlPaginaEspiritu(ficha, 'pt-PT');
  assert.match(html, /<dt>Raridade<\/dt><dd>Mítico<\/dd>/);
  assert.match(html, /<dd>1,50%<\/dd>/);
  const json = jsonLdEspiritu(ficha, 'pt-PT');
  const pagina = json['@graph'][0];
  assert.equal(pagina.inLanguage, 'pt-PT');
  assert.equal(pagina.mainEntity.category, 'Espírito de Fortnite');
  const migas = json['@graph'][1].itemListElement.map((i) => i.name);
  assert.deepEqual(migas, ['Início', 'Espíritos', 'Espírito Teste']);
});

test('el JSON-LD pt-BR usa sus rotulos y no cae al espanol', () => {
  const json = jsonLdEspiritu(fichaDePrueba(), 'pt-BR');
  const nombres = json['@graph'][0].mainEntity.additionalProperty.map((p) => p.name);
  assert.deepEqual(nombres, ['Família', 'Variante', 'Raridade', 'Geração', 'Probabilidade', 'Custo de invocação', 'Localização']);
  assert.equal(json['@graph'][0].inLanguage, 'pt-BR');
});

test('el hub pt-BR y pt-PT tienen titulo, canonical y hreflang propios', () => {
  const pt = etiquetasHubEspiritus(285, 'pt-PT');
  assert.equal(pt.canonical, SITIO + '/pt-pt/espiritus');
  assert.match(pt.titulo, /Todos os espíritos de Fortnite/);
  assert.equal(pt.alternates.length, 5);
  assert.match(pt.descripcion, /285 espíritos/);
});

test('la guia pt-PT lleva sus preguntas en portugues sin signos de apertura y con coma decimal', () => {
  const datos = { fecha: '2026-10-04', total: 285, familias: 40, costos: 5, dropMin: 0.5, dropMax: 12.5, porRareza: [{ nombre: 'Mythic', n: 3 }] };
  const guia = modeloGuia('pt-PT', datos);
  const textos = guia.faq.entradas.map(([p, r]) => p + ' ' + r).join(' ');
  assert.doesNotMatch(textos, /[¡¿]/);
  assert.doesNotMatch(textos, /você/i);
  assert.match(textos, /0,5% a 12,5%/);
  assert.equal(guia.secciones[2].tabla.cabeceras[0], 'Raridade');
  assert.equal(guia.secciones[2].tabla.filas[0][0], 'Mítico');
});
