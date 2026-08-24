import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://fortnite.gg';

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

export function translateAbility(text) {
  if (!text) return 'Concede bonificaciones pasivas de combate y exploración.';
  return TRANSLATIONS.abilities[text.trim()] || text;
}

export function translatePerk(text) {
  if (!text) return '';
  return TRANSLATIONS.perks[text.trim()] || text;
}

export function translateLocation(text) {
  if (!text) return 'Distribuido por la isla de Fortnite';
  return TRANSLATIONS.locations[text.trim()] || text;
}

async function syncSprites() {
  console.log('🚀 Iniciando extracción y traducción automática a español desde Fortnite.gg...');

  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`❌ No se encontró Google Chrome en "${CHROME_PATH}"`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`🌐 Navegando a ${BASE_URL}/sprites...`);
    await page.goto(`${BASE_URL}/sprites`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Activar no lanzados
    try {
      await page.evaluate(() => {
        const chk = document.querySelector('#sprites-show-unreleased');
        if (chk && !chk.checked) chk.click();
      });
      console.log('👁️ Activado filtro de espíritus no lanzados.');
    } catch (e) {}

    // Extraer lista inicial de todas las tarjetas
    const cardsInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.sprite-card'));
      return cards.map((card) => {
        const link = card.querySelector('a.sprite-name, a.sprite-art');
        const img = card.querySelector('img');
        const pills = Array.from(card.querySelectorAll('.sprite-pill')).map(p => p.innerText.trim());

        return {
          id: card.getAttribute('data-sprite') || '',
          parent: card.getAttribute('data-parent') || '',
          rarity: card.getAttribute('data-rarity') || '',
          variant: card.getAttribute('data-variant') || '',
          season: card.getAttribute('data-season') || '',
          unreleased: card.getAttribute('data-unreleased') === '1',
          name: card.querySelector('.sprite-name')?.innerText?.trim() || '',
          detailHref: link ? link.getAttribute('href') : '',
          img: img ? img.getAttribute('src') : '',
          dropChance: pills[1] || '0%'
        };
      });
    });

    console.log(`📦 Encontradas ${cardsInfo.length} cartas de espíritus para procesar.`);

    const fullSprites = [];

    for (let i = 0; i < cardsInfo.length; i++) {
      const c = cardsInfo[i];
      console.log(`[${i + 1}/${cardsInfo.length}] Extrayendo y traduciendo: ${c.name} (${c.variant})...`);

      let details = {
        ability: '',
        perk: '',
        location: '',
        summonCost: '0',
        dropChance: c.dropChance
      };

      if (c.detailHref) {
        try {
          await page.goto(`${BASE_URL}${c.detailHref}`, { waitUntil: 'domcontentloaded', timeout: 12000 });
          await new Promise(r => setTimeout(r, 200));

          const pageData = await page.evaluate(() => {
            const rawText = document.body.innerText || '';
            const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

            let perk = '';
            let abilityLines = [];
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

              if (l === 'LOCATION') { section = 'location'; continue; }
              if (l === 'VARIANT' || l === 'SUMMON COST' || l === 'DROP CHANCES' || l === 'SPRITE CHEST' || l === 'VARIANTS') {
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

          details = { ...details, ...pageData };
        } catch (e) {
          console.warn(`⚠️ Aviso al obtener ${c.name}: ${e.message}`);
        }
      }

      fullSprites.push({
        id: c.id,
        name: c.name,
        fullName: `${c.name} Sprite`,
        parent: c.parent,
        rarity: capitalize(c.rarity),
        variant: capitalize(c.variant),
        season: c.season === '42' ? 'C7 S4' : c.season === '41' ? 'C7 S3' : 'C7 S4',
        unreleased: c.unreleased,
        image: c.img.startsWith('http') ? c.img : `${BASE_URL}${c.img}`,
        ability: translateAbility(details.ability),
        specialPerk: translatePerk(details.perk),
        location: translateLocation(details.location),
        summonCost: details.summonCost && details.summonCost !== '0' ? `${details.summonCost} Polvo Estelar` : '0',
        dropChance: details.dropChance || c.dropChance || '0%'
      });
    }

    const outputPath = path.resolve(__dirname, '../src/data/fortnite_gg_sprites_complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(fullSprites, null, 2), 'utf-8');

    console.log(`\n🎉 ¡Extracción y traducción a español completadas con éxito!`);
    console.log(`💾 Archivo guardado en: ${outputPath} (${fullSprites.length} espíritus procesados en español)`);

  } catch (err) {
    console.error('❌ Error durante la sincronización:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Sincronizador finalizado.');
  }
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

syncSprites();
