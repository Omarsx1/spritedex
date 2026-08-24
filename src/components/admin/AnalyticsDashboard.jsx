import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Smartphone, 
  Monitor, 
  Globe, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  Compass
} from 'lucide-react';
import { fetchAnalyticsOverview } from '../../utils/telemetry';

export function AnalyticsDashboard() {
  const [data, setData] = useState({
    totalVisits: 0,
    todayVisits: 0,
    activeSessionsCount: 1,
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, iphone: 0 },
    browserBreakdown: {},
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadData = async () => {
    setLoading(true);
    const overview = await fetchAnalyticsOverview();
    setData(overview);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const totalEvents = data.recentEvents.length || 1;
  const mobilePct = Math.round(((data.deviceBreakdown.mobile || 0) / totalEvents) * 100);
  const desktopPct = Math.round(((data.deviceBreakdown.desktop || 0) / totalEvents) * 100);
  const iphoneCount = data.deviceBreakdown.iphone || 0;
  const iphonePct = Math.round((iphoneCount / totalEvents) * 100);

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Header controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={22} style={{ color: '#00F0E8' }} />
            <span>Monitoreo & Telemetría en Tiempo Real</span>
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
            Última sincronización: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '9px',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            color: '#00F0E8',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
          <span>{loading ? 'Actualizando...' : 'Actualizar Métricas'}</span>
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Total Visits */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Visitas Totales
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.15)', color: '#00F0E8' }}>
              <Eye size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {data.totalVisits.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
            Histórico registrado en la base de datos
          </span>
        </div>

        {/* Card 2: Today Visits */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Visitas Hoy
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {data.todayVisits.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600 }}>
            Tráfico en las últimas 24 horas
          </span>
        </div>

        {/* Card 3: Live Pulse */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sesiones Activas
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 900 }}>EN VIVO</span>
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {data.activeSessionsCount}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>
            Usuarios navegando en tiempo real
          </span>
        </div>

        {/* Card 4: iPhone Dominance */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(251, 146, 60, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tráfico iPhone / iOS
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c' }}>
              <Smartphone size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {iphonePct}%
          </div>
          <span style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 600 }}>
            {iphoneCount} sesiones desde iPhone / Safari
          </span>
        </div>
      </div>

      {/* Middle Row: Device Ratio & Browsers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Device Breakdown */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '22px'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: '0 0 16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={18} style={{ color: '#00F0E8' }} />
            <span>Dispositivos de los Usuarios</span>
          </h3>

          {/* Progress bar */}
          <div style={{
            height: '14px',
            borderRadius: '8px',
            background: 'rgba(2, 6, 23, 0.8)',
            display: 'flex',
            overflow: 'hidden',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ width: `${mobilePct || 50}%`, background: 'linear-gradient(90deg, #00F0E8, #0284c7)', transition: 'width 0.5s ease' }} title={`Móvil: ${mobilePct}%`} />
            <div style={{ width: `${desktopPct || 50}%`, background: 'linear-gradient(90deg, #a855f7, #ec4899)', transition: 'width 0.5s ease' }} title={`Desktop: ${desktopPct}%`} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#00F0E8' }} />
              <span style={{ color: '#94a3b8' }}>Móvil / Tablet:</span>
              <strong style={{ color: '#f8fafc' }}>{mobilePct}%</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#a855f7' }} />
              <span style={{ color: '#94a3b8' }}>Escritorio / PC:</span>
              <strong style={{ color: '#f8fafc' }}>{desktopPct}%</strong>
            </div>
          </div>
        </div>

        {/* Operating Systems & Browsers */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '22px'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: '0 0 16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: '#c084fc' }} />
            <span>Navegadores Detectados</span>
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.entries(data.browserBreakdown).length > 0 ? (
              Object.entries(data.browserBreakdown).map(([browser, count]) => (
                <div key={browser} style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>{browser}</span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(0, 240, 255, 0.15)', color: '#00F0E8', fontWeight: 900 }}>
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Recopilando datos de navegación...</span>
            )}
          </div>
        </div>
      </div>

      {/* Live Stream Table */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        padding: '22px',
        overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 900, margin: '0 0 16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} style={{ color: '#4ade80' }} />
          <span>Registro de Actividad en Tiempo Real (Live Stream)</span>
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                <th style={{ padding: '10px 12px' }}>EVENTO</th>
                <th style={{ padding: '10px 12px' }}>DISPOSITIVO / OS</th>
                <th style={{ padding: '10px 12px' }}>NAVEGADOR</th>
                <th style={{ padding: '10px 12px' }}>FECHA & HORA</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents && data.recentEvents.length > 0 ? (
                data.recentEvents.slice(0, 15).map((ev, i) => (
                  <tr key={ev.id || i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0, 240, 255, 0.12)',
                        color: '#00F0E8',
                        fontWeight: 800,
                        fontSize: '0.72rem'
                      }}>
                        {ev.event_type || 'pageview'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 600 }}>
                      {ev.os || (ev.is_iphone ? 'iOS (iPhone)' : ev.device_type)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      {ev.browser || 'Safari/Chrome'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.74rem' }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Esperando primeras visitas para transmitir en vivo...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
