const fs = require('fs');
const path = require('path');
const https = require('https');

// Load baseSprites array from fnsprites_data.js
const dataContent = fs.readFileSync(path.join(__dirname, 'fnsprites_data.js'), 'utf8');
const jsonMatch = dataContent.match(/const\s+baseSprites\s*=\s*(\[[\s\S]*?\]);/);

if (!jsonMatch) {
  console.error('Could not find baseSprites array!');
  process.exit(1);
}

// Evaluate baseSprites safely
const baseSprites = eval(jsonMatch[1]);
console.log(`Found ${baseSprites.length} sprites in data sheet.`);

const publicSpritesDir = path.join(__dirname, '../public/sprites');
if (!fs.existsSync(publicSpritesDir)) {
  fs.mkdirSync(publicSpritesDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded: ${path.basename(dest)}`);
          resolve(true);
        });
      } else {
        console.log(`Failed HTTP ${res.statusCode}: ${url}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`Error downloading ${url}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Downloading official sprite PNG assets from staticvacant.github.io/fnsprites/sprites/...');
  let successCount = 0;

  for (const sprite of baseSprites) {
    const extList = ['.png', '.webp', '.jpg'];
    let downloaded = false;

    for (const ext of extList) {
      const url = `https://staticvacant.github.io/fnsprites/sprites/${sprite.id}${ext}`;
      const dest = path.join(publicSpritesDir, `${sprite.id}.png`);
      const ok = await downloadImage(url, dest);
      if (ok) {
        downloaded = true;
        successCount++;
        break;
      }
    }

    if (!downloaded) {
      // Try siteimages/
      const url = `https://staticvacant.github.io/fnsprites/siteimages/${sprite.id}.png`;
      const dest = path.join(publicSpritesDir, `${sprite.id}.png`);
      const ok = await downloadImage(url, dest);
      if (ok) successCount++;
    }
  }

  console.log(`Finished downloading ${successCount} / ${baseSprites.length} sprite PNG image assets!`);

  // Save the full structured sprites json for the project
  fs.writeFileSync(
    path.join(__dirname, '../src/data/official_sprites.json'),
    JSON.stringify(baseSprites, null, 2)
  );
}

main();
