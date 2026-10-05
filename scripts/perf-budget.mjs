#!/usr/bin/env node
// Presupuesto de rendimiento percibido: corre el arnes de medicion con un protocolo FIJO y
// compara las medianas contra perf/budget.json. Sale con codigo distinto de 0 si algun
// presupuesto se pasa (un presupuesto que nunca falla no sirve para nada).
//
// PROTOCOLO FIJO (si cambia, hay que volver a medir y reescribir perf/budget.json):
//   1) arranque: --scenario startup --throttle 4g --runs 3
//      mide LCP, FCP, long tasks > 50 ms, jsCriticalBytes y la primera .sprite-card.
//   2) scroll:   --scenario scroll --scroll-mode continuous --throttle 4g --runs 3
//                --offsets 2400,5400 --log-network
//      mide framesWithBlank (ratio) y msToTarget por offset, collageBytes por paso y los bytes
//      totales de la corrida.
// Los presupuestos viven en perf/budget.json: declaran metrica, escenario, umbral y la medicion
// de origen en el campo note. Este script solo compara; no los recalcula ni los suaviza.
//
// ANTES DE CONFIAR EN UN VEREDICTO (leer entero):
//   - El perfil 4g del arnes es SINTETICO (60 ms RTT, 8/3 Mbps, CPU 4x): no es una red real.
//     Los umbrales estan atados a ESE perfil, a la ventana 1440x900 y a Chrome headless. Medir
//     con otro throttle u otra maquina no es comparable.
//   - El servidor del arnes sirve SIN comprimir y por HTTP/1.1, asi que jsCriticalBytes y los
//     bytes de transferencia son CRUDOS. En Vercel el JS viaja ~3.7x mas chico (gzip/brotli), o
//     sea que un presupuesto de bytes crudos castiga mas fuerte que lo que ve el usuario.
//   - El arnes imita las cabeceras de cache de vercel.json (/assets inmutable, /sprites
//     stale-while-revalidate, HTML sin cache). Si esas cabeceras cambian, la medicion miente.
//   - Medir exige permiso para escuchar en un puerto local (el bind 127.0.0.1 del servidor
//     efimero que sirve dist/). En local una sandbox puede negarlo con EPERM y hay que pedir
//     escalacion; en CI suele estar permitido. Este script NO busca workarounds: si el bind
//     falla, el arnes muere y la corrida falla.
//
// USO:
//   npm run perf                         # construye (npx vite build) y mide
//   npm run perf -- --no-build           # reutiliza dist/ tal cual
//   npm run perf -- --runs 1             # una corrida por escenario (mas rapido, mas ruidoso)
//   npm run perf -- --dir dist           # directorio a medir (por defecto dist)
//   npm run perf -- --json               # salida maquina, sin tabla
//   npm run perf -- --budget otro.json   # otro archivo de presupuestos
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const HARNESS = path.join(SCRIPT_DIR, 'measure-scroll-cards.mjs');
const DEFAULT_BUDGET = path.join(REPO_ROOT, 'perf', 'budget.json');

// Protocolo fijo. Si cambia cualquiera de estos valores hay que volver a medir y reescribir
// perf/budget.json, porque los umbrales estan calibrados contra este regimen.
const PROTOCOL = {
  throttle: '4g',
  runs: 3,
  scrollMode: 'continuous',
  offsets: [2400, 5400]
};

const OPS = {
  '<': (value, threshold) => value < threshold,
  '<=': (value, threshold) => value <= threshold,
  '>': (value, threshold) => value > threshold,
  '>=': (value, threshold) => value >= threshold
};

