import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'https://fortnite.gg';

async function syncSprites() {
  console.log('🚀 Iniciando extracción automática completa desde Fortnite.gg...');

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
      console.log(`[${i + 1}/${cardsInfo.length}] Extrayendo: ${c.name} (${c.variant})...`);

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
        ability: details.ability || 'Habilidad especial de combate y exploración en la isla de Fortnite.',
        specialPerk: details.perk || '',
        location: details.location || 'Distribuido por la isla de Fortnite',
        summonCost: details.summonCost || '0',
        dropChance: details.dropChance || c.dropChance || '0%'
      });
    }

    const outputPath = path.resolve(__dirname, '../src/data/fortnite_gg_sprites_complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(fullSprites, null, 2), 'utf-8');

    console.log(`\n🎉 ¡Extracción completada con éxito!`);
    console.log(`💾 Archivo guardado en: ${outputPath} (${fullSprites.length} espíritus procesados)`);

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
