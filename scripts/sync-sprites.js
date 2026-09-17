import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://fortnite.gg';
const PUBLIC_SPRITES_DIR = path.resolve(__dirname, '../public/sprites');
const OFFICIAL_SPRITES_PATH = path.resolve(__dirname, '../src/data/official_sprites.json');
const COMPLETE_SPRITES_PATH = path.resolve(__dirname, '../src/data/fortnite_gg_sprites_complete.json');

// Familias de 1ra Generación
const GEN_1_FAMILIES = new Set([
  'water', 'earth', 'fire', 'air', 'duck', 'ghost', 'dream', 'demon', 'punk', 'king',
  'zeropoint', 'theburntpeanut', 'fishy', 'striker', 'aura', 'boss', 'grim', 'seven',
  'batman', 'pollo', 'vini', 'wick', 'peely', 'llama', 'ironmouse'
]);

// Detección dinámica de la ruta del ejecutable de Google Chrome / Chromium
function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const possiblePaths = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Linux / CI GitHub Actions
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

// Diccionario de traducción oficial inglés -> español
const TRANSLATIONS = {
  abilities: {
    'Grants the ability to perform another jump while mid-air! Cooldown between jumps decreases with each Level Up!':
      '¡Otorga la habilidad de realizar un salto adicional en el aire! El tiempo de recarga disminuye con cada subida de nivel.',
    'Grants a bush on you after a duration, gain a bush on elimination at max level.':
      'Te envuelve en un arbusto tras cierto tiempo; al nivel máximo obtienes un arbusto tras cada eliminación.',
    'Grants the ability to hover with the Help of Tails!':
      '¡Otorga la habilidad de planear en el aire con la ayuda de Tails!',
    'Grants random items at each level, only levels up by consuming items.':
      'Otorga objetos aleatorios en cada nivel; solo sube de nivel al consumir objetos del mundo.',
    'Sprint faster with each Level Up!':
      '¡Esprinta más rápido con cada subida de nivel!',
    'Grants the ability to launch in the air and deploy the Bat Cape!':
      '¡Otorga la habilidad de impulsarte por el aire y desplegar la capa de Batman!',
    'Increases in power at each Level Up: 2 Shield -> 3 Shield -> 4 Shield -> 5 Shield -> 6 Shield per tick':
      'Aumenta su poder en cada subida de nivel: 2 de escudo -> 3 -> 4 -> 5 -> 6 de escudo por pulso.',
    'Required damage decreases at each Level Up: 150 Damage -> 125 Damage -> 100 Damage -> 75 Damage -> 50 Damage to trigger':
      'El daño requerido para activarse disminuye por nivel: 150 de daño -> 125 -> 100 -> 75 -> 50 de daño.',
    'Increases in power at each Level Up: 2 Shield -> 3 Shield -> 4 Shield -> 6 Shield -> 8 Shield per tick':
      'Aumenta su poder en cada subida de nivel: 2 de escudo -> 3 -> 4 -> 6 -> 8 de escudo por pulso.',
    'Grants cloak for a duration upon reloading. Increases in duration at each Level Up: 3 Seconds -> 3.5 Seconds -> 4 Seconds -> 4.5 Seconds -> 5 Seconds':
      'Otorga invisibilidad (camuflaje) temporal al recargar. La duración aumenta por nivel: 3s -> 3.5s -> 4s -> 4.5s -> 5s.',
    'Grants a random item at each level, exploding with legendary loot at Max Level.':
      'Otorga un objeto aleatorio en cada nivel, ¡explotando con botín legendario al alcanzar el nivel máximo!',
    'Increases in power at each Level Up: 10 Healing -> 15 Healing -> 20 Healing -> 25 Healing -> 30 Healing per elimination':
      'Aumenta su poder en cada nivel: 10 de curación -> 15 -> 20 -> 25 -> 30 de salud por eliminación.',
    'Increases in damage at each Level Up: 30 -> 40 -> 60 -> 80 -> 120 bonus damage':
      'Aumenta el daño en cada nivel: 30 -> 40 -> 60 -> 80 -> 120 de daño adicional.',
    'Sprinting for a short time makes your slide destructive. Increases in power at each Level Up: 40 dmg / 10% fire rate -> 45 dmg / 20% fire rate -> 50 dmg / 30% fire rate -> 55 dmg / 40% fire rate -> 60 dmg / 50% fire rate':
      'Esprintar brevemente vuelve tu deslizamiento destructivo. Aumenta por nivel: 40 daño / 10% cadencia -> 45/20% -> 50/30% -> 55/40% -> 60 daño / 50% cadencia.',
    'Spawn a Shield Bubble Jr. when you use a healing item on yourself (excluding splashes and grenades). Increases in duration at each Level Up: 6 Seconds -> 7 Seconds -> 8 Seconds -> 9 Seconds -> 10 Seconds':
      'Genera una Burbuja de Escudo Jr. al usar un objeto de curación en ti mismo. La duración aumenta por nivel: 6s -> 7s -> 8s -> 9s -> 10s.',
    'Increases in power at each Level Up: 25% Swim Speed / 10% Movement Speed -> 50% Swim Speed / 20% Movement Speed -> 100% Swim Speed / 30% Movement Speed -> 150% Swim Speed / 40% Movement Speed -> 200% Swim Speed / 50% Movement Speed Bonuses':
      'Aumenta en cada nivel: +25% nado / +10% mov. -> +50%/+20% -> +100%/+30% -> +150%/+40% -> +200% velocidad de nado / +50% velocidad de movimiento.',
    'Required damage decreases at each Level Up: 175 Damage -> 150 Damage -> 125 Damage -> 100 Damage -> 75 Damage to trigger':
      'El daño requerido para activarse disminuye por nivel: 175 de daño -> 150 -> 125 -> 100 -> 75 de daño.',
    'Grants an increase to your max HP and Shield. Increases at each Level Up: 5 HP/Shield -> 10 HP/Shield -> 15 HP/Shield -> 20 HP/Shield -> 25 HP/Shield':
      'Aumenta tu salud máxima y escudo. Aumenta por nivel: +5 salud/escudo -> +10 -> +15 -> +20 -> +25 de salud y escudo máximos.',
    'Increases in duration at each Level Up: 3 Seconds -> 3.5 Seconds -> 4 Seconds -> 4.5 Seconds -> 5 Seconds':
      'La duración aumenta con cada subida de nivel: 3 segundos -> 3.5s -> 4s -> 4.5s -> 5 segundos.',
    'Increases sprinting speed and jump height. Jump height increased with each Level Up!':
      'Aumenta la velocidad de esprint y la altura de salto. ¡La altura de salto aumenta con cada subida de nivel!',
    'Health regenerated to increases at each Level Up: 60 Health -> 70 Health -> 80 Health -> 90 Health -> 100 Health':
      'El límite de salud regenerada aumenta por nivel: 60 de salud -> 70 -> 80 -> 90 -> 100 de salud.'
  },
  perks: {
    'Gain 3x bonus XP from eliminations':
      'Gana el triple (3x) de PE de bonificación por eliminaciones',
    'Button mash! All inputs are correct when entering cheat codes found in the world':
      '¡Aporrea botones! Todas las pulsaciones son válidas al introducir códigos de trucos en la isla',
    'Gain 20% more Sprite Dust upon Extraction':
      'Gana un 20% más de Polvo de Sprite al completar la extracción',
    'Gain 30% more Ammo whenever picked up in the world':
      'Obtén un 30% más de munición al recogerla en la isla',
    'Gain the Overdrive effect when you Mantle, Hurdle, or Wall Scramble.':
      'Obtén el efecto Sobremarcha al trepar, saltar obstáculos o escalar muros',
    'Gain a Shock Rock charge when you deal enough damage to enemies!':
      '¡Obtén una carga de Roca de Choque al infligir suficiente daño a enemigos!'
  },
  locations: {
    'Spotted near high and mountainous areas': 'Avistado cerca de zonas altas y montañosas',
    'Found in the world at nighttime': 'Se encuentra por el mundo durante la noche',
    'Found rarely in Sprite Chests': 'Aparición poco común en Cofres de Sprite',
    'Spotted near rivers and beaches': 'Avistado cerca de ríos y playas',
    'Found wandering around forests and wooded regions': 'Se encuentra merodeando por bosques y zonas arboladas',
    'Located near urban areas': 'Ubicado cerca de zonas urbanas y ciudades',
    'Found in the vault of a certain business mogul': 'Encontrado en la bóveda de cierto magnate de negocios',
    'Sometimes found sleeping in the storage crates': 'A veces se le encuentra durmiendo en cajas de almacenamiento',
    'Found in Relic Chests': 'Se encuentra en Cofres de Reliquia',
    'Claimed from defeating a powerful adversary': 'Se obtiene al derrotar a un adversario poderoso',
    'Distribuido por la isla de Fortnite': 'Distribuido por la isla de Fortnite'
  }
};

