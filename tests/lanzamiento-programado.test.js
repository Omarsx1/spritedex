// Programación de lanzamientos: un espiritu con release_date futura esta PROGRAMADO (no se
// ve), y el dia que llega su fecha sale solo y es nuevo durante 7 dias COMPLETOS.
//
// Lo que fija esta prueba es el calendario real del 8 de octubre:
//  - el lote de Dulce o Truco (23 fichas) esta programado para el 8 -> hasta el 7 no se ve;
//  - el 8 sale y pasa a ser el unico nuevo;
//  - el lote del 1 de octubre (21 fichas) deja de ser nuevo justo ese dia.
//
// La ventana es de 7 dias completos (0..6): con "<= 7" el lote del 1 seguia siendo nuevo el
// 8, que es justo cuando entraba el siguiente, y el banner mostraba las dos tandas a la vez.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoLanzamiento, esNovedad, DIAS_NOVEDAD } from '../src/utils/lanzamiento.js';

const DIA = 24 * 60 * 60 * 1000;
const el = (iso, hora = 12) => new Date(iso + 'T' + String(hora).padStart(2, '0') + ':00:00Z').getTime();

const programado = (fecha) => ({ id: 'vampire_tricktreat', unreleased: false, releaseDate: fecha });
const delLoteViejo = (fecha) => ({ id: 'dumpsterdive_basic', unreleased: false, releaseDate: fecha });

test('un espiritu con fecha futura esta programado y no se ve', () => {
  const estado = estadoLanzamiento(programado('2026-10-08T00:00:00Z'), el('2026-10-07'));
  assert.equal(estado.programado, true);
  assert.equal(estado.unreleased, true);
  assert.equal(estado.nuevo, false);
});

test('el dia de su fecha sale solo, sin tocar los datos', () => {
  const estado = estadoLanzamiento(programado('2026-10-08T00:00:00Z'), el('2026-10-08'));
  assert.equal(estado.programado, false);
  assert.equal(estado.unreleased, false);
  assert.equal(estado.nuevo, true, 'el dia del lanzamiento es nuevo');
});

test('el lote programado es nuevo los 7 dias completos y deja de serlo al octavo', () => {
  const sprite = programado('2026-10-08T00:00:00Z');
  assert.equal(estadoLanzamiento(sprite, el('2026-10-08') + 6 * DIA).nuevo, true, 'dia 6');
  assert.equal(estadoLanzamiento(sprite, el('2026-10-08') + 7 * DIA).nuevo, false, 'dia 7');
});

test('el lote del 1 de octubre deja de ser nuevo el 8', () => {
  const sprite = delLoteViejo('2026-10-01T00:00:00Z');
  assert.equal(estadoLanzamiento(sprite, el('2026-10-06')).nuevo, true, 'hoy (6 oct) era nuevo');
  assert.equal(estadoLanzamiento(sprite, el('2026-10-08')).nuevo, false, 'el 8 ya no');
});

test('los dos lotes no son nuevos a la vez', () => {
  const viejo = delLoteViejo('2026-10-01T00:00:00Z');
  const nuevo = programado('2026-10-08T00:00:00Z');
  const el8 = el('2026-10-08');
  assert.equal(estadoLanzamiento(viejo, el8).nuevo, false);
  assert.equal(estadoLanzamiento(nuevo, el8).nuevo, true);
});

test('sin fecha manda la marca manual, como hasta ahora', () => {
  const sinFecha = { id: 'ghost_gem', unreleased: true };
  const estado = estadoLanzamiento(sinFecha, el('2026-10-06'));
  assert.equal(estado.programado, false);
  assert.equal(estado.unreleased, true);
  assert.equal(estado.nuevo, false);
});

test('notNew apaga la novedad de un lote que se dio por cerrado', () => {
  const excluido = { id: 'birthday_basic', unreleased: false, releaseDate: '2026-10-06T00:00:00Z', notNew: true };
  // La fecha sola lo dejaria dentro de la ventana...
  assert.equal(estadoLanzamiento(excluido, el('2026-10-06')).nuevo, true);
  // ...y notNew lo apaga (asi lo aplica toda la app).
  assert.equal(esNovedad(excluido, el('2026-10-06')), false);
});

test('sin fecha ni marca nada esta lanzado y no es nuevo', () => {
  const estado = estadoLanzamiento({ id: 'water_basic' }, el('2026-10-06'));
  assert.equal(estado.programado, false);
  assert.equal(estado.unreleased, false);
  assert.equal(estado.nuevo, false);
});

test('la ventana son 7 dias completos', () => {
  assert.equal(DIAS_NOVEDAD, 7);
});

// El lanzamiento es un instante global: el mismo momento para todos. Lo que cambia es el reloj
// de cada pais, que es exactamente como se sienten los eventos de Fortnite (03:00 en Peru,
// 02:00 en Mexico y Guatemala, 01:00 en Los Angeles, 10:00 en Madrid).
function partesLocales(iso, zona) {
  const partes = new Intl.DateTimeFormat('es', {
    timeZone: zona, day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(iso));
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return { dia: valor('day'), mes: valor('month'), hora: Number(valor('hour')) % 24, minuto: Number(valor('minute')) };
}

test('el mismo instante cae el 8 en todo el mundo, cada uno a su hora', () => {
  const suelta = '2026-10-08T08:00:00Z'; // 03:00 en Peru
  const esperado = [
    ['America/Lima', 3],
    ['America/Bogota', 3],
    ['America/Mexico_City', 2],
    ['America/Guatemala', 2],
    ['America/Los_Angeles', 1],
    ['America/New_York', 4],
    ['America/Sao_Paulo', 5],
    ['Europe/Madrid', 10],
  ];
  for (const [zona, hora] of esperado) {
    const local = partesLocales(suelta, zona);
    assert.equal(local.dia, '8', zona + ': deberia ser el dia 8');
    assert.equal(local.mes, '10', zona + ': deberia ser octubre');
    assert.equal(local.hora, hora, zona + ': deberia marcar las ' + hora + ':00');
    assert.equal(local.minuto, 0, zona + ': minuto en punto');
  }
});

test('un dia suelto (medianoche UTC) adelantaria el lanzamiento en America', () => {
  // La trampa que se evito: guardar solo la fecha y compararla como medianoche UTC pondria el
  // lote a las 19:00 del dia 7 en Lima y a las 00:00 del 8 en Madrid.
  const suelta = '2026-10-08T00:00:00Z';
  assert.equal(partesLocales(suelta, 'America/Lima').dia, '7', 'en Lima seria todavia el 7');
  assert.equal(partesLocales(suelta, 'Europe/Madrid').dia, '8');
});

