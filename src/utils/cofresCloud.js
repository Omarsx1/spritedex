// Sincronización del contador de cofres con la cuenta de Spritedex.
//
// El contador vive primero en localStorage (funciona sin cuenta y sin red). Cuando hay
// sesión, se fusiona con la fila de `chest_counters` y se empuja con debounce. Si la tabla
// todavía no existe, la página sigue funcionando en local: no se rompe ni pierde nada.
//
// La fusión es conservadora: por día gana el número mayor y el token se mantiene si aparece
// en cualquiera de los dos lados. El historial de "Deshacer" es local y no se sube.

import { fusionarEquipo } from './cofresEquipo.js';

export function sinHistorial(estado) {
  if (!estado) return {};
  const { historial, ...resto } = estado;
  return resto;
}

export function fusionarCofres(local, remoto) {
  if (!remoto || typeof remoto !== 'object') return local;
  const dias = { ...(local?.dias || {}) };
  for (const [dia, cantidad] of Object.entries(remoto.dias || {})) {
    dias[dia] = Math.max(Number(dias[dia]) || 0, Number(cantidad) || 0);
  }
  const token = Boolean(local?.token || remoto.token);
  const fechas = [local?.tokenFecha, remoto.tokenFecha].filter(Boolean).sort();
  return {
    ...local,
    total: Math.max(Number(local?.total) || 0, Number(remoto.total) || 0),
    sesion: Math.max(Number(local?.sesion) || 0, Number(remoto.sesion) || 0),
    token,
    tokenFecha: token ? (fechas[0] || null) : null,
    dias,
    equipo: fusionarEquipo(local?.equipo, remoto.equipo),
    historial: local?.historial || []
  };
}