const PARENT_TO_FAMILY = {
  water: 'water',
  earth: 'earth',
  spitfire: 'fire',
  duck: 'duck',
  ghost: 'ghost',
  sleepy: 'dream',
  punk: 'punk',
  king: 'king',
  zeropoint: 'zeropoint',
  demon: 'demon',
  burntpeanut: 'theburntpeanut',
  air: 'air',
  boss: 'boss',
  seven: 'seven',
  fishy: 'fishy',
  soccer: 'striker',
  drifter: 'aura',
  grim: 'grim',
  overshield: 'overshield',
  improvedslide: 'megaman',
  winnerb: 'xray',
  winnerc: 'onigiri',
  cosmicthunderdoublejump: 'jackrabbit',
  narrowfleamonkey: 'tails',
  reloadovertime: 'shadow',
  bushranger: 'bush',
  killswitch: 'killswitch',
  dwarf: 'adventure',
  klombo: 'klombo',
  jonesy: 'jonesy',
  narrowflea: 'sonic',
  crown: 'crown',
  '8bitblaster': '8bit',
  eightbitblaster: '8bit',
  stormscout: 'stormscout',
  ghostdamage: 'blinky',
  birthday: 'birthday',
  bodyslam: 'crash',
  fillergrunt: 'pollo',
  batman: 'batman',
  winnera: 'pond',
  companystargazer: 'ironmouse',
  cokeparmesan: 'vini',
  pedicureantacid: 'wick',
  llama: 'llama',
  peely: 'peely',
  increaseheals: 'morgana'
};

