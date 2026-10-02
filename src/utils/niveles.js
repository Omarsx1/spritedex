/**
 * Estado de un espiritu cuando el visitante toca una de sus monedas.
 *
 * La primera moneda funciona como interruptor: si el espiritu ya estaba en
 * nivel 1, volver a tocarla lo DESMARCA. Es literalmente lo que promete el
 * cartel de esa moneda ("Toca para desmarcar") y hasta ahora no podia pasar:
 * el manejador ponia owned:true pasara lo que pasara, asi que la unica forma
 * de desmarcar era tocar el cuerpo de la carta, y el cartel mentia.
 *
 * Tocar la primera moneda desde un nivel mas alto NO desmarca: baja a 1, que es
 * lo que el visitante espera de un cambio de nivel.
 *
 * Vive fuera del componente para que `node --test` pueda fijarlo sin JSX.
 */
export function estadoAlTocarNivel(actual, nivelPedido) {
  const nivel = Math.min(Math.max(Number(nivelPedido) || 1, 1), 5);
  const estabaDentro = Boolean(actual && actual.owned);
  const estabaEnNivelUno = (Number(actual && actual.level) || 1) === 1;

  if (nivel === 1 && estabaDentro && estabaEnNivelUno) {
    return { owned: false, level: 1 };
  }
  return { owned: true, level: nivel };
}
