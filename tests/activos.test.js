// Un activo que el codigo pide y el repo no lleva no da error visible: en produccion el
// rewrite del SPA (vercel.json manda todo a index.html) responde 200 con HTML, la imagen
// no carga y el codigo se queda en su respaldo sin que nadie se entere. Paso justo con el
// SVG del murcielago: se veia el murcielago viejo y parecia un problema de cache.
// Esta prueba exige que cada activo citado en el codigo exista Y este versionado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fuentes = ['src/utils/batSwarm.js', 'src/utils/canvasExporter.js', 'src/styles/index.css'];

const activos = new Set();
for (const fuente of fuentes) {
  const texto = readFileSync(path.join(raiz, fuente), 'utf8');
  // Solo rutas literales: las plantillas con ${} son dinamicas y no se pueden comprobar.
  for (const m of texto.matchAll(/['"](\/[-a-zA-Z0-9_]+\.[a-z0-9]{2,5})['"]/g)) activos.add(m[1]);
}

test('cada activo citado en el codigo existe y esta versionado', () => {
  assert.ok(activos.size >= 3, 'esperaba encontrar los activos citados en el codigo');
  for (const activo of activos) {
    const relativo = 'public' + activo;
    assert.ok(existsSync(path.join(raiz, relativo)), `falta ${relativo} en el repo`);
    assert.doesNotThrow(
      () => execFileSync('git', ['ls-files', '--error-unmatch', relativo], { cwd: raiz, stdio: 'pipe' }),
      `${relativo} existe pero NO esta versionado: en produccion el rewrite devuelve el index.html y no carga`
    );
  }
});
