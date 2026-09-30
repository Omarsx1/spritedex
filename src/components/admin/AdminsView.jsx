import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, UserPlus, UserMinus, Mail } from 'lucide-react';
import { getSupabase } from '../../utils/supabase';
import { showConfirmDialog, showSuccessAlert } from '../../utils/alert';

// Accesos al CMS.
//
// Antes el acceso lo daba una clave escrita en el código, que viaja en el bundle público:
// cualquiera podía leerla. Ahora la clave solo abre la interfaz y el acceso real lo da
// esta lista, que vive en la base (public.admins) y se comprueba en el servidor con RLS.
//
// Esta pantalla habla por RPC y no con la tabla directamente, por dos razones: los correos
// viven en el esquema auth, que el navegador no puede leer, y las RPC comprueban por su
// cuenta que quien llama es administrador (no basta con que la UI lo esconda).
const LISTAR = 'admin_listar_admins';
const AGREGAR = 'admin_agregar_admin';
const QUITAR = 'admin_quitar_admin';

// PostgREST responde PGRST202 cuando la función todavía no existe: es el caso de una base
// a la que aún no se le ha ejecutado el SQL del panel, y merece un aviso, no un error roto.
const faltaLaFuncion = (err) => {
  const codigo = err?.code || '';
  const mensaje = String(err?.message || '');
  return codigo === 'PGRST202' || /could not find the function/i.test(mensaje) || /no existe la función/i.test(mensaje);
};

