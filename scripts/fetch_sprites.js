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

    // Extract item cards or data objects
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/g) || [];
    console.log('Found image tags:', imgMatches.length);

    // Look for JSON payload in page
    const jsonMatch = html.match(/const\s+items\s*=\s*(\[.*?\]);/s) || html.match(/var\s+sprites\s*=\s*(\[.*?\]);/s);
    if (jsonMatch) {
      console.log('Found JSON data string!');
      fs.writeFileSync(path.join(__dirname, 'sprites_raw.json'), jsonMatch[1]);
    }
  } catch (err) {
    console.error('Error fetching page:', err);
  }
}

main();
