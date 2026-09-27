// Genera miniaturas WebP de los sprites para las tarjetas (grid y swiper movil).
// Uso: node scripts/generate_sprite_thumbs.js [--force] [--all]
//   --force  regenera aunque la miniatura exista
//   --all    incluye tambien los origenes pequenos (<= 24 KB)
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SOURCE_DIRS = [path.join(PUBLIC_DIR, 'sprites'), path.join(PUBLIC_DIR, 'sprites 2gen')];
const THUMB_DIR = path.join(PUBLIC_DIR, 'sprites', 'thumbs');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'sprite_thumbs.json');

const MIN_SOURCE_BYTES = 24 * 1024;
const WEBP_QUALITY = '80';
// Lado mayor de la miniatura. La tarjeta mide 205x284 CSS px, asi que 448 cubre
// pantallas retina 2x sin acercarse al peso del origen de 512.
const MAX_SIZE = 448;
const force = process.argv.includes('--force');
const includeAll = process.argv.includes('--all');

function ensureCwebp() {
  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('Falta cwebp. Instalalo con: brew install webp');
    process.exit(1);
  }
}

function listSources() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!/\.(png|webp)$/i.test(name)) continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isFile()) files.push(full);
    }
  }
  return files.sort();
}

function main() {
  ensureCwebp();
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  const stats = { created: 0, current: 0, small: 0, failed: 0, sourceBytes: 0, thumbBytes: 0 };

  for (const source of listSources()) {
    const id = path.basename(source).replace(/\.(png|webp)$/i, '');
    const sourceStat = fs.statSync(source);
    const target = path.join(THUMB_DIR, id + '.webp');

    if (!includeAll && sourceStat.size <= MIN_SOURCE_BYTES) {
      stats.small += 1;
      continue;
    }
    if (!force && fs.existsSync(target) && fs.statSync(target).mtimeMs >= sourceStat.mtimeMs) {
      stats.current += 1;
      stats.sourceBytes += sourceStat.size;
      stats.thumbBytes += fs.statSync(target).size;
      continue;
    }
    try {
      execFileSync('cwebp', ['-quiet', '-q', WEBP_QUALITY, '-resize', String(MAX_SIZE), '0', '-alpha_q', '100', source, '-o', target], { stdio: 'ignore' });
      stats.created += 1;
      stats.sourceBytes += sourceStat.size;
      stats.thumbBytes += fs.statSync(target).size;
    } catch (error) {
      stats.failed += 1;
      console.warn('No se pudo convertir ' + path.basename(source) + ': ' + error.message);
    }
  }

  // Manifiesto: solo las miniaturas que existen en disco.
  const manifest = {};
  for (const name of fs.readdirSync(THUMB_DIR).sort()) {
    if (!/\.webp$/i.test(name)) continue;
    manifest[name.replace(/\.webp$/i, '')] = '/sprites/thumbs/' + name;
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  const mb = (bytes) => (bytes / 1048576).toFixed(2) + ' MB';
  console.log('Miniaturas creadas: ' + stats.created);
  console.log('Ya al dia: ' + stats.current);
  console.log('Omitidas por pequenas: ' + stats.small);
  console.log('Errores: ' + stats.failed);
  console.log('Origen: ' + mb(stats.sourceBytes) + ' -> Miniaturas: ' + mb(stats.thumbBytes));
  console.log('Manifiesto: ' + path.relative(ROOT, MANIFEST_PATH) + ' (' + Object.keys(manifest).length + ' entradas)');
}

main();
