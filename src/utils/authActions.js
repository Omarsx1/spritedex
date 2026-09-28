import { getSupabase } from './supabase';
import { trackEvent } from './telemetry';
import { mensajeDeAuth } from './authMessages';

// Acciones de autenticacion compartidas por la modal de acceso y el menu del usuario.
// Estaban dentro de la modal, pero el menu tambien necesita lanzar la vinculacion.

export function origenActual() {
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

// Con sesion anonima hay que VINCULAR la identidad (linkIdentity), no iniciar sesion:
// un login normal crea un usuario NUEVO y la coleccion se queda atras. Vincular exige
// "Manual Linking" activado en Supabase.
export async function conGoogle(esAnonimo) {
  try {
    const supabase = await getSupabase();
    if (!supabase) return { error: new Error('La nube no esta configurada.') };
    trackEvent(esAnonimo ? 'link' : 'login', { method: 'google' });
    const opciones = {
      provider: 'google',
      options: {
        redirectTo: origenActual(),
        queryParams: { prompt: 'select_account', access_type: 'offline' }
      }
    };
    const { error } = esAnonimo
      ? await supabase.auth.linkIdentity(opciones)
      : await supabase.auth.signInWithOAuth(opciones);
    if (error) {
      // El error crudo queda en consola: el mensaje amigable puede dejar fuera la causa.
      console.warn('[auth] Google fallo', { code: error.code, message: error.message, esAnonimo });
    }
    return { error: error ? new Error(mensajeDeAuth(error, esAnonimo)) : null };
  } catch (err) {
    console.warn('[auth] Google fallo', { message: err?.message, esAnonimo });
    return { error: new Error(mensajeDeAuth(err, esAnonimo)) };
  }
}
