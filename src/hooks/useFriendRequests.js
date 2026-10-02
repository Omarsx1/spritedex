import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../utils/supabase';
import { normalizeFriendCode } from '../utils/friendCode';
import { leerRed, guardarRed } from '../utils/redAmigos';

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
  // "cargado" significa que una respuesta de la red ya llego. Sin esto la pagina respondia
  // "no tienes amigos" a una pregunta que todavia nadie habia hecho.
  const [cargado, setCargado] = useState(false);
  // ¿Ya se sabe si hay sesion? Sin esto la pagina no distingue "todavia no se sabe" de "no
  // hay sesion", y mientras la sesion se resolvia afirmaba que no tenias amigos.
  const [sesionLista, setSesionLista] = useState(false);
  // La lectura fallo y no hay nada guardado que mostrar. Decirlo es mas honesto que afirmar
  // que no tienes a nadie.
  const [fallo, setFallo] = useState(false);

  // El usuario sale de la sesion (anonima o con cuenta): asi la modal no necesita que
  // App le pase nada nuevo.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;
        // getSession() lee la sesion local. getUser() validaba el token contra el servidor
        // en cada montaje y retrasaba la lista; aqui solo hace falta el id.
        const { data } = await supabase.auth.getSession();
        if (vivo) setYo(data?.session?.user || null);
      } catch (err) {
        console.warn('[amigos] sin sesion para solicitudes:', err);
      } finally {
        if (vivo) setSesionLista(true);
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    // Sin sesion no hay nada que leer: si se sale sin bajar la bandera, el boton de
    // actualizar queda deshabilitado para siempre.
    if (!yo?.id) { setCargando(false); return; }
    const supabase = await getSupabase();
    if (!supabase) { setCargando(false); return; }
    // En silencio: la lista ya esta pintada desde la cache y no debe parpadear.
    if (!silencioso) setCargando(true);
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id, from_user, from_code, to_user, to_code, status, created_at')
        .or(`from_user.eq.${yo.id},to_user.eq.${yo.id}`);
      if (error) throw error;
      const filas = data || [];
      const red = {
        recibidas: filas.filter((f) => f.status === 'pending' && f.to_user === yo.id),
        enviadas: filas.filter((f) => f.status === 'pending' && f.from_user === yo.id),
        amigos: filas.filter((f) => f.status === 'accepted')
      };
      setRecibidas(red.recibidas);
      setEnviadas(red.enviadas);
      setAmigos(red.amigos);
      // La cache solo se escribe con una respuesta buena: un fallo no borra lo que ya se sabia.
      setCargado(true);
      setFallo(false);
      guardarRed(yo.id, red);
    } catch (err) {
      console.warn('[amigos] no se pudieron leer las solicitudes:', err);
      setFallo(true);
    } finally {
      setCargando(false);
    }
  }, [yo]);

  useEffect(() => {
    if (!yo?.id) return;
    // Salir de /amigos desmonta la pagina y se llevaba consigo toda la lista: si ya hay una
    // lectura guardada, se pinta al instante y se revalida por detras.
    const guardada = leerRed(yo.id);
    if (guardada) {
      setRecibidas(guardada.recibidas);
      setEnviadas(guardada.enviadas);
      setAmigos(guardada.amigos);
      setCargado(true);
      cargar({ silencioso: true });
      return;
    }
    cargar();
  }, [yo, cargar]);

  // Codigo -> dueño. Es el unico puente entre lo que la gente escribe y un uuid.
  const resolverCodigo = useCallback(async (codigo) => {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const normalizado = normalizeFriendCode(codigo);
    // El codigo se resuelve con una funcion del servidor que solo devuelve el id: asi la
    // tabla de colecciones puede dejar de ser publica. Mientras la funcion no exista (o si
    // falla), se usa la consulta de siempre para no dejar a nadie sin poder enviar solicitudes.
    const { data, error } = await supabase.rpc('user_id_by_friend_code', { codigo: normalizado });
    if (!error) return data ? { userId: data, codigo: normalizado } : null;

    console.warn('[amigos] funcion no disponible, se usa la consulta directa:', error.message);
    const { data: filas } = await supabase
      .from('user_collections')
      .select('user_id')
      .eq('friend_code', normalizado)
      .order('updated_at', { ascending: false })
      .limit(1);
    return filas && filas[0] ? { userId: filas[0].user_id, codigo: normalizado } : null;
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

  return { haySesion: Boolean(yo?.id), sesionLista, fallo, recibidas, enviadas, amigos, cargando, cargado, cargar, enviar, aceptar, rechazar, borrar, codigoDeAmigo };
}
