// Genera los nombres en INGLES del catalogo a partir de la captura cruda de fortnite.gg.
//
//   src/data/i18n/catalog.en.json  -> id de espiritu -> nombre en ingles
//   src/data/i18n/familias.en.json -> id de familia  -> etiqueta de familia en ingles
//
// La fuente trae DOS nombres por espiritu y hay que elegir bien: "name" es el nombre del
// juego ("Loot Hacker Jonesy", "Gold Jonesy") y "fullName" es el mismo con " Sprite"
// detras. Se usa "name": es lo que muestra la web de origen y lo que confirma el juego.
// Los combos que no estan en la captura (variantes nuevas) se componen con la misma regla:
// "<Variante> <Familia>".
//
// Uso: node scripts/build_locale_catalog.mjs          (escribe los JSON)
//      node scripts/build_locale_catalog.mjs --check  (falla si quedaron desfasados)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const CRUDO = path.join(RAIZ, 'src/data/fortnite_gg_sprites_complete.json');
const CATALOGO = path.join(RAIZ, 'src/data/official_sprites.json');
const DESTINO_CATALOGO = path.join(RAIZ, 'src/data/i18n/catalog.en.json');
const DESTINO_FAMILIAS = path.join(RAIZ, 'src/data/i18n/familias.en.json');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const leer = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// id de nuestro catalogo -> parent de la captura cruda. Los 46 pares, curados a mano
// porque el codename de la fuente (BushRanger, WinnerB) no se parece al nombre visible.
const FAMILIAS = {
  water: 'Water', earth: 'Earth', fire: 'Spitfire', air: 'Air', duck: 'Duck', ghost: 'Ghost',
  dream: 'Sleepy', demon: 'Demon', punk: 'Punk', king: 'King', zeropoint: 'ZeroPoint',
  theburntpeanut: 'BurntPeanut', fishy: 'Fishy', striker: 'Soccer', aura: 'Drifter', boss: 'Boss',
  grim: 'Grim', seven: 'Seven', batman: 'Batman', pollo: 'CompanyStargazer', vini: 'CokeParmesan',
  wick: 'FillerGrunt', peely: 'Peely', llama: 'Llama', ironmouse: 'PedicureAntacid',
  klombo: 'Klombo', crown: 'Crown', jackrabbit: 'CosmicThunderDoubleJump', sonic: 'NarrowFlea',
  shadow: 'ReloadOverTime', tails: 'NarrowFleaMonkey', killswitch: 'Killswitch', bush: 'BushRanger',
  adventure: 'Dwarf', jonesy: 'Jonesy', '8bit': '8BitBlaster', stormscout: 'StormScout',
  overshield: 'Overshield', onigiri: 'WinnerC', xray: 'WinnerB', megaman: 'ImprovedSlide',
  crash: 'BodySlam', morgana: 'IncreaseHeals', blinky: 'GhostDamage', birthday: 'Birthday',
  pond: 'WinnerA', spookydash: 'PhaseDash', vampire: 'HealthSiphon', deer: 'IncreasedMelee',
  dumpsterdive: 'WinnerD'
};

// tema de nuestro catalogo -> variante de la captura cruda, y su etiqueta en ingles
// cuando hay que componer el nombre a mano.
const VARIANTES = {
  Basic: { fuente: 'Basic', etiqueta: '' },
  Gold: { fuente: 'Gold', etiqueta: 'Gold' },
  Cheatmaster: { fuente: 'Cheatmaster', etiqueta: 'Cheat Master' },
  'Loot Hacker': { fuente: 'Loot hacker', etiqueta: 'Loot Hacker' },
  'Bounty Hunter': { fuente: 'Bounty hunter', etiqueta: 'Bounty Hunter' },
  'Trick or Treat': { fuente: 'Tricktreat', etiqueta: 'Trick or Treat' },
  Candy: { fuente: 'Candy', etiqueta: 'Gummy' },
  Galaxy: { fuente: 'Galaxy', etiqueta: 'Galaxy' },
  Holofoil: { fuente: 'Holofoil', etiqueta: 'Holofoil' },
  Gem: { fuente: 'Gem', etiqueta: 'Gem' },
  Quack: { fuente: 'Quack', etiqueta: 'Quack' },
  Cube: { fuente: 'Cube', etiqueta: 'Cube' }
};

