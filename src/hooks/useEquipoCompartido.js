import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabase } from '../utils/supabase';

// Equipo compartido en tiempo real. La fuente de verdad son las tablas `teams` y
// `team_members`; los contadores se mueven por RPC atómica y Realtime refresca la plantilla.
// Cada usuario solo puede sumar/restar su propia fila (la RPC lo impone).

function hoyClave() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useEquipoCompartido(user) {
  const [equipo, setEquipo] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [pasados, setPasados] = useState([]);
  const [aporteEquipos, setAporteEquipos] = useState(0);
  const [equiposCount, setEquiposCount] = useState(0);
  const [cargando, setCargando] = useState(Boolean(user));
  const [error, setError] = useState('');
  const [enVivo, setEnVivo] = useState(false);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const ultimoDelta = useRef(0);
  const userId = user?.id || null;

  const cargar = useCallback(async () => {
    if (!userId) {
      setEquipo(null);
      setMiembros([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        setError('sin-supabase');
        return;
      }
      // Todas las pertenencias (activa e históricas): así el total general no pierde
      // lo que el usuario sumó en equipos de los que ya salió.
      const { data: todos, error: errorTodos } = await supabase
        .from('team_members')
        .select('team_id, total, dias, left_at, teams(name, code, archived_at)')
        .eq('user_id', userId);
      if (errorTodos) {
        setError(errorTodos.message);
        return;
      }
      const lista = todos || [];
      setAporteEquipos(lista.reduce((n, p) => n + (Number(p.total) || 0), 0));
      setEquiposCount(new Set(lista.map((p) => p.team_id)).size);
      setPasados(lista
        .filter((p) => p.left_at)
        .sort((a, b) => String(b.left_at).localeCompare(String(a.left_at)))
        .map((p) => ({
          teamId: p.team_id,
          nombre: p.teams?.name || 'Equipo',
          codigo: p.teams?.code || '',
          total: Number(p.total) || 0,
          dias: p.dias && typeof p.dias === 'object' ? p.dias : {},
          leftAt: p.left_at,
          archivado: Boolean(p.teams?.archived_at)
        })));
      const mine = lista.find((p) => !p.left_at);
      if (!mine) {
        setEquipo(null);
        setMiembros([]);
        return;
      }
      const { data: team, error: errorTeam } = await supabase
        .from('teams')
        .select('id, code, name, owner_id')
        .eq('id', mine.team_id)
        .maybeSingle();
      if (errorTeam) {
        setError(errorTeam.message);
        return;
      }
      const { data: members, error: errorMembers } = await supabase
        .from('team_members')
        .select('user_id, display_name, total, dias, left_at, joined_at, updated_at')
        .eq('team_id', mine.team_id)
        .order('total', { ascending: false });
      if (errorMembers) {
        setError(errorMembers.message);
        return;
      }
      setEquipo(team ? { id: team.id, code: team.code, name: team.name, ownerId: team.owner_id } : null);
      setMiembros((members || []).map((m) => ({
        userId: m.user_id,
        nombre: m.display_name,
        total: Number(m.total) || 0,
        dias: m.dias && typeof m.dias === 'object' ? m.dias : {},
        leftAt: m.left_at || null,
        joinedAt: m.joined_at || null,
        actualizado: m.updated_at
      })));
    } catch (err) {
      setError(err?.message || 'error');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Realtime: cualquier cambio de la plantilla o del equipo refresca la vista.
  useEffect(() => {
    if (!userId || !equipo?.id) return undefined;
    let cancelado = false;
    let canal = null;
    (async () => {
      const supabase = await getSupabase();
      if (!supabase || cancelado) return;
      canal = supabase
        .channel(`equipo:${equipo.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${equipo.id}` }, () => cargar())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${equipo.id}` }, () => cargar())
        .subscribe((estado) => {
          if (!cancelado) setEnVivo(estado === 'SUBSCRIBED');
        });
    })();
    return () => {
      cancelado = true;
      setEnVivo(false);
      if (canal) getSupabase().then((supabase) => supabase?.removeChannel(canal)).catch(() => {});
    };
  }, [userId, equipo?.id, cargar]);

  async function crear(nombre, display) {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data, error: err } = await supabase.rpc('crear_equipo', {
      p_nombre: nombre || 'Mi equipo',
      p_display: display || 'Jugador'
    });
    if (err) {
      setError(err.message);
      return null;
    }
    ultimoDelta.current = 0;
    setPuedeDeshacer(false);
    await cargar();
    return Array.isArray(data) ? data[0] : data;
  }

  async function unir(codigo, display) {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data, error: err } = await supabase.rpc('unir_equipo', {
      p_code: codigo,
      p_display: display || 'Jugador'
    });
    if (err) {
      setError(err.message);
      return null;
    }
    ultimoDelta.current = 0;
    setPuedeDeshacer(false);
    await cargar();
    return Array.isArray(data) ? data[0] : data;
  }

  async function salir() {
    if (!equipo) return;
    const supabase = await getSupabase();
    if (!supabase) return;
    const { error: err } = await supabase.rpc('salir_equipo', { p_team_id: equipo.id });
    if (err) {
      setError(err.message);
      return;
    }
    ultimoDelta.current = 0;
    setPuedeDeshacer(false);
    await cargar();
  }

  async function sumar(delta) {
    if (!equipo) return;
    const supabase = await getSupabase();
    if (!supabase) return;
    const dia = hoyClave();
    // Optimista: el número cambia al instante; Realtime/RPC confirma después.
    setMiembros((prev) => prev.map((m) => {
      if (m.userId !== userId) return m;
      const dias = { ...m.dias };
      dias[dia] = Math.max(0, (Number(dias[dia]) || 0) + delta);
      return { ...m, total: Math.max(0, m.total + delta), dias };
    }));
    setAporteEquipos((n) => Math.max(0, n + delta));
    const { error: err } = await supabase.rpc('sumar_cofre_equipo', {
      p_team_id: equipo.id,
      p_delta: delta,
      p_dia: dia
    });
    if (err) {
      setError(err.message);
      await cargar();
      return;
    }
    ultimoDelta.current = delta;
    setPuedeDeshacer(true);
  }

  async function deshacer() {
    if (!equipo || !ultimoDelta.current) return;
    const delta = -ultimoDelta.current;
    ultimoDelta.current = 0;
    setPuedeDeshacer(false);
    const supabase = await getSupabase();
    if (!supabase) return;
    setMiembros((prev) => prev.map((m) => {
      if (m.userId !== userId) return m;
      const dias = { ...m.dias };
      const dia = hoyClave();
      dias[dia] = Math.max(0, (Number(dias[dia]) || 0) + delta);
      return { ...m, total: Math.max(0, m.total + delta), dias };
    }));
    setAporteEquipos((n) => Math.max(0, n + delta));
    const { error: err } = await supabase.rpc('sumar_cofre_equipo', {
      p_team_id: equipo.id,
      p_delta: delta,
      p_dia: hoyClave()
    });
    if (err) {
      setError(err.message);
      await cargar();
    }
  }

  return {
    equipo,
    miembros,
    pasados,
    aporteEquipos,
    equiposCount,
    cargando,
    error,
    enVivo,
    puedeDeshacer,
    miembro: miembros.find((m) => m.userId === userId && !m.leftAt) || null,
    crear,
    unir,
    salir,
    sumar,
    deshacer
  };
}