const VARIANT_TO_THEME = {
  base: 'Basic',
  basic: 'Basic',
  gold: 'Gold',
  cheatmaster: 'Cheatmaster',
  'cheat master': 'Cheatmaster',
  'loot hacker': 'Loot Hacker',
  loothacker: 'Loot Hacker',
  hacker: 'Loot Hacker',
  'bounty hunter': 'Bounty Hunter',
  bountyhunter: 'Bounty Hunter',
  reaper: 'Bounty Hunter',
  candy: 'Candy',
  gummy: 'Candy',
  galaxy: 'Galaxy',
  cube: 'Cube',
  holofoil: 'Holofoil',
  gem: 'Gem',
  quack: 'Quack'
};

const FAMILY_NAMES_ES = {
  water: 'Agua',
  earth: 'Tierra',
  fire: 'Fuego',
  air: 'Aire',
  duck: 'Pato',
  ghost: 'Fantasma',
  dream: 'Dormilón',
  demon: 'Demonio',
  punk: 'Punk',
  king: 'Monarca',
  zeropoint: 'Punto Cero',
  theburntpeanut: 'Cacahuate',
  fishy: 'Pescado',
  striker: 'Pelotero',
  aura: 'Aura',
  boss: 'Jefe',
  grim: 'Parca',
  seven: 'Siete',
  batman: 'Batman',
  pollo: 'Pollo',
  vini: 'Vini Jr.',
  wick: 'John Wick',
  peely: 'Bananín',
  llama: 'Llama',
  ironmouse: 'La niña',
  klombo: 'Klombo',
  crown: 'Victorioso',
  jackrabbit: 'Jackrabbit',
  sonic: 'Sonic',
  shadow: 'Shadow',
  tails: 'Tails',
  killswitch: 'Killswitch',
  bush: 'Arbustín',
  adventure: 'Aventurero',
  jonesy: 'Jonesy',
  '8bit': '8-Bit',
  stormscout: 'Exploratormentas',
  overshield: 'Protector',
  onigiri: 'Onigiri',
  xray: 'Rayos X',
  megaman: 'Megaman',
  crash: 'Crash Bandicoot',
  morgana: 'Morgana',
  blinky: 'Blinky',
  birthday: 'Pastel de Cumpleaños',
  pond: 'Estanque'
};

