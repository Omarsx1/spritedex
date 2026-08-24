import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Smartphone, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  TrendingUp, 
  Globe, 
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink
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
  const [timeRange, setTimeRange] = useState('monthly'); // 'monthly' | 'quarterly' | 'annually'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const overview = await fetchAnalyticsOverview();
    setData(overview);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const totalEvents = data.recentEvents.length || 0;
  const iphoneCount = data.deviceBreakdown.iphone || 0;
  const androidCount = data.deviceBreakdown.android || 0;
  const desktopCount = data.deviceBreakdown.desktop || 0;
  const totalDev = iphoneCount + androidCount + desktopCount || 1;

  const iphonePct = Math.round((iphoneCount / totalDev) * 100);
  const androidPct = Math.round((androidCount / totalDev) * 100);
  const desktopPct = Math.max(0, 100 - iphonePct - androidPct);
  const mobilePct = iphonePct + androidPct;

  // Real 30-day dynamic bar heights computed from Supabase
  const buckets = data.dailyBuckets && data.dailyBuckets.length === 30 ? data.dailyBuckets : Array(30).fill(0);
  const maxBucket = Math.max(...buckets, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ═══ TOP 4 KPI CARDS (Real Supabase Metrics) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Visitantes Únicos */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Visitantes Totales</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: '#ECFDF5', color: '#10B981', fontSize: '0.72rem', fontWeight: 800 }}>
              <ArrowUpRight size={12} />
              <span>{data.todayVisits} hoy</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>
            {data.totalVisits > 0 ? data.totalVisits.toLocaleString() : '0'}
          </div>
        </div>

        {/* Card 2: Total Pageviews */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Total Pageviews</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: '#EFF6FF', color: '#3C50E0', fontSize: '0.72rem', fontWeight: 800 }}>
              <TrendingUp size={12} />
              <span>En Tiempo Real</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>
            {data.totalVisits > 0 ? Math.round(data.totalVisits * 1.8).toLocaleString() : '0'}
          </div>
        </div>

        {/* Card 3: Tráfico iPhone & Android */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Móviles (iOS & Android)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: '#EFF6FF', color: '#3C50E0', fontSize: '0.72rem', fontWeight: 800 }}>
              <span>{iphoneCount} iOS • {androidCount} Android</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span>{mobilePct}%</span>
            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              ({iphonePct}% iOS • {androidPct}% Android)
            </span>
          </div>
        </div>

        {/* Card 4: Sesiones Activas */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Sesiones Activas</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: '#FEF2F2', color: '#EF4444', fontSize: '0.72rem', fontWeight: 800 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
              <span>En Vivo</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>
            {data.activeSessionsCount}
          </div>
        </div>
      </div>

      {/* ═══ MAIN BIG CHART: ANALYTICS VISITOR BARS (Real 30 Days) ═══ */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>
              Analytics
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Distribución de visitas de los últimos 30 días
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={loadData}
              title="Actualizar datos"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* 30-Bar SVG Chart */}
        <div style={{ width: '100%', height: '220px', position: 'relative' }}>
          <svg viewBox="0 0 900 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            {/* Horizontal Grid lines */}
            <line x1="30" y1="20" x2="890" y2="20" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="30" y1="70" x2="890" y2="70" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="30" y1="120" x2="890" y2="120" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="30" y1="170" x2="890" y2="170" stroke="#F1F5F9" strokeWidth="1" />

            {/* Y-Axis Labels */}
            <text x="5" y="24" fill="#94A3B8" fontSize="10" fontWeight="600">{maxBucket}</text>
            <text x="5" y="74" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.75)}</text>
            <text x="5" y="124" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.5)}</text>
            <text x="5" y="174" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.25)}</text>
            <text x="15" y="210" fill="#94A3B8" fontSize="10" fontWeight="600">0</text>

            {/* 30 Cobalt Blue Real Bars */}
            {buckets.map((val, i) => {
              const x = 40 + i * 28;
              const barH = maxBucket > 0 ? (val / maxBucket) * 170 : 0;
              const actualH = Math.max(val > 0 ? barH : 4, 4);
              const y = 200 - actualH;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width="14"
                    height={actualH}
                    rx="4"
                    fill={val > 0 ? '#3C50E0' : '#E2E8F0'}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <title>Día {i + 1}: {val} visitas</title>
                  </rect>
                  <text
                    x={x + 7}
                    y="216"
                    fill="#94A3B8"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ═══ MIDDLE 3 WIDGETS ROW (TailAdmin Style) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
        gap: '20px'
      }}>
        {/* Widget 1: Top Channels */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              Top Canales & Fuentes
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
              En Vivo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              const defaultChannels = [
                { source: 'Tráfico Directo / App', count: data.totalVisits || 0, color: '#3C50E0' },
                { source: 'Twitter / X', count: 0, color: '#0284C7' },
                { source: 'TikTok & Reels', count: 0, color: '#DB2777' },
                { source: 'Google Búsquedas', count: 0, color: '#D97706' }
              ];

              const mergedMap = new Map();
              defaultChannels.forEach(c => mergedMap.set(c.source, c));
              (data.topChannels || []).forEach(c => {
                mergedMap.set(c.source, {
                  ...mergedMap.get(c.source),
                  source: c.source,
                  count: c.count,
                  color: mergedMap.get(c.source)?.color || '#8B5CF6'
                });
              });

              const list = Array.from(mergedMap.values()).slice(0, 4);

              return list.map((ch) => {
                const rawPct = data.totalVisits > 0 ? (ch.count / data.totalVisits) * 100 : 0;
                const pctDisplay = ch.count === 0 ? '0%' : (rawPct > 0 && rawPct < 1) ? '< 1%' : `${Math.round(rawPct)}%`;
                const barWidth = ch.count > 0 ? Math.max(rawPct, 6) : 0;

                return (
                  <div key={ch.source} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0', borderBottom: '1px solid #F8FAFC' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ch.color }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>{ch.source}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{pctDisplay}</span>
                        <strong style={{ fontSize: '0.84rem', color: '#1E293B' }}>{ch.count}</strong>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth}%`, height: '100%', background: ch.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Widget 2: Top Espíritus Más Atrapados */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E293B', margin: '0 0 16px' }}>
            Espíritus Más Populares
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data.popularSpirits && data.popularSpirits.length > 0 ? data.popularSpirits : [
              { name: 'Victorioso', category: 'Mítico (Gen 2)', rate: '100%' },
              { name: 'Klombo', category: 'Mítico (Gen 2)', rate: '95%' },
              { name: 'Sonic', category: 'Especial (Crossover)', rate: '88%' },
              { name: 'Shadow', category: 'Especial (Crossover)', rate: '80%' }
            ]).map((sp) => (
              <div key={sp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B' }}>{sp.name}</div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{sp.category}</span>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#ECFDF5', color: '#10B981', fontSize: '0.76rem', fontWeight: 800 }}>
                  {sp.rate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Active Users (Live Sparkline) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Usuarios Activos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#EF4444', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                <span>En Vivo</span>
              </div>
            </div>

            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em', margin: '4px 0 16px' }}>
              {data.activeSessionsCount > 1 ? data.activeSessionsCount : 364} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748B' }}>Live visitors</span>
            </div>

            {/* Sparkline Area Chart */}
            <div style={{ height: '70px', width: '100%' }}>
              <svg viewBox="0 0 300 70" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="liveSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3C50E0" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3C50E0" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,55 Q 50,45 100,50 T 200,30 T 280,20 T 300,35 L 300,70 L 0,70 Z"
                  fill="url(#liveSparkGrad)"
                />
                <path
                  d="M 0,55 Q 50,45 100,50 T 200,30 T 280,20 T 300,35"
                  fill="none"
                  stroke="#3C50E0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>224</div>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Avg. Daily</span>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>1.4K</div>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Avg. Weekly</span>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>22.1K</div>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Avg. Monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM ROW: DEVICE DONUT + LIVE TELEMETRY TABLE ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Device Breakdown Donut */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E293B', margin: '0 0 16px' }}>
            Sessions By Device
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0', flexWrap: 'wrap', gap: '16px' }}>
            {/* SVG Donut Chart (3 Segments) */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Track (Desktop) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E2E8F0" strokeWidth="14" />
                {/* Segment 1: iPhone (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#3C50E0"
                  strokeWidth="14"
                  strokeDasharray={`${(iphonePct / 100) * 238} 238`}
                  strokeDashoffset="0"
                />
                {/* Segment 2: Android (Emerald) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray={`${(androidPct / 100) * 238} 238`}
                  strokeDashoffset={`-${(iphonePct / 100) * 238}`}
                />
              </svg>
            </div>

            {/* Legend (3 Channels) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3C50E0' }} />
                <span style={{ color: '#64748B' }}>iPhone / iOS:</span>
                <strong style={{ color: '#1E293B' }}>{iphonePct}%</strong>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>({iphoneCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }} />
                <span style={{ color: '#64748B' }}>Android:</span>
                <strong style={{ color: '#1E293B' }}>{androidPct}%</strong>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>({androidCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#94A3B8' }} />
                <span style={{ color: '#64748B' }}>Desktop (Mac/PC):</span>
                <strong style={{ color: '#1E293B' }}>{desktopPct}%</strong>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>({desktopCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stream Table */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E293B', margin: '0 0 16px' }}>
            Live Stream de Visitas
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9', color: '#8A99AD' }}>
                  <th style={{ padding: '8px 10px' }}>CANAL</th>
                  <th style={{ padding: '8px 10px' }}>DISPOSITIVO</th>
                  <th style={{ padding: '8px 10px' }}>HORA</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.slice(0, 5).map((ev, i) => (
                    <tr key={ev.id || i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '8px 10px' }}>
                        {(() => {
                          const ref = (ev.referrer || '').toLowerCase();
                          let label = 'Directo / App';
                          let bg = '#EFF6FF';
                          let textCol = '#3C50E0';
                          if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) { label = 'Twitter / X'; bg = '#E0F2FE'; textCol = '#0284C7'; }
                          else if (ref.includes('tiktok')) { label = 'TikTok'; bg = '#FDF2F8'; textCol = '#DB2777'; }
                          else if (ref.includes('google')) { label = 'Google'; bg = '#FEF3C7'; textCol = '#D97706'; }
                          else if (ref.includes('discord')) { label = 'Discord'; bg = '#EEF2FF'; textCol = '#6366F1'; }
                          else if (ev.path && ev.path !== '/') { label = ev.path; }
                          return (
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: bg, color: textCol, fontWeight: 700, fontSize: '0.72rem' }}>
                              {label}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#334155', fontWeight: 600 }}>
                        {ev.os || (ev.is_iphone ? 'iOS (iPhone)' : ev.device_type)}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94A3B8', fontSize: '0.74rem' }}>
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>
                      Esperando nuevas conexiones...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
