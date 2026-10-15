/**
 * Regenera los derivados rasterizados del icono de marca.
 *
 * ESTE SCRIPT ESTA PARKED: solo se usa cuando la marca del fantasma se aplique de
 * verdad. Lee el icono fuente de este mismo directorio y escribe los PNG donde la
 * app los necesita. Si se ejecuta hoy, sobrescribe los iconos del monograma F.
 *
 * Uso: node assets-src/marca/marca-iconos.mjs
 */
import puppeteer from 'puppeteer-core';
import { readFileSync, existsSync } from 'node:fs';

const CANDIDATOS_CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CANDIDATOS_CHROME.find((ruta) => existsSync(ruta));
if (!chrome) {
  console.error('No encuentro Chrome. Define CHROME_PATH.');
  process.exit(1);
}

const ICONOS = [
  ['public/favicon.png', 64],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/apple-touch-icon.png', 180],
  ['public/apple-touch-icon-precomposed.png', 180],
];

const svg = readFileSync('assets-src/marca/favicon-icono.svg', 'utf8');
const fuente = 'data:image/svg+xml,' + encodeURIComponent(svg);

const navegador = await puppeteer.launch({ executablePath: chrome, headless: true, pipe: true });

for (const [ruta, px] of ICONOS) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: px, height: px, deviceScaleFactor: 1 });
  await pagina.setContent(
    '<html><body style="margin:0"><img src="' + fuente + '" width="' + px + '" height="' + px + '" style="display:block"></body></html>',
    { waitUntil: 'load' }
  );
  await pagina.screenshot({ path: ruta, clip: { x: 0, y: 0, width: px, height: px } });
  await pagina.close();
  console.log(ruta + ' (' + px + 'px)');
}

await navegador.close();
console.log('Listo: ' + ICONOS.length + ' iconos regenerados desde public/favicon.svg');