const fechaCorta = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function AdminsView({ darkMode }) {
  const [admins, setAdmins] = useState(null);
  const [miId, setMiId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [correo, setCorreo] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [quitandoId, setQuitandoId] = useState('');

  const texto = darkMode ? '#E2E8F0' : '#1E293B';
  const suave = darkMode ? '#A1A1A1' : '#64748B';
  const fondo = darkMode ? '#1C1C1C' : '#FFFFFF';
  const borde = darkMode ? '#2A2A2A' : '#E2E8F0';

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('La nube no está configurada.');

      const { data: sesion } = await supabase.auth.getSession();
      setMiId(sesion?.session?.user?.id || '');

      const { data, error: err } = await supabase.rpc(LISTAR);
      if (err) {
        if (faltaLaFuncion(err)) {
          setError('Falta ejecutar el SQL del panel: la función ' + LISTAR + ' todavía no existe en la base.');
          setAdmins(null);
          return;
        }
        throw err;
      }
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || String(e));
      setAdmins(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const otorgar = async (e) => {
    e.preventDefault();
    const limpio = correo.trim();
    if (!limpio) return;
    setGuardando(true);
    setError('');
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('La nube no está configurada.');
      const { error: err } = await supabase.rpc(AGREGAR, { correo: limpio, nota: nota.trim() || null });
      if (err) {
        // El mensaje de la RPC es el que explica el problema (por ejemplo, que no exista
        // ninguna cuenta con ese correo), así que se muestra tal cual.
        if (faltaLaFuncion(err)) {
          setError('Falta ejecutar el SQL del panel: la función ' + AGREGAR + ' todavía no existe en la base.');
        } else {
          setError(err.message || 'No pude otorgar el acceso.');
        }
        return;
      }
      setCorreo('');
      setNota('');
      await showSuccessAlert({ title: 'Acceso otorgado', text: limpio + ' ya puede entrar al CMS.', darkMode });
      await cargar();
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (admin) => {
    const quien = admin.correo || admin.user_id;
    const confirmado = await showConfirmDialog({
      title: '¿Quitar el acceso?',
      text: quien + ' dejará de ver todas las colecciones y el registro de visitas. Su cuenta y su progreso no se tocan.',
      confirmText: 'Sí, quitar',
      cancelText: 'Cancelar',
      darkMode
    });
    if (!confirmado.isConfirmed) return;

    setQuitandoId(admin.user_id);
    setError('');
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('La nube no está configurada.');
      const { error: err } = await supabase.rpc(QUITAR, { uid: admin.user_id });
      if (err) {
        setError(err.message || 'No pude quitar el acceso.');
        return;
      }
      await showSuccessAlert({ title: 'Acceso retirado', text: quien + ' ya no es administrador.', darkMode });
      await cargar();
    } finally {
      setQuitandoId('');
    }
  };

  const campo = {
    padding: '10px 12px', borderRadius: '10px', border: '1px solid ' + borde,
    background: darkMode ? '#141414' : '#F8FAFC', color: texto, fontSize: '0.86rem', outline: 'none'
  };

  return (
    <div style={{ padding: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: texto }}>Administradores</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: suave, maxWidth: '620px', lineHeight: 1.5 }}>
            Un administrador puede ver todas las colecciones y el registro de visitas. La clave del CMS solo abre
            la interfaz: el acceso real lo da esta lista, y se comprueba en el servidor.
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px',
            border: '1px solid ' + borde, background: fondo, color: texto, fontWeight: 700, fontSize: '0.82rem',
            cursor: cargando ? 'default' : 'pointer'
          }}
        >
          <RefreshCw size={15} className={cargando ? 'admin-spin' : ''} />
          <span>{cargando ? 'Leyendo…' : 'Actualizar'}</span>
        </button>
      </div>

      <form onSubmit={otorgar} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '16px', borderRadius: '14px', background: fondo, border: '1px solid ' + borde, marginBottom: '16px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: suave }}>
          CORREO DE LA CUENTA
          <input
            type="email"
            value={correo}
            onChange={(ev) => setCorreo(ev.target.value)}
            placeholder="persona@correo.com"
            style={{ ...campo, minWidth: '240px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: suave }}>
          NOTA (OPCIONAL)
          <input
            type="text"
            value={nota}
            onChange={(ev) => setNota(ev.target.value)}
            placeholder="Para qué le das acceso"
            style={{ ...campo, minWidth: '200px' }}
          />
        </label>
        <button
          type="submit"
          disabled={guardando || !correo.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px',
            border: 'none', background: guardando || !correo.trim() ? (darkMode ? '#262626' : '#CBD5E1') : '#10B981',
            color: guardando || !correo.trim() ? suave : '#04231A', fontWeight: 800, fontSize: '0.84rem',
            cursor: guardando || !correo.trim() ? 'default' : 'pointer'
          }}
        >
          <UserPlus size={16} />
          <span>{guardando ? 'Otorgando…' : 'Otorgar acceso'}</span>
        </button>
      </form>

      {error ? (
        <div style={{ padding: '16px', borderRadius: '14px', background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.3)', color: darkMode ? '#FCA5A5' : '#B91C1C', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>No pude completar la operación.</strong>
          <div style={{ marginTop: '6px' }}>{error}</div>
        </div>
      ) : null}

      {!error && admins ? (
        <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid ' + borde, background: fondo }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ color: suave, textAlign: 'left' }}>
                {['Correo', 'Nota', 'Desde', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', fontWeight: 800, borderBottom: '1px solid ' + borde, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '22px 14px', color: suave, textAlign: 'center' }}>
                    La lista está vacía. Si acabas de montar el panel, métete tú con un INSERT en Supabase.
                  </td>
                </tr>
              ) : admins.map((a) => {
                const soyYo = Boolean(miId) && a.user_id === miId;
                return (
                  <tr key={a.user_id} style={{ color: texto }}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde, fontWeight: 800 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={14} style={{ color: suave }} />
                        {a.correo || '—'}
                        {soyYo ? (
                          <span style={{ padding: '2px 8px', borderRadius: '999px', background: darkMode ? 'rgba(62,207,142,0.15)' : '#DCFCE7', color: darkMode ? '#3ECF8E' : '#166534', fontSize: '0.68rem', fontWeight: 800 }}>
                            TÚ
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde, color: suave }}>{a.nota || '—'}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde, color: suave, whiteSpace: 'nowrap' }}>{fechaCorta(a.created_at)}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde, textAlign: 'right' }}>
                      <button
                        onClick={() => quitar(a)}
                        disabled={soyYo || quitandoId === a.user_id}
                        title={soyYo ? 'No puedes quitarte tu propio acceso' : 'Quitar acceso'}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '9px',
                          border: '1px solid ' + (soyYo ? borde : 'rgba(239,68,68,0.4)'),
                          background: soyYo ? 'transparent' : (darkMode ? 'rgba(239,68,68,0.12)' : '#FEF2F2'),
                          color: soyYo ? suave : (darkMode ? '#FCA5A5' : '#B91C1C'),
                          fontWeight: 700, fontSize: '0.76rem', cursor: soyYo ? 'default' : 'pointer',
                          opacity: quitandoId === a.user_id ? 0.6 : 1
                        }}
                      >
                        <UserMinus size={14} />
                        <span>{quitandoId === a.user_id ? 'Quitando…' : 'Quitar acceso'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!error && cargando && !admins ? (
        <div style={{ padding: '30px', textAlign: 'center', color: suave }}>Leyendo administradores…</div>
      ) : null}

      <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 0', fontSize: '0.78rem', color: suave }}>
        <ShieldCheck size={15} style={{ color: '#10B981', flexShrink: 0 }} />
        Solo cuentas con correo: los invitados anónimos no se pueden añadir, porque no tienen identidad que viaje
        entre dispositivos.
      </p>
    </div>
  );
}