const THEME_NAMES_ES = {
  Basic: 'Básico',
  Gold: 'Dorado',
  Cheatmaster: 'Hacker',
  'Loot Hacker': 'Hacker de Botín',
  'Bounty Hunter': 'Cazador de Recompensas',
  Candy: 'Gomita',
  Galaxy: 'Galáctico',
  Holofoil: 'Holográfico',
  Cube: 'Cúbico',
  Gem: 'Gema',
  Quack: 'Patito'
};

const VARIANT_ORDER = [
  'Basic',
  'Gold',
  'Cheatmaster',
  'Loot Hacker',
  'Bounty Hunter',
  'Candy',
  'Galaxy',
  'Cube',
  'Holofoil',
  'Gem',
  'Quack'
];

function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function translateAbility(text) {
  if (!text) return 'Concede bonificaciones pasivas de combate y exploración.';
  return TRANSLATIONS.abilities[text.trim()] || text.trim();
}

export function translatePerk(text) {
  if (!text) return '';
  return TRANSLATIONS.perks[text.trim()] || text.trim();
}

export function translateLocation(text) {
  if (!text) return 'Distribuido por la isla de Fortnite';
  return TRANSLATIONS.locations[text.trim()] || text.trim();
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


async function ensureSpriteImage(page, spriteId, imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  if (!fs.existsSync(PUBLIC_SPRITES_DIR)) {
    fs.mkdirSync(PUBLIC_SPRITES_DIR, { recursive: true });
  }

  const webpPath = path.join(PUBLIC_SPRITES_DIR, `${spriteId}.webp`);
  const pngPath = path.join(PUBLIC_SPRITES_DIR, `${spriteId}.png`);
  if (fs.existsSync(webpPath) || fs.existsSync(pngPath)) {
    return;
  }

  try {
    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

    const dataUrl = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    }, fullUrl);

    if (dataUrl && typeof dataUrl === 'string') {
      const ext = fullUrl.endsWith('.png') ? '.png' : '.webp';
      const destPath = path.join(PUBLIC_SPRITES_DIR, `${spriteId}${ext}`);
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
      console.log(`📥 Imagen descargada para ${spriteId}: ${path.basename(destPath)}`);
    }
  } catch (err) {
    console.warn(`⚠️ Aviso al descargar imagen de ${spriteId}: ${err.message}`);
  }
}

