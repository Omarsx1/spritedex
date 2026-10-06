// Prueba de humo de la app construida: monta el sitio, abre la modal de compartir y
// comprueba que la captura aparece y que no hay errores de pagina.
//
// Es la red que caza lo que el linter no ve: usar una constante antes de declararla
// (TDZ) tumbo la app entera y ni oxlint ni el build lo detectaron; esto lo detecta.
//
// Uso: pnpm build && pnpm smoke
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.txt': 'text/plain', '.mov': 'video/quicktime', '.webm': 'video/webm'
};

function encontrarChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidatos = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ];
  return candidatos.find((c) => fs.existsSync(c)) || null;
}

function servir() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(DIST, url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (path.extname(url)) { res.writeHead(404); res.end('no esta'); return; }
      file = path.join(DIST, 'index.html');
    }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'public, max-age=86400'
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('Falta dist/. Corre el build antes: pnpm build');
    process.exit(1);
  }
  const chrome = encontrarChrome();
  if (!chrome) {
    console.error('No encuentro Chrome. Define PUPPETEER_EXECUTABLE_PATH.');
    process.exit(1);
  }

  const server = await servir();
  const base = 'http://127.0.0.1:' + server.address().port;
  const errores = [];
  const fallosRed = [];
  let navegador;
  try {
    navegador = await puppeteer.launch({
      executablePath: chrome, headless: true, pipe: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });
    const page = await navegador.newPage();
    page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
    // Peticiones que no llegan: sin esto, una app que no monta por un recurso caido se
    // reporta como 'no encontre el boton', que suena a fallo de interfaz y no lo es.
    page.on('requestfailed', (req) => {
      if (!req.url().includes('supabase')) fallosRed.push(req.url() + ' :: ' + (req.failure() ? req.failure().errorText : '?'));
    });
    await page.setViewport({ width: 390, height: 700, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // El runner de GitHub arranca con navigator.languages = ['en-US', ...] y la app elige
    // idioma con esa etiqueta (idiomaDelNavegador): en CI la interfaz salia en INGLES, el
    // boton decia 'Share' y la prueba buscaba 'Compartir'. Fallaba siempre, desde el dia que
    // se anadio al workflow, con un mensaje que parecia un fallo de la app. La prueba fija el
    // idioma para medir lo que le importa (que la app monte y la modal abra), no el idioma
    // del runner.
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('spritedex_lang', 'es'); } catch {} });

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    // Nunca se toca la base real desde una prueba.
    await client.send('Network.setBlockedURLs', { urls: ['*supabase.co*'] });

    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    // Plazo activo en lugar de 9 s fijos: en el runner la app puede tardar mas, y un margen
    // fijo convierte cualquier arranque lento en un 'no encontre el boton' indistinguible de
    // una app rota.
    const appMontada = await page.waitForFunction(
      () => { const raiz = document.getElementById('root'); return !!raiz && raiz.children.length > 0; },
      { timeout: 45000, polling: 500 }
    ).then(() => true).catch(() => false);
    await esperar(1200);

    const viva = await page.evaluate(() => !document.body.innerText.includes('Reanudando Spritedex'));
    const abierto = await page.evaluate(async () => {
      // Si estamos en movil con dock flotante, abrir el dock primero para desplegar las opciones
      const trigger = document.querySelector('.fnm-pumpkin-btn, .pm-trigger');
      if (trigger) {
        trigger.click();
        await new Promise((r) => setTimeout(r, 400));
      }

      const todo = [...document.querySelectorAll('button,a')].filter((b) => !b.closest('.sdm-share-pro'));
      const visible = (b) => {
        const r = b.getBoundingClientRect();
        const style = window.getComputedStyle(b);
        return r.width > 0 && r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      };
      const cand = todo.filter((b) => /compartir/i.test((b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '')) && visible(b));
      if (!cand.length) {
        const fallback = todo.filter((b) => /compartir/i.test((b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '')));
        if (fallback.length) {
          fallback[0].click();
          return true;
        }
        return false;
      }
      cand[0].click();
      return true;
    });
    let captura = false;
    if (abierto) {
      try {
        await page.waitForSelector('.sdm-share-pro__preview-wrap canvas, .sdm-share-pro__preview-wrap img', { timeout: 60000 });
        captura = true;
      } catch { captura = false; }
    }
    const medidor = await page.evaluate(() => !!document.querySelector('.sdm-share-perf'));

    const fallos = [];
    if (!viva) fallos.push('la app no monto (cayo en el ErrorBoundary)');
    if (!appMontada) fallos.push('la app no monto: #root sigue vacio despues de 45 s');
    if (!abierto) {
      const pistas = await page.evaluate(() => [...document.querySelectorAll('button,a')]
        .map((b) => (b.textContent || '').trim().slice(0, 20))
        .filter(Boolean)
        .slice(0, 12));
      fallos.push('no encontre el boton de compartir. Botones en pantalla: ' + JSON.stringify(pistas));
    }
    if (abierto && !captura) fallos.push('la modal no mostro la captura');
    if (medidor) fallos.push('el medidor de rendimiento esta visible para los usuarios');
    if (errores.length) fallos.push('errores en la pagina: ' + errores.slice(0, 3).join(' | '));
    if (fallosRed.length) fallos.push('peticiones que no llegaron: ' + fallosRed.slice(0, 3).join(' | '));

    if (fallos.length) {
      console.error('SMOKE FALLO');
      fallos.forEach((f) => console.error(' - ' + f));
      process.exitCode = 1;
    } else {
      console.log('SMOKE OK: la app monta, la modal abre y muestra la captura, sin errores.');
    }
  } finally {
    if (navegador) await navegador.close();
    server.close();
  }
}

main().catch((e) => { console.error('SMOKE FALLO: ' + (e && e.message)); process.exit(1); });
