// Estado y acciones del contador manual de cofres. Vive fuera del componente para poder
// probar el "Deshacer" de verdad: revierte la ULTIMA acción, no resta uno fijo.
//
// Cada acción guarda una foto del estado anterior. Deshacer restaura esa foto y la quita del
// historial. Así, tras un +5, deshacer quita 5; tras marcar el token, lo desmarca.

import { equipoInicial, normalizarEquipo } from './cofresEquipo.js';

export const HISTORIAL_MAX = 30;

export function estadoInicial() {
  return { total: 0, sesion: 0, token: false, tokenFecha: null, dias: {}, equipo: equipoInicial(), historial: [] };
}

export function normalizar(guardado) {
  const base = estadoInicial();
  if (!guardado || typeof guardado !== 'object') return base;
  const dias = guardado.dias && typeof guardado.dias === 'object' ? { ...guardado.dias } : {};
  // Compatibilidad con la primera version: guardaba { hoy, fecha } sin dias.
  if (Object.keys(dias).length === 0 && guardado.fecha && Number(guardado.hoy) > 0) {
    dias[guardado.fecha] = Math.max(0, Number(guardado.hoy) || 0);
  }
  return {
    total: Math.max(0, Number(guardado.total) || 0),
    sesion: Math.max(0, Number(guardado.sesion) || 0),
    token: guardado.token === true,
    tokenFecha: typeof guardado.tokenFecha === 'string' ? guardado.tokenFecha : null,
    dias,
    equipo: normalizarEquipo(guardado.equipo),
    historial: Array.isArray(guardado.historial) ? guardado.historial.slice(-HISTORIAL_MAX) : []
  };
}

function foto(estado) {
  return {
    total: estado.total,
    sesion: estado.sesion,
    token: estado.token,
    tokenFecha: estado.tokenFecha,
    dias: { ...estado.dias },
    equipo: {
      ...(estado.equipo || equipoInicial()),
      jugadores: (estado.equipo?.jugadores || []).map((j) => ({ ...j, dias: { ...j.dias } }))
    }
  };
}

export function aplicar(estado, cambios) {
  const historial = [...(estado.historial || []), foto(estado)].slice(-HISTORIAL_MAX);
  return { ...estado, ...cambios, historial };
}

export function sumarCofres(estado, cantidad, hoy) {
  const dias = { ...estado.dias };
  dias[hoy] = Math.max(0, (Number(dias[hoy]) || 0) + cantidad);
  return aplicar(estado, {
    total: Math.max(0, estado.total + cantidad),
    sesion: Math.max(0, estado.sesion + cantidad),
    dias
  });
}

export function alternarToken(estado, hoy) {
  const token = !estado.token;
  return aplicar(estado, { token, tokenFecha: token ? hoy : null });
}

export function reiniciarSesion(estado) {
  return aplicar(estado, { sesion: 0 });
}

export function reiniciarTodo() {
  return estadoInicial();
}

export function deshacerUltimo(estado) {
  const historial = estado.historial || [];
  if (!historial.length) return estado;
  const anterior = historial[historial.length - 1];
  return { ...estado, ...anterior, historial: historial.slice(0, -1) };
}
