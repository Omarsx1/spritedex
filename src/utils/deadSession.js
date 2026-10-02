// Una sesion guardada en el navegador puede apuntar a una identidad que Supabase ya no
// tiene. El navegador sigue creyendo que hay sesion (lee el token en local), pero la nube
// rechaza cada guardado: la fila referencia auth.users(id) y ese usuario ya no existe, y
// hasta que el token caduca (puede tardar una hora) el usuario marca y pierde en silencio.
//
// Esta regla decide cuando hay que reaccionar en el acto. Vive aqui, suelta de App.jsx,
// porque es la unica pieza que se puede probar sin borrar una identidad real en Supabase
// (tests/deadSession.test.js).

/**
 * ¿El error de guardado significa que la identidad ya no sirve?
 *
 * - 23503: violacion de clave foranea de Postgres. user_collections.user_id referencia
 *   auth.users(id) y el usuario fue borrado.
 * - 401: la peticion llego con un token que Supabase ya rechazo. PostgREST tambien lo
 *   reporta como PGRST301 (JWT invalido o caducado) con estado HTTP 401.
 *
 * Cualquier otro error (red, permisos, servidor caido) no entra aqui: se deja al manejo
 * que ya existe para fallos normales.
 */
export function isDeadSessionError(error) {
  if (!error) return false;
  if (error.code === '23503') return true;
  return error.status === 401 || error.code === '401' || error.code === 'PGRST301';
}
