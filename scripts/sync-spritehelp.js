import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { archivoArteCanonico } from '../src/data/spriteAssetMap.js';
import {
  GEN_1_FAMILIES,
  FAMILY_NAMES_ES,
  THEME_NAMES_ES,
  VARIANT_ORDER,
  normalizeKey,
  capitalize
} from './espiritus_compartido.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPRITEHELP_URL = 'https://spritehelp.com';
const PUBLIC_SPRITES_DIR = path.resolve(__dirname, '../public/sprites');
const OFFICIAL_SPRITES_PATH = path.resolve(__dirname, '../src/data/official_sprites.json');
const COMPLETE_SPRITES_PATH = path.resolve(__dirname, '../src/data/fortnite_gg_sprites_complete.json');

// spritehelp publica la fecha sin hora; los lotes salen a las 08:00 UTC, como Dulce o Truco.
const HORA_LANZAMIENTO = 'T08:00:00.000Z';

const TEMA_SPRITEHELP_A_APP = {
  Basic: 'Basic',
  Gold: 'Gold',
  Candy: 'Candy',
  Galaxy: 'Galaxy',
  Gem: 'Gem',
  Holofoil: 'Holofoil',
  Quack: 'Quack',
  Cube: 'Cube',
  Cheat: 'Cheatmaster',
  Hacker: 'Loot Hacker',
  Bounty: 'Bounty Hunter',
  Treat: 'Trick or Treat'
};

const FAMILIA_SPRITEHELP_A_APP = { spooky: 'spookydash' };

const RAREZAS_VALIDAS = new Set(['Rare', 'Special', 'Epic', 'Legendary', 'Mythic']);

// spritehelp da el nombre de la familia para el básico; el juego usa el nombre del espíritu.
export const NOMBRE_EN_REAL = {
  obsession_basic: 'One Wish Willow Sprite'
};

