// Salida en portugues (Brasil) del SEO: idioma del <html>, canonical, og:locale, conmutador de
// tres idiomas, JSON-LD con inLanguage y rotulos en portugues sin signos de apertura del español.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlPaginaEspiritu, etiquetasHubEspiritus, jsonLdEspiritu } from '../src/seo/espiritus.js';
import { modeloGuia } from '../src/seo/guia.js';
import { SITIO } from '../src/seo/rutas.js';

const hermana = (id, nombre) => ({ id, es: { nombre }, en: { nombre }, 'pt-BR': { nombre } });

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
    hermanas: [hermana('prueba_basico', 'Espírito Teste'), hermana('prueba_dourado', 'Espírito Dourado')],
    es: base,
    en: { ...base, nombre: 'Test Sprite', familia: 'Water', variante: 'Basic', habilidad: 'Gives extra shield.', ubicacion: 'River', costo: '500 Stardust' },
    'pt-BR': { ...base, nombre: 'Espírito Teste', familia: 'Água', variante: 'Básico', habilidad: 'Dá escudo extra.', ubicacion: 'Rio', costo: '500 Poeira Estelar' }
  };
}

test('la pagina pt-BR declara su idioma, canonical, og:locale y los tres hreflang mas x-default', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-BR');
  assert.match(html, /<html lang="pt-BR"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/spritedex\.gg\/pt-br\/espiritu\/prueba-basico" \/>/);
  assert.match(html, /<meta property="og:locale" content="pt_BR" \/>/);
  assert.match(html, /<meta property="og:locale:alternate" content="es_MX" \/>/);
  for (const lang of ['es', 'en', 'pt-BR', 'x-default']) {
    assert.match(html, new RegExp('<link rel="alternate" hreflang="' + lang + '"'));
  }
});

test('el conmutador lista los tres idiomas, marca el actual y enlaza cada version', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-BR');
  const nav = html.match(/<nav class="idiomas"[\s\S]*?<\/nav>/)[0];
  assert.match(nav, /<a href="\/espiritu\/prueba-basico" hreflang="es">Español<\/a>/);
  assert.match(nav, /<a href="\/en\/espiritu\/prueba-basico" hreflang="en">English<\/a>/);
  assert.match(nav, /<span aria-current="true">Português \(Brasil\)<\/span>/);
});

test('el texto pt-BR no arrastra signos de apertura del español', () => {
  const html = htmlPaginaEspiritu(fichaDePrueba(), 'pt-BR');
  assert.doesNotMatch(html, /[¡¿]/);
});

test('la ficha pt-BR traduce la rareza, usa coma decimal y su JSON-LD lleva inLanguage pt-BR', () => {
  const ficha = fichaDePrueba();
  const html = htmlPaginaEspiritu(ficha, 'pt-BR');
  assert.match(html, /<dt>Raridade<\/dt><dd>Mítico<\/dd>/);
  assert.match(html, /<dd>1,50%<\/dd>/);
  const json = jsonLdEspiritu(ficha, 'pt-BR');
  const pagina = json['@graph'][0];
  assert.equal(pagina.inLanguage, 'pt-BR');
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

test('el hub pt-BR tiene titulo, canonical y hreflang propios', () => {
  const pt = etiquetasHubEspiritus(285, 'pt-BR');
  assert.equal(pt.canonical, SITIO + '/pt-br/espiritus');
  assert.match(pt.titulo, /Todos os espíritos de Fortnite/);
  assert.equal(pt.alternates.length, 4);
  assert.match(pt.descripcion, /285 espíritos/);
});

test('la guia pt-BR lleva sus preguntas en portugues sin signos de apertura y con coma decimal', () => {
  const datos = { fecha: '2026-10-04', total: 285, familias: 40, costos: 5, dropMin: 0.5, dropMax: 12.5, porRareza: [{ nombre: 'Mythic', n: 3 }] };
  const guia = modeloGuia('pt-BR', datos);
  const textos = guia.faq.entradas.map(([p, r]) => p + ' ' + r).join(' ');
  assert.doesNotMatch(textos, /[¡¿]/);
  assert.match(textos, /0,5% a 12,5%/);
  assert.equal(guia.secciones[2].tabla.cabeceras[0], 'Raridade');
  assert.equal(guia.secciones[2].tabla.filas[0][0], 'Mítico');
});
