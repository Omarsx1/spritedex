import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users, UserCheck, Trophy, UserMinus } from 'lucide-react';
import { getSupabase } from '../../utils/supabase';

// Panorama de usuarios, solo lectura: cuantos son invitados (anonimos), cuantos tienen
// cuenta, y cuantos tienen coleccion de verdad.
//
// Lee la vista `admin_metricas_usuarios`, que vive en la base porque el navegador no
// puede consultar el esquema `auth`. Si la vista todavia no existe, se explica como
// crearla en lugar de fallar en silencio.
const VISTA = 'admin_metricas_usuarios';

export function UserMetricsPanel({ darkMode }) {
  const [filas, setFilas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error('La nube no esta configurada.');
      const { data, error: err } = await supabase.from(VISTA).select('*');
      if (err) throw err;
      setFilas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || String(e));
      setFilas(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const totales = useMemo(() => {
    const base = { total: 0, con_progreso: 0, vacios: 0, activos_1d: 0, activos_7d: 0, activos_30d: 0 };
    return (filas || []).reduce((acc, f) => ({
      total: acc.total + Number(f.total || 0),
      con_progreso: acc.con_progreso + Number(f.con_progreso || 0),
      vacios: acc.vacios + Number(f.vacios || 0),
      activos_1d: acc.activos_1d + Number(f.activos_1d || 0),
      activos_7d: acc.activos_7d + Number(f.activos_7d || 0),
      activos_30d: acc.activos_30d + Number(f.activos_30d || 0)
    }), base);
  }, [filas]);

  const texto = darkMode ? '#E2E8F0' : '#1E293B';
  const suave = darkMode ? '#A1A1A1' : '#64748B';
  const fondo = darkMode ? '#1C1C1C' : '#FFFFFF';
  const borde = darkMode ? '#2A2A2A' : '#E2E8F0';

  const tarjeta = (titulo, valor, detalle, Icono, color) => (
    <div style={{ flex: '1 1 180px', minWidth: '160px', padding: '18px', borderRadius: '14px', background: fondo, border: '1px solid ' + borde }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: suave, fontSize: '0.78rem', fontWeight: 700 }}>
        <Icono size={16} style={{ color }} />
        <span>{titulo}</span>
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: texto, marginTop: '6px', lineHeight: 1.1 }}>{valor}</div>
      {detalle ? <div style={{ fontSize: '0.76rem', color: suave, marginTop: '4px' }}>{detalle}</div> : null}
    </div>
  );

  return (
    <div style={{ padding: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: texto }}>Usuarios reales</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: suave }}>
            Invitados y cuentas, con y sin colección. Los vacíos son visitantes que entraron una vez y no marcaron nada.
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

      {error ? (
        <div style={{ padding: '18px', borderRadius: '14px', background: darkMode ? 'rgba(239,68,68,0.08)' : '#FEF2F2', border: '1px solid rgba(239,68,68,0.3)', color: darkMode ? '#FCA5A5' : '#B91C1C', fontSize: '0.86rem', lineHeight: 1.6 }}>
          <strong>No pude leer las métricas.</strong>
          <div style={{ marginTop: '6px' }}>{error}</div>
          <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>
            Si dice que la relación no existe, falta crear la vista <code>{VISTA}</code> en Supabase (SQL Editor).
          </div>
        </div>
      ) : null}

      {!error && filas ? (
        <>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {tarjeta('Invitados', totales.total - (filas.find((f) => f.tipo === 'con_cuenta')?.total || 0), 'sin registrarse', UserMinus, '#A855F7')}
            {tarjeta('Con cuenta', filas.find((f) => f.tipo === 'con_cuenta')?.total || 0, 'Google o correo', UserCheck, '#10B981')}
            {tarjeta('Con colección', totales.con_progreso, 'marcaron al menos uno', Trophy, '#EAB308')}
            {tarjeta('Vacíos', totales.vacios, 'no marcaron nada', Users, suave)}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid ' + borde, background: fondo }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ color: suave, textAlign: 'left' }}>
                  {['Tipo', 'Total', 'Con colección', 'Vacíos', 'Activos 24 h', 'Activos 7 días', 'Activos 30 días'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', fontWeight: 800, borderBottom: '1px solid ' + borde, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.tipo} style={{ color: texto }}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde, fontWeight: 800 }}>
                      {f.tipo === 'anonimo' ? 'Invitado (anónimo)' : 'Con cuenta'}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.total}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.con_progreso}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.vacios}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.activos_1d}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.activos_7d}</td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + borde }}>{f.activos_30d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {!error && cargando && !filas ? (
        <div style={{ padding: '30px', textAlign: 'center', color: suave }}>Leyendo métricas…</div>
      ) : null}
    </div>
  );
}