function parseArgs(argv) {
  const args = {
    runs: PROTOCOL.runs,
    dir: path.join(REPO_ROOT, 'dist'),
    budget: DEFAULT_BUDGET,
    noBuild: false,
    json: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--runs') {
      args.runs = Number(argv[i + 1]);
      i += 1;
    } else if (flag === '--dir') {
      args.dir = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (flag === '--budget') {
      args.budget = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (flag === '--no-build') {
      args.noBuild = true;
    } else if (flag === '--json') {
      args.json = true;
    } else {
      throw new Error('Argumento no reconocido: ' + flag);
    }
  }
  if (!Number.isInteger(args.runs) || args.runs < 1) {
    throw new Error('--runs debe ser un entero >= 1');
  }
  return args;
}

// Construye con el vite local. Se escribe en el MISMO directorio que se va a medir para que no
// haya forma de comparar un dist viejo contra presupuestos nuevos.
function buildFor(dir, quiet) {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const outDirArg = path.relative(REPO_ROOT, dir) || '.';
  const res = spawnSync(npx, ['vite', 'build', '--outDir', outDirArg], {
    cwd: REPO_ROOT,
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  if (res.error) {
    throw new Error('no se pudo ejecutar "npx vite build": ' + res.error.message);
  }
  if (res.status !== 0) {
    if (quiet) {
      if (res.stdout) process.stderr.write(res.stdout);
      if (res.stderr) process.stderr.write(res.stderr);
    }
    throw new Error('"npx vite build" fallo con exit ' + res.status + '; no tiene sentido medir un dist viejo');
  }
}

function runHarness(args, scenario, outPath) {
  const cli = [
    HARNESS,
    '--scenario', scenario,
    '--throttle', PROTOCOL.throttle,
    '--runs', String(args.runs),
    '--dir', args.dir,
    '--out', outPath
  ];
  if (scenario === 'scroll') {
    cli.push('--scroll-mode', PROTOCOL.scrollMode, '--offsets', PROTOCOL.offsets.join(','), '--log-network');
  }
  const res = spawnSync(process.execPath, cli, {
    cwd: REPO_ROOT,
    stdio: args.json ? 'pipe' : 'inherit',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  if (res.error) {
    throw new Error('no se pudo ejecutar el arnes (' + HARNESS + '): ' + res.error.message);
  }
  if (res.status !== 0) {
    if (args.json) {
      if (res.stdout) process.stderr.write(res.stdout);
      if (res.stderr) process.stderr.write(res.stderr);
    }
    throw new Error('el arnes fallo en --scenario ' + scenario + ' (exit ' + res.status + ')');
  }
  return JSON.parse(fs.readFileSync(outPath, 'utf8')).summary;
}

function loadBudget(budgetPath) {
  const raw = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
  if (!Array.isArray(raw.budgets) || raw.budgets.length === 0) {
    throw new Error(budgetPath + ': "budgets" debe ser un arreglo con al menos un presupuesto');
  }
  if (raw.protocol && raw.protocol.throttle && raw.protocol.throttle !== PROTOCOL.throttle) {
    throw new Error(
      budgetPath + ': el protocolo declarado usa --throttle ' + raw.protocol.throttle +
      ' pero este script corre --throttle ' + PROTOCOL.throttle +
      '. Los umbrales no son comparables entre perfiles.'
    );
  }
  for (const entry of raw.budgets) {
    if (entry.source !== 'startup' && entry.source !== 'scroll') {
      throw new Error(budgetPath + ': ' + entry.id + ' tiene source invalido (usa "startup" o "scroll")');
    }
    if (!OPS[entry.op]) {
      throw new Error(budgetPath + ': ' + entry.id + ' tiene op invalido (usa <, <=, > o >=)');
    }
    if (typeof entry.path !== 'string' || entry.path.length === 0) {
      throw new Error(budgetPath + ': ' + entry.id + ' necesita un path tipo "startup.lcpMs"');
    }
    if (typeof entry.threshold !== 'number' || !Number.isFinite(entry.threshold)) {
      throw new Error(budgetPath + ': ' + entry.id + ' necesita un threshold numerico');
    }
  }
  return raw;
}

function resolvePath(root, dotted) {
  let current = root;
  for (const key of dotted.split('.')) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

function formatNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10000) / 10000);
}

function formatMeasured(value, unit) {
  if (value === null || value === undefined) return 'SIN DATO';
  return unit ? formatNumber(value) + ' ' + unit : formatNumber(value);
}

function formatThreshold(op, threshold, unit) {
  return op + ' ' + (unit ? formatNumber(threshold) + ' ' + unit : formatNumber(threshold));
}

function evaluate(budgets, summaries) {
  return budgets.map((entry) => {
    const measured = resolvePath(summaries[entry.source], entry.path);
    const hasValue = typeof measured === 'number' && Number.isFinite(measured);
    const pass = hasValue && OPS[entry.op](measured, entry.threshold);
    return {
      id: entry.id,
      metric: entry.metric,
      scenario: entry.scenario,
      source: entry.source,
      path: entry.path,
      op: entry.op,
      threshold: entry.threshold,
      unit: entry.unit || '',
      baseline: entry.baseline,
      note: entry.note,
      measured: hasValue ? measured : null,
      verdict: pass ? 'PASS' : 'FAIL',
      reason: hasValue ? null : 'el arnes no reporto la metrica ' + entry.path
    };
  });
}

function printTable(rows) {
  const header = ['metrica', 'medido', 'presupuesto', 'veredicto'];
  const table = rows.map((row) => [
    row.metric,
    formatMeasured(row.measured, row.unit),
    formatThreshold(row.op, row.threshold, row.unit),
    row.verdict
  ]);
  const widths = header.map((title, column) => Math.max(
    title.length,
    ...table.map((cells) => cells[column].length)
  ));
  const line = (cells) => cells.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd();
  console.log(line(header));
  console.log(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const cells of table) console.log(line(cells));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const budget = loadBudget(args.budget);
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'perf-budget-'));
  const startupJson = path.join(tmpDir, 'startup.json');
  const scrollJson = path.join(tmpDir, 'scroll.json');

  if (!args.json) {
    console.log(
      '[perf] protocolo: throttle=' + PROTOCOL.throttle + ' runs=' + args.runs +
      ' scroll=' + PROTOCOL.scrollMode + ' offsets=' + PROTOCOL.offsets.join(',') +
      ' dir=' + args.dir
    );
    console.log('[perf] presupuestos: ' + args.budget + ' (' + budget.budgets.length + ')');
  }
  if (!args.noBuild) {
    if (!args.json) console.log('[perf] construyendo con "npx vite build" ...');
    buildFor(args.dir, args.json);
  } else if (!args.json) {
    console.log('[perf] --no-build: se mide ' + args.dir + ' tal cual');
  }

  const summaries = {
    startup: runHarness(args, 'startup', startupJson),
    scroll: runHarness(args, 'scroll', scrollJson)
  };
  const rows = evaluate(budget.budgets, summaries);
  const failures = rows.filter((row) => row.verdict !== 'PASS');

  if (args.json) {
    console.log(JSON.stringify({
      ok: failures.length === 0,
      measuredAt: new Date().toISOString(),
      throttle: PROTOCOL.throttle,
      runs: args.runs,
      dir: args.dir,
      budgetFile: args.budget,
      rawJson: { startup: startupJson, scroll: scrollJson },
      results: rows
    }, null, 2));
  } else {
    printTable(rows);
    console.log('');
    console.log('[perf] ' + rows.length + ' presupuestos: ' + (rows.length - failures.length) + ' pass, ' + failures.length + ' fail');
    for (const row of failures) {
      console.log('[perf]   FAIL ' + row.metric + ': medido ' + formatMeasured(row.measured, row.unit) +
        ', presupuesto ' + formatThreshold(row.op, row.threshold, row.unit) +
        (row.reason ? ' (' + row.reason + ')' : ''));
    }
    console.log('[perf] JSON crudo en ' + tmpDir);
    console.log(failures.length === 0
      ? '[perf] OK: ningun presupuesto se paso.'
      : '[perf] FALLO: ' + failures.length + ' presupuesto(s) fuera de umbral.');
  }
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[perf] ERROR: ' + ((err && err.stack) || err));
  process.exitCode = 1;
});