export function construirCatalogo() {
  const crudo = leer(CRUDO);
  const catalogo = leer(CATALOGO);
  if (!Array.isArray(crudo) || !Array.isArray(catalogo)) {
    throw new Error('Se esperaban dos arrays en las fuentes de datos.');
  }

  const porClave = new Map();
  crudo.forEach((item) => {
    if (!item || !item.parent || !item.variant || !item.fullName) return;
    const clave = norm(item.parent) + '_' + norm(item.variant);
    if (!porClave.has(clave)) porClave.set(clave, item);
  });

  // Nombre del juego: se prefiere "name" y, si algun dia faltara, el "fullName" sin sufijo.
  const sinSufijo = (item) => String(item.name || item.fullName || '').replace(/\s*Sprite\s*$/i, '').trim();

  // Etiqueta de familia en ingles: la entrada Basic de esa familia.
  const etiquetasFuente = {};
  crudo.forEach((item) => {
    if (norm(item.variant) !== 'basic' || !item.fullName) return;
    const etiqueta = sinSufijo(item);
    const clave = norm(item.parent);
    if (etiqueta && !etiquetasFuente[clave]) etiquetasFuente[clave] = etiqueta;
  });

  const salida = {};
  const familias = {};
  const compuestos = [];
  const problemas = [];

  catalogo.forEach((espiritu) => {
    const base = String(espiritu.id).split('_')[0].toLowerCase();
    const familia = FAMILIAS[base];
    if (!familia) {
      problemas.push('familia sin mapear: ' + base + ' (' + espiritu.id + ')');
      return;
    }
    const variante = VARIANTES[espiritu.theme];
    if (!variante) {
      problemas.push('variante sin mapear: ' + espiritu.theme + ' (' + espiritu.id + ')');
      return;
    }

    const etiquetaFamilia = etiquetasFuente[norm(familia)];
    if (!etiquetaFamilia) {
      problemas.push('familia sin nombre en ingles: ' + familia + ' (' + espiritu.id + ')');
      return;
    }
    familias[base] = etiquetaFamilia;

    const encontrado = porClave.get(norm(familia) + '_' + norm(variante.fuente));
    if (encontrado && (encontrado.name || encontrado.fullName)) {
      salida[espiritu.id] = sinSufijo(encontrado);
      return;
    }

    const nombre = (variante.etiqueta ? variante.etiqueta + ' ' : '') + etiquetaFamilia;
    salida[espiritu.id] = nombre;
    compuestos.push(espiritu.id + ' -> ' + nombre);
  });

  if (problemas.length) {
    throw new Error('Catalogo en ingles incompleto:\n' + problemas.join('\n'));
  }
  return { salida, familias, compuestos, total: catalogo.length };
}

const esEjecucionDirecta = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esEjecucionDirecta) {
  const { salida, familias, compuestos, total } = construirCatalogo();
  // Orden fijo por clave. El catalogo se armaba en el orden del catalogo de espiritus, que
  // cambia con cada sincronizacion, asi que el archivo se reescribia entero solo por mover
  // lineas de sitio. Con las claves ordenadas, el texto solo cambia si cambia un nombre.
  const ordenarClaves = (objeto) => Object.fromEntries(
    Object.keys(objeto).sort().map((clave) => [clave, objeto[clave]])
  );
  const textoCatalogo = JSON.stringify(ordenarClaves(salida), null, 2) + '\n';
  const textoFamilias = JSON.stringify(ordenarClaves(familias), null, 2) + '\n';
  const soloCheck = process.argv.includes('--check');

  if (soloCheck) {
    const actualCatalogo = fs.existsSync(DESTINO_CATALOGO) ? fs.readFileSync(DESTINO_CATALOGO, 'utf8') : '';
    const actualFamilias = fs.existsSync(DESTINO_FAMILIAS) ? fs.readFileSync(DESTINO_FAMILIAS, 'utf8') : '';
    if (actualCatalogo !== textoCatalogo || actualFamilias !== textoFamilias) {
      console.error('Los nombres en ingles quedaron desfasados. Corre: node scripts/build_locale_catalog.mjs');
      process.exit(1);
    }
    console.log('Catalogo en ingles al dia: ' + total + ' nombres, ' + Object.keys(familias).length + ' familias.');
  } else {
    fs.mkdirSync(path.dirname(DESTINO_CATALOGO), { recursive: true });
    fs.writeFileSync(DESTINO_CATALOGO, textoCatalogo);
    fs.writeFileSync(DESTINO_FAMILIAS, textoFamilias);
    console.log('Escritos catalog.en.json y familias.en.json.');
    console.log('  nombres totales: ' + total);
    console.log('  sacados del nombre real del juego: ' + (total - compuestos.length));
    console.log('  compuestos con la regla del juego: ' + compuestos.length);
    console.log('  familias: ' + Object.keys(familias).length);
    compuestos.forEach((c) => console.log('    ' + c));
  }
}
