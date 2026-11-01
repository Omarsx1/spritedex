import { getSupabase } from './supabase';
import { fetchCollectionByFriendCode, normalizeFriendCode } from './friendCode';

// Intercambio de espiritus entre amigos.
//
// La fila la crea quien envia y solo la resuelve quien recibe. Registrar el
// espiritu en la coleccion del receptor lo hace su propio cliente: la politica
// de user_collections impide escribir en la fila de otra persona.
//
// Sin tabla (migracion 2026-11-01) todo devuelve un motivo y la UI lo dice; no
// se inventa un exito.

async function conSesion() {
  const supabase = await getSupabase();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getSession();
  return { supabase, user: data?.session?.user || null };
}

/** Envia un espiritu a un amigo por su codigo. */
export async function enviarEspiritu({ codigo, spriteId, fromCode = '' }) {
  const { supabase, user } = await conSesion();
  if (!supabase || !user) return { ok: false, motivo: 'sin-sesion' };
  if (!codigo || !spriteId) return { ok: false, motivo: 'datos' };

  const destino = await fetchCollectionByFriendCode(codigo);
  const toUser = destino && destino.userId;
  if (!toUser) return { ok: false, motivo: 'sin-amigo' };
  if (toUser === user.id) return { ok: false, motivo: 'yo' };

  const { error } = await supabase.from('shared_sprites').insert({
    from_user: user.id,
    from_code: normalizeFriendCode(fromCode || ''),
    to_user: toUser,
    to_code: normalizeFriendCode(destino.friendCode || codigo),
    sprite_id: spriteId
  });

  // 23505: ya habia un envio pendiente de este espiritu a este amigo.
  if (error && error.code !== '23505') {
    console.warn('[compartir] no se pudo enviar:', error.message);
    return { ok: false, motivo: 'red' };
  }
  return { ok: true };
}

/** Envios pendientes que me hicieron a mi. */
export async function recibidosPendientes() {
  const { supabase, user } = await conSesion();
  if (!supabase || !user) return [];
  const { data, error } = await supabase
    .from('shared_sprites')
    .select('id, from_user, from_code, sprite_id, created_at')
    .eq('to_user', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('[compartir] no se pudo leer:', error.message);
    return [];
  }
  return data || [];
}

/** Acepta o rechaza un envio. Solo el receptor puede hacerlo. */
export async function resolverEnvio(id, aceptar) {
  const { supabase, user } = await conSesion();
  if (!supabase || !user || !id) return { ok: false };
  const { error } = await supabase
    .from('shared_sprites')
    .update({
      status: aceptar ? 'accepted' : 'declined',
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('to_user', user.id);
  if (error) {
    console.warn('[compartir] no se pudo resolver:', error.message);
    return { ok: false };
  }
  return { ok: true };
}
