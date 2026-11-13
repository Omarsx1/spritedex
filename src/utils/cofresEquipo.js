// Equipo del contador de cofres. Cada jugador tiene su total y su historial diario;
// el total del equipo es la suma. Los ids salen del nombre para que dos dispositivos
// que añadan "Ana" fusionen la misma jugadora en vez de duplicarla.

export function equipoInicial() {
  return { jugadores: [], activoId: null };
}

export function slugJugador(nombre) {
  const limpio = String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return limpio || 'jugador';
}

export function normalizarEquipo(equipo) {
  const vistos = new Map();
  for (const crudo of Array.isArray(equipo?.jugadores) ? equipo.jugadores : []) {
    const nombre = String(crudo?.nombre || '').trim().slice(0, 24) || 'Jugador';
    const id = String(crudo?.id || slugJugador(nombre));
    const dias = crudo?.dias && typeof crudo.dias === 'object' ? { ...crudo.dias } : {};
    const total = Math.max(0, Number(crudo?.total) || 0);
    const previo = vistos.get(id);
    if (previo) {
      previo.total = Math.max(previo.total, total);
      for (const [dia, n] of Object.entries(dias)) previo.dias[dia] = Math.max(Number(previo.dias[dia]) || 0, Number(n) || 0);
    } else {
      vistos.set(id, { id, nombre, total, dias });
    }
  }
  const jugadores = [...vistos.values()];
  const activoId = jugadores.some((j) => j.id === equipo?.activoId)
    ? equipo.activoId
    : (jugadores[0]?.id || null);
  return { jugadores, activoId };
}

export function agregarJugador(equipo, nombre) {
  const actual = normalizarEquipo(equipo);
  const limpio = String(nombre || '').trim().slice(0, 24);
  if (!limpio) return actual;
  const base = slugJugador(limpio);
  let id = base;
  let n = 2;
  while (actual.jugadores.some((j) => j.id === id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  const jugador = { id, nombre: limpio, total: 0, dias: {} };
  return { jugadores: [...actual.jugadores, jugador], activoId: id };
}

export function quitarJugador(equipo, id) {
  const actual = normalizarEquipo(equipo);
  const jugadores = actual.jugadores.filter((j) => j.id !== id);
  return {
    jugadores,
    activoId: jugadores.some((j) => j.id === actual.activoId) ? actual.activoId : (jugadores[0]?.id || null)
  };
}

export function seleccionarJugador(equipo, id) {
  const actual = normalizarEquipo(equipo);
  return actual.jugadores.some((j) => j.id === id) ? { ...actual, activoId: id } : actual;
}

export function sumarJugador(equipo, id, cantidad, hoy) {
  const actual = normalizarEquipo(equipo);
  const jugadores = actual.jugadores.map((j) => {
    if (j.id !== id) return j;
    const dias = { ...j.dias };
    dias[hoy] = Math.max(0, (Number(dias[hoy]) || 0) + cantidad);
    return { ...j, total: Math.max(0, j.total + cantidad), dias };
  });
  return { ...actual, jugadores };
}

export function jugadorActivo(equipo) {
  const actual = normalizarEquipo(equipo);
  return actual.jugadores.find((j) => j.id === actual.activoId) || null;
}

export function totalEquipo(equipo) {
  return normalizarEquipo(equipo).jugadores.reduce((n, j) => n + j.total, 0);
}

export function hoyEquipo(equipo, hoy) {
  return normalizarEquipo(equipo).jugadores.reduce((n, j) => n + (Number(j.dias[hoy]) || 0), 0);
}

export function diasEquipo(equipo) {
  const dias = {};
  for (const j of normalizarEquipo(equipo).jugadores) {
    for (const [dia, n] of Object.entries(j.dias)) {
      dias[dia] = (Number(dias[dia]) || 0) + (Number(n) || 0);
    }
  }
  return dias;
}

export function topEquipo(equipo) {
  return normalizarEquipo(equipo).jugadores.reduce((mejor, j) => (!mejor || j.total > mejor.total ? j : mejor), null);
}

export function fusionarEquipo(local, remoto) {
  const a = normalizarEquipo(local);
  const b = normalizarEquipo(remoto);
  const porId = new Map();
  for (const j of [...a.jugadores, ...b.jugadores]) {
    const previo = porId.get(j.id);
    if (!previo) {
      porId.set(j.id, { ...j, dias: { ...j.dias } });
      continue;
    }
    previo.total = Math.max(previo.total, j.total);
    for (const [dia, n] of Object.entries(j.dias)) {
      previo.dias[dia] = Math.max(Number(previo.dias[dia]) || 0, Number(n) || 0);
    }
  }
  const jugadores = [...porId.values()];
  const activoId = jugadores.some((j) => j.id === a.activoId)
    ? a.activoId
    : (jugadores.some((j) => j.id === b.activoId) ? b.activoId : (jugadores[0]?.id || null));
  return { jugadores, activoId };
}
