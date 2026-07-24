const fs = require('fs');
const path = require('path');
const https = require('https');

const SPRITES_URL = 'https://fortnite.gg/sprites';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function main() {
  try {
    console.log('Fetching fortnite.gg/sprites...');
    const html = await fetchPage(SPRITES_URL);
    console.log('Page fetched, length:', html.length);
    fs.writeFileSync(path.join(__dirname, 'page.html'), html);

    // Regex to match items on fortnite.gg
    // Look for <a href="/item?id=..." class="fn-item..."><img src="..." alt="...">...</a>
    const itemRegex = /<a\s+href="\/item\?id=([^"]+)"[^>]*class="[^"]*fn-item[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    const items = [];

    while ((match = itemRegex.exec(html)) !== null) {
      const itemId = match[1];
      const content = match[2];
      
      const imgMatch = content.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/);
      const nameMatch = content.match(/<div class="fn-item-name">([^<]+)<\/div>/) || content.match(/<span[^>]*>([^<]+)<\/span>/);
      const rarityMatch = content.match(/class="fn-item-rarity ([^"]+)"/) || content.match(/rarity-([a-zA-Z0-9]+)/);
      const chanceMatch = content.match(/<div class="fn-item-chance">([^<]+)<\/div>/) || content.match(/([\d\.]+%)/);

      if (imgMatch) {
        items.push({
          id: itemId,
          name: nameMatch ? nameMatch[1].trim() : (imgMatch[2] ? imgMatch[2].trim() : itemId),
          img: imgMatch[1],
          rarity: rarityMatch ? rarityMatch[1] : 'rare',
          chance: chanceMatch ? chanceMatch[1].trim() : ''
        });
      }
    }

    console.log(`Extracted ${items.length} items from HTML.`);
    
    // Also search for script tags containing JSON data or items list
    const scriptMatches = html.match(/<script[\s\S]*?<\/script>/g) || [];
    for (let i = 0; i < scriptMatches.length; i++) {
      if (scriptMatches[i].includes('sprites') || scriptMatches[i].includes('Batman')) {
        console.log(`Script ${i} mentions sprites/Batman. Length:`, scriptMatches[i].length);
      }
    }

  } catch (err) {
    console.error('Error fetching page:', err);
  }
}

main();
