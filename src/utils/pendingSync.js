// Empuje garantizado de la coleccion a la nube.
// El cliente de Supabase no sobrevive al cierre de la pestana, asi que el envio
// final se hace con fetch + keepalive. sendBeacon no sirve porque no permite los
// headers apikey/Authorization que PostgREST necesita.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let pendingPayload = null;
let sessionToken = null;

export function setSyncSession(session) {
  sessionToken = session && session.access_token ? session.access_token : null;
}

export function queueCloudSync(payload) {
  pendingPayload = payload;
}

export function clearCloudSync() {
  pendingPayload = null;
}

export function hasPendingSync() {
  return Boolean(pendingPayload);
}

export function flushCloudSync() {
  if (!pendingPayload || !sessionToken || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  const payload = pendingPayload;
  pendingPayload = null;
  try {
    fetch(SUPABASE_URL + '/rest/v1/user_collections?on_conflict=user_id', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + sessionToken,
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
    return true;
  } catch (err) {
    pendingPayload = payload;
    return false;
  }
}

