import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../utils/supabase';
import { normalizeFriendCode } from '../utils/friendCode';

// Solicitudes y amistades del Radar. La base guarda una fila por relacion
// (pending | accepted | rejected) con el codigo de cada lado, asi que se puede mostrar
// quien es quien sin consultar el esquema auth.
//
// Reglas de la tabla: solo veo mis filas, solo puedo crear en mi nombre y solo el que
// recibe puede aceptar o rechazar. Todo eso vive en las politicas de la base; aqui no
// se repite, para que no haya dos verdades.
export function useFriendRequests() {
  const [yo, setYo] = useState(null);
  const [recibidas, setRecibidas] = useState([]);
  const [enviadas, setEnviadas] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // El usuario sale de la sesion (anonima o con cuenta): asi la modal no necesita que
  // App le pase nada nuevo.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        if (vivo) setYo(data?.user || null);
      } catch (err) {
        console.warn('[amigos] sin sesion para solicitudes:', err);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const cargar = useCallback(async () => {
    if (!yo?.id) return;
    const supabase = await getSupabase();
    if (!supabase) return;
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, from_user, from_code, to_user, to_code, status, created_at')
        .or(`from_user.eq.${yo.id},to_user.eq.${yo.id}`);
      if (error) throw error;
      const filas = data || [];
      setRecibidas(filas.filter((f) => f.status === 'pending' && f.to_user === yo.id));
      setEnviadas(filas.filter((f) => f.status === 'pending' && f.from_user === yo.id));
      setAmigos(filas.filter((f) => f.status === 'accepted'));
    } catch (err) {
      console.warn('[amigos] no se pudieron leer las solicitudes:', err);
    } finally {
      setCargando(false);
    }
  }, [yo]);

  useEffect(() => { cargar(); }, [cargar]);

  // Codigo -> dueño. Es el unico puente entre lo que la gente escribe y un uuid.
  const resolverCodigo = useCallback(async (codigo) => {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const normalizado = normalizeFriendCode(codigo);
    const { data } = await supabase
      .from('user_collections')
      .select('user_id')
      .eq('friend_code', normalizado)
      .order('updated_at', { ascending: false })
      .limit(1);
    return data && data[0] ? { userId: data[0].user_id, codigo: normalizado } : null;
  }, []);

  const enviar = useCallback(async (codigo, miCodigo) => {
    if (!yo?.id) return { error: 'Necesitas una sesión para enviar solicitudes.' };
    const destino = await resolverCodigo(codigo);
    if (!destino) return { error: 'No encontramos ese código. Revísalo con tu amigo.' };
    if (destino.userId === yo.id) return { error: 'Ese código es el tuyo.' };
    const supabase = await getSupabase();
    const { error } = await supabase.from('friend_requests').insert({
      from_user: yo.id,
      from_code: normalizeFriendCode(miCodigo || ''),
      to_user: destino.userId,
      to_code: destino.codigo,
      status: 'pending'
    });
    if (error) {
      if (error.code === '23505') return { error: 'Ya le enviaste una solicitud a ese código.' };
      return { error: 'No se pudo enviar la solicitud.' };
    }
    await cargar();
    return { ok: true, codigo: destino.codigo };
  }, [yo, resolverCodigo, cargar]);

  const resolverSolicitud = useCallback(async (id, estado) => {
    const supabase = await getSupabase();
    if (!supabase) return false;
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: estado, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { console.warn('[amigos] no se pudo resolver la solicitud:', error); return false; }
    await cargar();
    return true;
  }, [cargar]);

  const aceptar = useCallback((id) => resolverSolicitud(id, 'accepted'), [resolverSolicitud]);
  const rechazar = useCallback((id) => resolverSolicitud(id, 'rejected'), [resolverSolicitud]);

  const borrar = useCallback(async (id) => {
    const supabase = await getSupabase();
    if (!supabase) return false;
    const { error } = await supabase.from('friend_requests').delete().eq('id', id);
    if (error) { console.warn('[amigos] no se pudo borrar:', error); return false; }
    await cargar();
    return true;
  }, [cargar]);

  // El codigo del otro lado de la relacion, sirva de donde sirva.
  const codigoDeAmigo = useCallback((fila) => (
    fila.from_user === yo?.id ? fila.to_code : fila.from_code
  ), [yo]);

  return { haySesion: Boolean(yo?.id), recibidas, enviadas, amigos, cargando, cargar, enviar, aceptar, rechazar, borrar, codigoDeAmigo };
}