export function extraerChunks(html) {
  const rutas = [...html.matchAll(/\/_next\/static\/chunks\/[^"'\s]+\.js/g)].map((m) => m[0]);
  return [...new Set(rutas)].map((ruta) => `${SPRITEHELP_URL}${ruta}`);
}

// Los espíritus vienen del catálogo que spritehelp empaqueta en su JS; las fechas, de los mismos bundles.
// Prioridad de fecha: la del espíritu, luego la del tema (Treat, Cheat...), luego la de la familia.
export function parsearCatalogo(texto) {
  const vistos = new Set();
  const entradas = [];
  const reEntrada = /\{id:"([a-z0-9_]+)",name:"([^"]+)",base:"([^"]+)",theme:"([^"]+)",rarity:"([^"]+)",unreleased:(!0|!1)\}/g;
  for (const m of texto.matchAll(reEntrada)) {
    if (vistos.has(m[1])) continue;
    vistos.add(m[1]);
    entradas.push({
      id: m[1],
      name: m[2],
      base: m[3],
      theme: m[4],
      rarity: m[5],
      unreleased: m[6] === '!0'
    });
  }

  const fechas = new Map();
  for (const m of texto.matchAll(/([A-Za-z][A-Za-z0-9_]*):"(\d{4}-\d{2}-\d{2})"/g)) {
    if (!fechas.has(m[1])) fechas.set(m[1], m[2]);
  }

  return { entradas, fechas };
}

export function fechaDeEspiritu(entrada, fechas) {
  const dia = fechas.get(entrada.id) || fechas.get(entrada.theme) || fechas.get(entrada.base);
  return dia ? `${dia}${HORA_LANZAMIENTO}` : null;
}

function compatibleFamilia(a, b) {
  if (a === b) return true;
  return Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a));
}

export function coincideConOficial(oficial, entrada) {
  const familia = oficial.id.split('_')[0].toLowerCase();
  const tema = normalizeKey(TEMA_SPRITEHELP_A_APP[entrada.theme] || entrada.theme);
  return compatibleFamilia(familia, normalizeKey(entrada.base)) &&
    normalizeKey(oficial.theme) === tema;
}

export function construirProvisional(entrada, fechaLanzamiento) {
  const familiaSpritehelp = normalizeKey(entrada.base);
  const familia = FAMILIA_SPRITEHELP_A_APP[familiaSpritehelp] || familiaSpritehelp;
  const sufijo = entrada.id.slice(entrada.id.indexOf('_') + 1);
  const tema = TEMA_SPRITEHELP_A_APP[entrada.theme] || entrada.theme;
  const esBase = tema === 'Basic';
  const familiaEs = FAMILY_NAMES_ES[familia] || capitalize(familia);
  const temaEs = THEME_NAMES_ES[tema] || tema;
  const rareza = esBase ? (RAREZAS_VALIDAS.has(entrada.rarity) ? entrada.rarity : 'Rare') : 'Special';

  const id = `${familia}_${sufijo}`;
  const espiritu = {
    id,
    name: esBase ? familiaEs : `${familiaEs} ${temaEs}`,
    theme: tema,
    rarity: rareza,
    unreleased: false,
    isNew: true,
    nameEn: NOMBRE_EN_REAL[id] || entrada.name,
    releaseDate: fechaLanzamiento,
    artSource: 'spritehelp'
  };
  if (!GEN_1_FAMILIES.has(familia)) espiritu.gen = 2;
  return espiritu;
}

function insertarEnFamilia(catalogo, espiritu) {
  const familia = espiritu.id.split('_')[0];
  const indices = catalogo.map((s, i) => (s.id.split('_')[0] === familia ? i : -1)).filter((i) => i >= 0);
  if (indices.length === 0) {
    catalogo.push(espiritu);
    return;
  }
  const ordenNuevo = VARIANT_ORDER.indexOf(espiritu.theme);
  const antes = indices.find((i) => {
    const ordenActual = VARIANT_ORDER.indexOf(catalogo[i].theme);
    return ordenNuevo !== -1 && (ordenActual === -1 || ordenNuevo < ordenActual);
  });
  catalogo.splice(antes ?? indices[indices.length - 1] + 1, 0, espiritu);
}

async function descargar(url) {
  const respuesta = await fetch(url, { headers: { 'User-Agent': 'spritedex-sync/1.0' } });
  if (!respuesta.ok) throw new Error(`${respuesta.status} ${url}`);
  return respuesta.text();
}

async function descargarArte(idSpritehelp, idApp) {
  const destino = path.join(PUBLIC_SPRITES_DIR, archivoArteCanonico(idApp));
  if (fs.existsSync(destino)) return true;
  const respuesta = await fetch(`${SPRITEHELP_URL}/sprites/${idSpritehelp}.webp`);
  if (!respuesta.ok) return false;
  fs.mkdirSync(PUBLIC_SPRITES_DIR, { recursive: true });
  fs.writeFileSync(destino, Buffer.from(await respuesta.arrayBuffer()));
  return true;
}

async function main() {
  const html = await descargar(`${SPRITEHELP_URL}/`);
  const textos = await Promise.all(extraerChunks(html).map(descargar));
  const { entradas, fechas } = parsearCatalogo(textos.join('\n'));
  if (entradas.length === 0) {
    console.log('::warning::spritehelp no expuso catálogo de espíritus: revisar el formato de sus bundles.');
    return;
  }

  const oficiales = JSON.parse(fs.readFileSync(OFFICIAL_SPRITES_PATH, 'utf-8'));
  const completo = JSON.parse(fs.readFileSync(COMPLETE_SPRITES_PATH, 'utf-8'));
  const nombresFortnite = new Set(completo.map((s) => normalizeKey(s.name)));

  let corregidos = 0;
  for (const oficial of oficiales) {
    const real = NOMBRE_EN_REAL[oficial.id];
    if (oficial.artSource === 'spritehelp' && real && oficial.nameEn !== real) {
      oficial.nameEn = real;
      corregidos++;
    }
  }

  let agregados = 0;
  for (const entrada of entradas) {
    if (entrada.unreleased) continue;
    if (nombresFortnite.has(normalizeKey(entrada.name))) continue;
    if (oficiales.some((o) => coincideConOficial(o, entrada))) continue;

    const espiritu = construirProvisional(entrada, fechaDeEspiritu(entrada, fechas));
    const arte = await descargarArte(entrada.id, espiritu.id);
    if (!arte) console.log(`⚠️ Sin arte en spritehelp para ${entrada.id}: queda el de la app por defecto`);
    insertarEnFamilia(oficiales, espiritu);
    agregados++;
    console.log(`🆕 spritehelp: ${espiritu.id} (${espiritu.name}) lanzado ${espiritu.releaseDate}`);
  }

  if (agregados > 0 || corregidos > 0) {
    fs.writeFileSync(OFFICIAL_SPRITES_PATH, JSON.stringify(oficiales, null, 2), 'utf-8');
  }
  console.log(`spritehelp: ${entradas.length} espíritus leídos, ${agregados} agregados provisionalmente, ${corregidos} nombres en inglés corregidos.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.log(`::warning::Sincronización de spritehelp omitida: ${err.message}`);
  });
}
