import { useEffect, useRef, useState } from 'react';
import { getSupabase } from '../utils/supabase';
import { fusionarCofres, sinHistorial } from '../utils/cofresCloud.js';

// Estado de sincronización:
//   local   -> sin sesión, o la nube no está disponible (la tabla aún no existe, sin red)
//   syncing -> leyendo/guardando
//   synced  -> fila leída y al día
export function useCofresCloud({ user, cofres, setCofres }) {
  const [estado, setEstado] = useState('local');
  const cofresRef = useRef(cofres);
  const cargadoRef = useRef(false);
  const ultimoSubido = useRef('');
  const userId = user?.id || null;

  useEffect(() => {
    cofresRef.current = cofres;
  }, [cofres]);

  // 1. Al entrar (o cambiar de cuenta): leer la fila y fusionar con lo local.
  useEffect(() => {
    let cancelado = false;
    cargadoRef.current = false;
    ultimoSubido.current = '';
    if (!userId) {
      setEstado('local');
      return () => { cancelado = true; };
    }

    setEstado('syncing');
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) {
          if (!cancelado) setEstado('local');
          return;
        }
        const { data, error } = await supabase
          .from('chest_counters')
          .select('state')
          .eq('user_id', userId)
          .maybeSingle();

        if (cancelado) return;
        if (error) {
          // Tabla sin migrar o RLS: se sigue en local sin romper la página.
          console.warn('[cofres] sincronización no disponible:', error.message);
          setEstado('local');
          return;
        }

        const remoto = data?.state || null;
        const fusion = fusionarCofres(cofresRef.current, remoto);
        if (remoto) {
          setCofres(fusion);
          cofresRef.current = fusion;
        }
        // Se compara contra lo remoto: si la fusión aporta algo local, el efecto 2 lo sube.
        ultimoSubido.current = remoto ? JSON.stringify(sinHistorial(remoto)) : '';
        cargadoRef.current = true;
        setEstado('synced');
      } catch (err) {
        if (!cancelado) {
          console.warn('[cofres] no se pudo leer la nube:', err?.message || err);
          setEstado('local');
        }
      }
    })();

    return () => { cancelado = true; };
  }, [userId, setCofres]);

  // 2. Cada cambio local se empuja con debounce. El historial de Deshacer no se sube.
  useEffect(() => {
    if (!userId || !cargadoRef.current) return undefined;
    const payload = sinHistorial(cofres);
    const serializado = JSON.stringify(payload);
    if (serializado === ultimoSubido.current) return undefined;

    const timer = setTimeout(async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;
        const { error } = await supabase
          .from('chest_counters')
          .upsert(
            { user_id: userId, state: payload, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          );
        if (error) {
          console.warn('[cofres] no se pudo guardar en la nube:', error.message);
          setEstado('local');
          return;
        }
        ultimoSubido.current = serializado;
        setEstado('synced');
      } catch (err) {
        console.warn('[cofres] error al sincronizar:', err?.message || err);
        setEstado('local');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [cofres, userId, setCofres]);

  return estado;
}
