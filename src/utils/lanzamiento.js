// Cuando sale cada espiritu y cuanto dura la etiqueta de nuevo: una sola regla para toda la app.
//
// De aqui salen dos cosas que antes vivian repartidas por el codigo:
//
//   programado  -> el espiritu tiene release_date en el FUTURO: todavia no se ve. Basta con
//                  ponerle fecha para programarlo, y el dia que llega sale solo: no hace falta
//                  tocar la marca 'unreleased' ni desplegar nada esa madrugada.
//   nuevo       -> salio y esta dentro de la ventana de novedad: 7 dias COMPLETOS (0..6).
//
// El lanzamiento es UN INSTANTE GLOBAL, como los eventos de Fortnite: sale a la MISMA hora en
// todo el mundo y cada uno lo lee en su reloj. El lote de Dulce o Truco sale el 8 de octubre a
// las 08:00 UTC, que son las 03:00 en Peru, 02:00 en Mexico y Guatemala, 01:00 en Los Angeles,
// 04:00 en Nueva York y 10:00 en Madrid: el mismo momento, distinta hora local.
//
// Por eso la fecha se guarda completa (con hora y zona) y no como un dia suelto: un dia suelto
// se lee como medianoche UTC y adelanta el lanzamiento a la noche anterior en toda America.
//
// La ventana es menor que 7 y no menor o igual a 7 a proposito: el lote del 1 de octubre
// seguia contando como nuevo el dia 8, que es justo cuando entra el siguiente, y el aviso
// flotante anunciaba las dos tandas a la vez. Con 7 dias completos, el 8 el lote viejo se
// apaga y el nuevo se enciende: un solo lote nuevo cada vez.
//
// Sin 'unreleased' y sin fecha, un espiritu esta lanzado y no es nuevo (el caso normal).
// 'notNew' apaga la novedad de un lote que se dio por cerrado: lo aplica esNovedad().
//
// Modulo puro (sin DOM ni React) para poder probarlo con node --test, igual que el resto de
// helpers: entra un sprite y una fecha, sale el estado. La fecha se inyecta para que las
// pruebas puedan preguntar por el 7, el 8 y el 15 de octubre sin tocar el reloj.

export const DIAS_NOVEDAD = 7;
const DIA_MS = 24 * 60 * 60 * 1000;

export function estadoLanzamiento(sprite, ahora = Date.now()) {
  const raw = sprite && (sprite.release_date || sprite.releaseDate);
  const releaseTime = raw ? new Date(raw).getTime() : 0;
  const programado = releaseTime > ahora;
  const unreleased = Boolean(sprite && sprite.unreleased) || programado;
  const diasDesde = (!unreleased && releaseTime > 0) ? (ahora - releaseTime) / DIA_MS : Infinity;
  const nuevo = !unreleased && releaseTime > 0 && diasDesde >= 0 && diasDesde < DIAS_NOVEDAD;
  return { releaseTime, programado, unreleased, diasDesde, nuevo };
}

export function esNovedad(sprite, ahora = Date.now()) {
  if (sprite && sprite.notNew) return false;
  return estadoLanzamiento(sprite, ahora).nuevo;
}

// "8 oct" para los avisos de la app y del CMS.
export function fechaCorta(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