async function syncSprites() {
  console.log('🚀 Iniciando extracción y sincronización automática desde Fortnite.gg...');

  const chromePath = getChromeExecutablePath();
  if (!chromePath) {
    console.error('❌ No se encontró ningún ejecutable de Google Chrome / Chromium en el sistema.');
    process.exit(1);
  }
  console.log(`🌐 Usando binario de Chrome en: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`🌐 Navegando a ${BASE_URL}/sprites...`);
    await page.goto(`${BASE_URL}/sprites`, { waitUntil: 'networkidle2', timeout: 45000 });

    // Esperar a que el DOM o Cloudflare se resuelva
    try {
      await page.waitForSelector('.sprite-card', { timeout: 15000 });
    } catch {
      console.log('⏳ Esperando verificación de Cloudflare / carga de cartas...');
      await page.waitForSelector('.sprite-card', { timeout: 30000 }).catch(() => {});
    }

    // Activar checkbox de no lanzados si existe
    try {
      await page.evaluate(() => {
        const chk = document.querySelector('#sprites-show-unreleased');
        if (chk && !chk.checked) chk.click();
      });
      console.log('👁️ Activado filtro de espíritus no lanzados.');
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.warn('Aviso con filtro de no lanzados:', e.message);
    }

    // Extraer lista inicial de todas las tarjetas
    const cardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.sprite-card'));
      return cards.map((card) => {
        const link = card.querySelector('a.sprite-name, a.sprite-art');
        const img = card.querySelector('img');
        const imgSrc = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
        const pills = Array.from(card.querySelectorAll('.sprite-pill')).map((p) => p.innerText.trim());

        const rawName = card.querySelector('.sprite-name')?.innerText?.trim() || '';
        const parentName = card.getAttribute('data-parent-name') || card.getAttribute('data-parent') || '';
        const variant = card.getAttribute('data-variant') || '';

        return {
          id: card.getAttribute('data-sprite') || '',
          parent: card.getAttribute('data-parent') || '',
          parentName: parentName,
          rarity: card.getAttribute('data-rarity') || '',
          variant: variant,
          season: card.getAttribute('data-season') || '',
          unreleased: card.getAttribute('data-unreleased') === '1',
          name: rawName,
          detailHref: link ? link.getAttribute('href') : '',
          img: imgSrc,
          dropChance: pills[1] || '0%'
        };
      });
    });

    console.log(`📦 Encontradas ${cardsInfo.length} cartas de espíritus en Fortnite.gg.`);
    if (cardsInfo.length === 0) {
      console.warn('⚠️ No se encontraron cartas. Posible bloqueo temporal o cambio de selector.');
      return;
    }

    // Comprobar si la variante Bounty Hunter / Cazador de Recompensas sigue en estado no lanzado en el juego
    const hasUnreleasedBountyHunters = cardsInfo.some(
      (c) => (c.variant === 'reaper' || c.variant.toLowerCase().includes('bounty')) && c.unreleased
    );

    // Cargar catálogos existentes para reutilizar traducciones y evitar requests innecesarios
    const existingCompleteMap = new Map();
    if (fs.existsSync(COMPLETE_SPRITES_PATH)) {
      try {
        const raw = JSON.parse(fs.readFileSync(COMPLETE_SPRITES_PATH, 'utf-8'));
        raw.forEach((item) => {
          if (item.id) existingCompleteMap.set(String(item.id), item);
          const nameNorm = normalizeKey(item.name);
          const variantNorm = normalizeKey(item.variant);
          const parentNorm = normalizeKey(item.parent);
          existingCompleteMap.set(`${nameNorm}_${variantNorm}`, item);
          if (parentNorm) existingCompleteMap.set(`${parentNorm}_${variantNorm}`, item);
        });
      } catch {}
    }

    const forceDetails = process.argv.includes('--force') || process.argv.includes('--all');
    const fullSprites = [];

    for (let i = 0; i < cardsInfo.length; i++) {
      const c = cardsInfo[i];
      const normCardName = normalizeKey(c.name);
      const normCardParent = normalizeKey(c.parent);
      const normCardVariant = normalizeKey(VARIANT_TO_THEME[(c.variant || '').toLowerCase()] || c.variant);

      const existing = existingCompleteMap.get(String(c.id)) ||
        existingCompleteMap.get(`${normCardName}_${normCardVariant}`) ||
        existingCompleteMap.get(`${normCardParent}_${normCardVariant}`);

      let details = {
        ability: existing?.ability || '',
        perk: existing?.specialPerk || '',
        location: existing?.location || '',
        summonCost: existing?.summonCost || '0',
        dropChance: existing?.dropChance || c.dropChance
      };

      const needsDetailFetch = forceDetails || !existing;

      if (needsDetailFetch && c.detailHref) {
        console.log(`[${i + 1}/${cardsInfo.length}] Extrayendo detalles: ${c.name || c.parent} (${c.variant})...`);
        try {
          await page.goto(`${BASE_URL}${c.detailHref}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
          await new Promise((r) => setTimeout(r, 250));

          const pageData = await page.evaluate(() => {
            const rawText = document.body.innerText || '';
            const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

            let perk = '';
            const abilityLines = [];
            let location = '';
            let summonCost = '0';
            let dropChance = '0%';
            let section = '';

            for (let j = 0; j < lines.length; j++) {
              const l = lines[j];
              if (
                l === 'ALL SPRITES' ||
                l.endsWith('SPRITE') ||
                l === 'LEGENDARY' ||
                l === 'SPECIAL' ||
                l === 'EPIC' ||
                l === 'RARE' ||
                l === 'MYTHIC'
              ) {
                continue;
              }

              if (l === 'LOCATION') {
                section = 'location';
                continue;
              }
              if (
                l === 'VARIANT' ||
                l === 'SUMMON COST' ||
                l === 'DROP CHANCES' ||
                l === 'SPRITE CHEST' ||
                l === 'VARIANTS'
              ) {
                section = l.toLowerCase();
                continue;
              }

              if (section === 'location' && !location) {
                location = l;
                continue;
              }
              if (section === 'summon cost') {
                summonCost = l;
                continue;
              }
              if (section === 'sprite chest' || section === 'drop chances') {
                if (l.includes('%') && dropChance === '0%') dropChance = l;
                continue;
              }
              if (section === 'variants') {
                break;
              }

              if (!section) {
                if (l.startsWith('Gain ') || l.startsWith('Button mash') || l.includes('bonus XP')) {
                  perk = l;
                } else if (
                  l.includes('Grants') ||
                  l.includes('Increases') ||
                  l.includes('Decreases') ||
                  l.includes('Allows') ||
                  l.includes('Cooldown') ||
                  l.includes('Deals') ||
                  l.includes('Restores') ||
                  l.includes('Sprint') ||
                  l.includes('Jump') ||
                  l.includes('Speed') ||
                  l.includes('Shield') ||
                  l.includes('Health') ||
                  l.includes('Damage')
                ) {
                  abilityLines.push(l);
                }
              }
            }

            return {
              ability: abilityLines.join(' '),
              perk,
              location,
              summonCost,
              dropChance
            };
          });

          details = {
            ...details,
            ...pageData,
            ability: translateAbility(pageData.ability || details.ability),
            perk: translatePerk(pageData.perk || details.perk),
            location: translateLocation(pageData.location || details.location)
          };
        } catch (e) {
          console.warn(`⚠️ Aviso al obtener detalles de ${c.name || c.parent}: ${e.message}`);
        }
      }

      const rawImg = c.img || existing?.image || '';
      const safeImage = rawImg
        ? (rawImg.startsWith('http') ? rawImg : `${BASE_URL}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
        : '';

      const resolvedTheme = VARIANT_TO_THEME[(c.variant || '').toLowerCase()] || c.variant;
      const isBase = resolvedTheme === 'Basic' || resolvedTheme === 'Base';
      const resolvedName = c.name || (isBase ? (c.parentName || c.parent) : `${resolvedTheme} ${c.parentName || c.parent}`);

      // Mantener condición de no lanzado para Bounty Hunters mientras el paquete no esté lanzado globalmente
      let isUnreleased = c.unreleased;
      if (resolvedTheme === 'Bounty Hunter' && hasUnreleasedBountyHunters) {
        isUnreleased = true;
      }

      fullSprites.push({
        id: c.id,
        name: resolvedName,
        fullName: `${resolvedName} Sprite`,
        parent: c.parent,
        rarity: capitalize(c.rarity),
        variant: capitalize(resolvedTheme),
        season: c.season === '42' ? 'C7 S4' : c.season === '41' ? 'C7 S3' : 'C7 S4',
        unreleased: isUnreleased,
        image: safeImage,
        ability: details.ability || existing?.ability || 'Concede bonificaciones pasivas de combate y exploración.',
        specialPerk: details.perk || existing?.specialPerk || '',
        location: details.location || existing?.location || 'Distribuido por la isla de Fortnite',
        summonCost: details.summonCost && details.summonCost !== '0' && !String(details.summonCost).includes('Polvo')
          ? `${details.summonCost} Polvo Estelar`
          : (details.summonCost || existing?.summonCost || '0'),
        dropChance: details.dropChance || c.dropChance || existing?.dropChance || '0%'
      });
    }

    // 1. Guardar archivo fortnite_gg_sprites_complete.json
    fs.writeFileSync(COMPLETE_SPRITES_PATH, JSON.stringify(fullSprites, null, 2), 'utf-8');
    console.log(`💾 Guardado catálogo completo en: ${COMPLETE_SPRITES_PATH} (${fullSprites.length} espíritus)`);

    // 2. Sincronizar catálogo principal official_sprites.json
    let officialSprites = [];
    if (fs.existsSync(OFFICIAL_SPRITES_PATH)) {
      officialSprites = JSON.parse(fs.readFileSync(OFFICIAL_SPRITES_PATH, 'utf-8'));
    }

    let catalogChanges = 0;
    const today = new Date().toISOString().split('T')[0];

    // Map para búsqueda rápida de official_sprites
    const officialMap = new Map();
    officialSprites.forEach((item, index) => {
      officialMap.set(item.id, { item, index });
    });

    for (const card of cardsInfo) {
      const parentNorm = normalizeKey(card.parent);
      const familyId = PARENT_TO_FAMILY[parentNorm] || parentNorm || normalizeKey(card.name);
      const theme = VARIANT_TO_THEME[(card.variant || '').toLowerCase()] || card.variant || 'Basic';
      const themeKey = normalizeKey(theme);
      const expectedId = `${familyId}_${themeKey}`;

      // Determinar si es no lanzado respetando la regla del paquete de Bounty Hunters
      let isCardUnreleased = card.unreleased;
      if (theme === 'Bounty Hunter' && hasUnreleasedBountyHunters) {
        isCardUnreleased = true;
      }

      // Asegurar descarga de imagen si no existe localmente
      if (card.img) {
        await ensureSpriteImage(page, expectedId, card.img);
      }

      if (officialMap.has(expectedId)) {
        const { item } = officialMap.get(expectedId);

        // Caso: espíritu antes no lanzado que acaba de publicarse oficialmente
        if (item.unreleased === true && isCardUnreleased === false) {
          console.log(`✨ ¡Nuevo lanzamiento detectado!: ${item.id} (${item.name}) ya está disponible en Fortnite.`);
          item.unreleased = false;
          item.isNew = true;
          item.releaseDate = today;
          catalogChanges++;
        }
      } else {
        // Caso: espíritu o variante inédita encontrada en Fortnite.gg
        console.log(`🆕 ¡Nueva variante inédita detectada!: ${expectedId} (${card.name || card.parent} - ${theme})`);

        const spanishFamily = FAMILY_NAMES_ES[familyId] || capitalize(familyId);
        const spanishTheme = THEME_NAMES_ES[theme] || theme;
        const isBase = theme === 'Basic';
        const spanishName = isBase ? spanishFamily : `${spanishFamily} ${spanishTheme}`;
        const isGen1 = GEN_1_FAMILIES.has(familyId);

        const newEntry = {
          id: expectedId,
          name: spanishName,
          theme: theme,
          rarity: isBase ? capitalize(card.rarity || 'Rare') : 'Special',
          unreleased: Boolean(isCardUnreleased),
          isNew: !isCardUnreleased
        };

        if (!isGen1) {
          newEntry.gen = 2;
        }

        if (!isCardUnreleased) {
          newEntry.releaseDate = today;
        }

        // Insertar contiguo a los miembros de su familia respetando VARIANT_ORDER
        const familyIndices = [];
        officialSprites.forEach((s, idx) => {
          const sFamily = s.id.split('_')[0].toLowerCase();
          if (sFamily === familyId) {
            familyIndices.push(idx);
          }
        });

        if (familyIndices.length > 0) {
          const targetOrderIdx = VARIANT_ORDER.indexOf(theme);
          let inserted = false;
          for (const fIdx of familyIndices) {
            const itemTheme = officialSprites[fIdx].theme;
            const itemOrderIdx = VARIANT_ORDER.indexOf(itemTheme);
            if (targetOrderIdx !== -1 && (itemOrderIdx === -1 || targetOrderIdx < itemOrderIdx)) {
              officialSprites.splice(fIdx, 0, newEntry);
              inserted = true;
              break;
            }
          }
          if (!inserted) {
            const lastFIdx = familyIndices[familyIndices.length - 1];
            officialSprites.splice(lastFIdx + 1, 0, newEntry);
          }
        } else {
          // Nueva familia completa
          officialSprites.push(newEntry);
        }

        officialMap.set(expectedId, { item: newEntry, index: officialSprites.length - 1 });
        catalogChanges++;
      }
    }

    // 3. Revisión de vigencia de novedad (1 semana / 7 días)
    const nowMs = Date.now();
    officialSprites.forEach((item) => {
      if (item.isNew && item.releaseDate) {
        const relMs = new Date(item.releaseDate).getTime();
        const days = (nowMs - relMs) / (1000 * 60 * 60 * 24);
        if (days > 7) {
          console.log(`⏰ Expiró período de novedad de 7 días para ${item.id} (${Math.floor(days)} días)`);
          item.isNew = false;
          catalogChanges++;
        }
      }
    });

    // Guardar official_sprites.json si hubo cambios
    if (catalogChanges > 0) {
      fs.writeFileSync(OFFICIAL_SPRITES_PATH, JSON.stringify(officialSprites, null, 2), 'utf-8');
      console.log(`💾 Actualizado catálogo principal en: ${OFFICIAL_SPRITES_PATH} (${catalogChanges} modificaciones)`);
    } else {
      console.log('✅ Catálogo principal sin cambios estructurales requeridos.');
    }

    console.log(`\n🎉 Sincronización finalizada exitosamente. Total espíritus: ${officialSprites.length}`);
  } catch (err) {
    console.error('❌ Error durante la sincronización:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log('🏁 Navegador cerrado.');
  }
}

syncSprites();
