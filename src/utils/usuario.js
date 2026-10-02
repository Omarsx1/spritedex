// El usuario y la contrasena: el nombre que se escribe al entrar y la unica regla que
// decide si ese nombre se puede usar.
//
// Vive aparte de la modal por la misma razon que visitaEnlace.js: es una regla pura y
// suelta se prueba sin montar React (tests/usuario.test.js). La modal solo la pinta.
//
// El correo con el que Supabase identifica la cuenta es SINTETICO (<usuario>@spritedex.gg)
// y nunca se muestra. No se puede reemplazar por el correo de contacto: si el correo real
// pasara a ser la identidad, el inicio de sesion por usuario ya no se podria derivar de el.

export const DOMINIO_SINTETICO = '@spritedex.gg';

const LARGO_MINIMO = 3;
const LARGO_MAXIMO = 16;
const CONTRASENA_MINIMA = 8;

// Nombres que nadie deberia poder usar: suenan a la app o a soporte, y quien se quedara
// con uno podria hacerse pasar por el equipo.
const RESERVADOS = new Set([
  'admin', 'administrador', 'spritedex', 'soporte', 'moderador', 'equipo', 'oficial',
  'sistema', 'sdex', 'www', 'api', 'login', 'root', 'dev', 'test', 'ayuda', 'staff'
]);

/**
 * Forma canonica de un usuario: sin espacios (ni al principio, ni al final, ni en medio)
 * y en minusculas. Es la forma con la que se compara, se consulta y se crea la cuenta.
 */
export function normalizarUsuario(valor) {
  return String(valor == null ? '' : valor).trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * Revisa un usuario y devuelve { ok: true, usuario } o { ok: false, motivo }.
 *
 * El orden de los motivos importa: primero el largo, luego los caracteres y despues el
 * inicio. Asi un nombre con acentos ("josé") cae en 'caracteres', que es la causa real,
 * y no en 'inicio'. Un digito o un guion bajo al principio si pasan el filtro de
 * caracteres, y por eso llegan a 'inicio'.
 */
export function validarUsuario(valor) {
  const usuario = normalizarUsuario(valor);
  if (usuario.length < LARGO_MINIMO || usuario.length > LARGO_MAXIMO) {
    return { ok: false, motivo: 'largo' };
  }
  if (!/^[a-z0-9_]+$/.test(usuario)) {
    return { ok: false, motivo: 'caracteres' };
  }
  if (!/^[a-z]/.test(usuario)) {
    return { ok: false, motivo: 'inicio' };
  }
  // El doble guion bajo confunde con los separadores internos y el final invita a
  // confusiones al copiar el nombre; ninguno de los dos aporta nada.
  if (usuario.includes('__') || usuario.endsWith('_')) {
    return { ok: false, motivo: 'guiones' };
  }
  if (RESERVADOS.has(usuario)) {
    return { ok: false, motivo: 'reservado' };
  }
  return { ok: true, usuario };
}

/**
 * Correo sintetico de una cuenta: '' si no hay usuario, si no <usuario>@spritedex.gg.
 * Si ya viene con el dominio (o con una arroba suelta delante) se devuelve tal cual,
 * para no generar "usuario@spritedex.gg@spritedex.gg".
 */
export function usuarioAEmail(usuario) {
  const limpio = normalizarUsuario(usuario).replace(/^@+/, '');
  if (!limpio) return '';
  if (limpio.endsWith(DOMINIO_SINTETICO)) return limpio;
  return limpio + DOMINIO_SINTETICO;
}

/**
 * ¿Este correo es el sintetico de una cuenta por usuario? La interfaz lo usa para no
 * mostrar nunca <usuario>@spritedex.gg como si fuera un correo real.
 */
export function esCorreoSintetico(correo) {
  return String(correo == null ? '' : correo).trim().toLowerCase().endsWith(DOMINIO_SINTETICO);
}

/**
 * Regla de contrasena de la version 1: minimo 8 caracteres, sin mas requisitos.
 * Devuelve { ok: true } o { ok: false, motivo: 'corta' }.
 */
export function validarContrasena(valor) {
  if (String(valor == null ? '' : valor).length < CONTRASENA_MINIMA) {
    return { ok: false, motivo: 'corta' };
  }
  return { ok: true };
}

/**
 * Usuario de la sesion actual, o '' si la cuenta no tiene uno (Google, correo real o
 * una identidad anonima). Es la fuente de la linea de identidad del menu.
 */
export function usuarioDeSesion(user) {
  const nombre = user && user.user_metadata ? user.user_metadata.username : '';
  return typeof nombre === 'string' ? nombre : '';
}
