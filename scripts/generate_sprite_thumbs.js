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
// El segundo origen es material de trabajo (volcado en crudo de otra fuente), no un asset de
// la app: vive fuera de public/ a proposito. Dentro de public/ se copiaba a dist/ en cada
// deploy (1,7 MB) sin que nada lo pidiera nunca.
const SOURCE_DIRS = [path.join(PUBLIC_DIR, 'sprites'), path.join(ROOT, 'assets-src', 'sprites-2gen')];
const CATALOG_PATH = path.join(ROOT, 'src', 'data', 'official_sprites.json');
const THUMB_DIR = path.join(PUBLIC_DIR, 'sprites', 'thumbs');
// Derivada que usa la captura de compartir: el collage dibuja cada espiritu a ~90-110 px,
// asi que 448 px sobraba y multiplicaba por cuatro los datos que la app baja al entrar.
// Misma ruta que la miniatura, cambiando 'thumbs' por 'collage'.
const COLLAGE_DIR = path.join(PUBLIC_DIR, 'sprites', 'collage');
const MANIFEST_PATH = path.join(ROOT, 'src', 'data', 'sprite_thumbs.json');

const MIN_SOURCE_BYTES = 24 * 1024;
const WEBP_QUALITY = '80';
// Lado mayor de la miniatura. La tarjeta mide 205x284 CSS px, asi que 448 cubre
// pantallas retina 2x sin acercarse al peso del origen de 512.
const MAX_SIZE = 448;
const COLLAGE_SIZE = 256;
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
  fs.mkdirSync(COLLAGE_DIR, { recursive: true });

  // Solo los ids del catalogo los puede pedir la app. Un origen fuera del catalogo generaba
  // miniaturas y collages que nadie pedia (57 + 57 la ultima vez), asi que ahora se avisa y
  // se omite: si el espiritu se da de alta en el catalogo, al volver a correr se genera.
  const catalogo = new Set(JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')).map((s) => s.id));
  const fueraDelCatalogo = [];

  const stats = {
    created: 0, current: 0, small: 0, failed: 0, sourceBytes: 0, thumbBytes: 0,
    collageCreated: 0, collageCurrent: 0, collageBytes: 0
  };

  for (const source of listSources()) {
    const id = path.basename(source).replace(/\.(png|webp)$/i, '');
    if (!catalogo.has(id)) {
      fueraDelCatalogo.push(id);
      continue;
    }
    const sourceStat = fs.statSync(source);
    const target = path.join(THUMB_DIR, id + '.webp');
    const collage = path.join(COLLAGE_DIR, id + '.webp');

    if (!includeAll && sourceStat.size <= MIN_SOURCE_BYTES) {
      stats.small += 1;
      continue;
    }
    try {
      if (force || !fs.existsSync(target) || fs.statSync(target).mtimeMs < sourceStat.mtimeMs) {
        execFileSync('cwebp', ['-quiet', '-q', WEBP_QUALITY, '-resize', String(MAX_SIZE), '0', '-alpha_q', '100', source, '-o', target], { stdio: 'ignore' });
        stats.created += 1;
      } else {
        stats.current += 1;
      }

      if (force || !fs.existsSync(collage) || fs.statSync(collage).mtimeMs < sourceStat.mtimeMs) {
        execFileSync('cwebp', ['-quiet', '-q', WEBP_QUALITY, '-resize', String(COLLAGE_SIZE), '0', '-alpha_q', '100', source, '-o', collage], { stdio: 'ignore' });
        stats.collageCreated += 1;
      } else {
        stats.collageCurrent += 1;
      }

      stats.sourceBytes += sourceStat.size;
      stats.thumbBytes += fs.statSync(target).size;
      stats.collageBytes += fs.statSync(collage).size;
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
  console.log('Collage 256px creados: ' + stats.collageCreated + ' (al dia: ' + stats.collageCurrent + ') -> ' + mb(stats.collageBytes));
  console.log('Manifiesto: ' + path.relative(ROOT, MANIFEST_PATH) + ' (' + Object.keys(manifest).length + ' entradas)');
  console.log('Fuera del catalogo (no se generan): ' + fueraDelCatalogo.length
    + (fueraDelCatalogo.length ? ' -> ' + fueraDelCatalogo.slice(0, 3).join(', ') + '...' : ''));
}

main();
