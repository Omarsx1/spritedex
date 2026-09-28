import { getSupabase } from './supabase';
import { trackEvent } from './telemetry';

// Acciones de autenticacion compartidas por la modal de acceso y el menu del usuario.
// Estaban dentro de la modal, pero el menu tambien necesita lanzar la vinculacion.

export function origenActual() {
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

function mensajeAmigable(error, esAnonimo) {
  const mensaje = error?.message || '';
  if (esAnonimo && /manual linking|linking is disabled|not enabled/i.test(mensaje)) {
    return 'Vincular con Google todavia no esta activado en el proyecto. Vincula con correo: conserva todo tu progreso igual.';
  }
  if (mensaje.includes('provider is not enabled') || error?.code === 'validation_failed') {
    return 'Google Sign-In requiere activar Google en el proyecto. Puedes usar el acceso rapido sin registrarte.';
  }
  return mensaje || 'Error con Google Sign-In';
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
    return { error: error ? new Error(mensajeAmigable(error, esAnonimo)) : null };
  } catch (err) {
    return { error: new Error(mensajeAmigable(err, esAnonimo)) };
  }
}

