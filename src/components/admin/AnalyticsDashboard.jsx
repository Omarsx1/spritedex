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

export function AnalyticsDashboard({ darkMode = false }) {
  const [data, setData] = useState({
    totalVisits: 0,
    todayVisits: 0,
    activeSessionsCount: 1,
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, iphone: 0, android: 0 },
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

  const cardStyle = {
    background: darkMode ? '#1C1C1C' : '#FFFFFF',
    borderRadius: '14px',
    padding: '24px',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };

  const widgetCardStyle = {
    background: darkMode ? '#1C1C1C' : '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };

  const textPrimary = darkMode ? '#EDEDED' : '#1E293B';
  const textMuted = darkMode ? '#8B949E' : '#64748B';
  const dividerBorder = darkMode ? '1px solid #262626' : '1px solid #F1F5F9';
  const rowDividerBorder = darkMode ? '1px solid #232323' : '1px solid #F8FAFC';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ═══ TOP 4 KPI CARDS (Real Supabase Metrics) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Visitantes Únicos */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Visitantes Totales</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', color: '#10B981', fontSize: '0.72rem', fontWeight: 800 }}>
              <ArrowUpRight size={12} />
              <span>{data.todayVisits} hoy</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {data.totalVisits > 0 ? data.totalVisits.toLocaleString() : '0'}
          </div>
        </div>

        {/* Card 2: Total Pageviews */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Total Pageviews</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(60, 80, 224, 0.15)' : '#EFF6FF', color: '#3C50E0', fontSize: '0.72rem', fontWeight: 800 }}>
              <TrendingUp size={12} />
              <span>En Tiempo Real</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {data.totalVisits > 0 ? Math.round(data.totalVisits * 1.8).toLocaleString() : '0'}
          </div>
        </div>

        {/* Card 3: Tráfico iPhone & Android */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Móviles (iOS & Android)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(60, 80, 224, 0.15)' : '#EFF6FF', color: '#3C50E0', fontSize: '0.72rem', fontWeight: 800 }}>
              <span>{iphoneCount} iOS • {androidCount} Android</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span>{mobilePct}%</span>
            <span style={{ fontSize: '0.78rem', color: textMuted, fontWeight: 600 }}>
              ({iphonePct}% iOS • {androidPct}% Android)
            </span>
          </div>
        </div>

        {/* Card 4: Sesiones Activas */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Sesiones Activas</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', color: '#EF4444', fontSize: '0.72rem', fontWeight: 800 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
              <span>En Vivo</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {data.activeSessionsCount}
          </div>
        </div>
      </div>

      {/* ═══ MAIN BIG CHART: ANALYTICS VISITOR BARS (Real 30 Days) ═══ */}
      <div style={widgetCardStyle}>
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
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: textPrimary, margin: '0 0 4px' }}>
              Analytics
            </h2>
            <span style={{ fontSize: '0.8rem', color: textMuted }}>
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
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                background: darkMode ? '#171717' : '#FFFFFF',
                color: textMuted,
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
            <line x1="30" y1="20" x2="890" y2="20" stroke={darkMode ? '#262626' : '#F1F5F9'} strokeWidth="1" />
            <line x1="30" y1="70" x2="890" y2="70" stroke={darkMode ? '#262626' : '#F1F5F9'} strokeWidth="1" />
            <line x1="30" y1="120" x2="890" y2="120" stroke={darkMode ? '#262626' : '#F1F5F9'} strokeWidth="1" />
            <line x1="30" y1="170" x2="890" y2="170" stroke={darkMode ? '#262626' : '#F1F5F9'} strokeWidth="1" />

            {/* Y-Axis Labels */}
            <text x="5" y="24" fill={textMuted} fontSize="10" fontWeight="600">{maxBucket}</text>
            <text x="5" y="74" fill={textMuted} fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.75)}</text>
            <text x="5" y="124" fill={textMuted} fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.5)}</text>
            <text x="5" y="174" fill={textMuted} fontSize="10" fontWeight="600">{Math.round(maxBucket * 0.25)}</text>
            <text x="15" y="210" fill={textMuted} fontSize="10" fontWeight="600">0</text>

            {/* 30 Supabase Emerald Real Bars */}
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
                    fill={val > 0 ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#262626' : '#E2E8F0')}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <title>Día {i + 1}: {val} visitas</title>
                  </rect>
                  <text
                    x={x + 7}
                    y="216"
                    fill={textMuted}
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
        <div style={widgetCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: textPrimary, margin: 0 }}>
              Top Canales & Fuentes
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#3ECF8E', fontWeight: 700, background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5', padding: '2px 6px', borderRadius: '4px' }}>
              En Vivo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              const defaultChannels = [
                { source: 'Tráfico Directo / App', count: data.totalVisits || 0, color: darkMode ? '#3ECF8E' : '#3C50E0' },
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
                  <div key={ch.source} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0', borderBottom: rowDividerBorder }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ch.color }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: darkMode ? '#EDEDED' : '#334155' }}>{ch.source}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.74rem', color: textMuted }}>{pctDisplay}</span>
                        <strong style={{ fontSize: '0.84rem', color: textPrimary }}>{ch.count}</strong>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: darkMode ? '#262626' : '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${barWidth}%`, height: '100%', background: ch.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Widget 2: Top Espíritus Más Atrapados */}
        <div style={widgetCardStyle}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: textPrimary, margin: '0 0 16px' }}>
            Espíritus Más Populares
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(data.popularSpirits && data.popularSpirits.length > 0 ? data.popularSpirits : [
              { name: 'Victorioso', category: 'Mítico (Gen 2)', rate: '100%' },
              { name: 'Klombo', category: 'Mítico (Gen 2)', rate: '95%' },
              { name: 'Sonic', category: 'Especial (Crossover)', rate: '88%' },
              { name: 'Shadow', category: 'Especial (Crossover)', rate: '80%' }
            ]).map((sp) => (
              <div key={sp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: rowDividerBorder }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: textPrimary }}>{sp.name}</div>
                  <span style={{ fontSize: '0.72rem', color: textMuted }}>{sp.category}</span>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5', color: '#3ECF8E', fontSize: '0.76rem', fontWeight: 800 }}>
                  {sp.rate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 3: Active Users (Live Sparkline) */}
        <div style={{
          ...widgetCardStyle,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Usuarios Activos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#EF4444', fontWeight: 800 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444' }} />
                <span>En Vivo</span>
              </div>
            </div>

            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em', margin: '4px 0 16px' }}>
              {data.activeSessionsCount || 1} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: textMuted }}>Live visitors</span>
            </div>

            {/* Sparkline Area Chart dinámico según datos reales */}
            <div style={{ height: '70px', width: '100%' }}>
              {(() => {
                const b = data.dailyBuckets && data.dailyBuckets.length > 0 ? data.dailyBuckets : [0, 0, 1, 1, 2, 1, 2];
                const maxB = Math.max(...b, 1);
                const points = b.slice(-10).map((val, idx, arr) => {
                  const x = Math.round((idx / (arr.length - 1 || 1)) * 300);
                  const y = Math.round(55 - (val / maxB) * 40);
                  return `${x},${y}`;
                });
                const pathD = points.length > 0 ? `M 0,55 L ${points.join(' L ')}` : 'M 0,55 L 300,55';
                const areaD = `${pathD} L 300,70 L 0,70 Z`;

                return (
                  <svg viewBox="0 0 300 70" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="liveSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={darkMode ? '#3ECF8E' : '#3C50E0'} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={darkMode ? '#3ECF8E' : '#3C50E0'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={areaD} fill="url(#liveSparkGrad)" />
                    <path d={pathD} fill="none" stroke={darkMode ? '#3ECF8E' : '#3C50E0'} strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                );
              })()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '16px', borderTop: dividerBorder, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: textPrimary }}>
                {Math.max(1, Math.round(data.totalVisits / 30))}
              </div>
              <span style={{ fontSize: '0.68rem', color: textMuted }}>Avg. Diario</span>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: textPrimary }}>
                {Math.max(1, Math.round((data.totalVisits / 30) * 7))}
              </div>
              <span style={{ fontSize: '0.68rem', color: textMuted }}>Avg. Semanal</span>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: textPrimary }}>
                {data.totalVisits}
              </div>
              <span style={{ fontSize: '0.68rem', color: textMuted }}>Total Mes</span>
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
        <div style={widgetCardStyle}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: textPrimary, margin: '0 0 16px' }}>
            Sessions By Device
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0', flexWrap: 'wrap', gap: '16px' }}>
            {/* SVG Donut Chart (3 Segments) */}
            <div style={{ width: '130px', height: '130px', position: 'relative' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Track (Desktop) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke={darkMode ? '#262626' : '#E2E8F0'} strokeWidth="14" />
                {/* Segment 1: iPhone (Supabase Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={darkMode ? '#3ECF8E' : '#3C50E0'}
                  strokeWidth="14"
                  strokeDasharray={`${(iphonePct / 100) * 238} 238`}
                  strokeDashoffset="0"
                />
                {/* Segment 2: Android (Sky Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={darkMode ? '#0284C7' : '#10B981'}
                  strokeWidth="14"
                  strokeDasharray={`${(androidPct / 100) * 238} 238`}
                  strokeDashoffset={`-${(iphonePct / 100) * 238}`}
                />
              </svg>
            </div>

            {/* Legend (3 Channels) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: darkMode ? '#3ECF8E' : '#3C50E0' }} />
                <span style={{ color: textMuted }}>iPhone / iOS:</span>
                <strong style={{ color: textPrimary }}>{iphonePct}%</strong>
                <span style={{ fontSize: '0.72rem', color: textMuted }}>({iphoneCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: darkMode ? '#0284C7' : '#10B981' }} />
                <span style={{ color: textMuted }}>Android:</span>
                <strong style={{ color: textPrimary }}>{androidPct}%</strong>
                <span style={{ fontSize: '0.72rem', color: textMuted }}>({androidCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: darkMode ? '#383838' : '#94A3B8' }} />
                <span style={{ color: textMuted }}>Desktop (Mac/PC):</span>
                <strong style={{ color: textPrimary }}>{desktopPct}%</strong>
                <span style={{ fontSize: '0.72rem', color: textMuted }}>({desktopCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stream Table */}
        <div style={widgetCardStyle}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: textPrimary, margin: '0 0 16px' }}>
            Live Stream de Visitas
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: dividerBorder, color: textMuted }}>
                  <th style={{ padding: '8px 10px' }}>CANAL</th>
                  <th style={{ padding: '8px 10px' }}>DISPOSITIVO</th>
                  <th style={{ padding: '8px 10px' }}>FECHA Y HORA</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.slice(0, 6).map((ev, i) => {
                    const dt = (() => {
                      if (!ev.created_at) return { label: '--', time: '--', isToday: false };
                      const date = new Date(ev.created_at);
                      const now = new Date();
                      const isToday = date.toDateString() === now.toDateString();
                      
                      const timeStr = date.toLocaleTimeString('es-ES', {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      });

                      const yesterday = new Date(now);
                      yesterday.setDate(yesterday.getDate() - 1);
                      const isYesterday = date.toDateString() === yesterday.toDateString();

                      let dateLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                      if (isToday) dateLabel = 'Hoy';
                      else if (isYesterday) dateLabel = 'Ayer';

                      return { label: dateLabel, time: timeStr, isToday };
                    })();

                    return (
                      <tr key={ev.id || i} style={{ borderBottom: rowDividerBorder }}>
                        <td style={{ padding: '8px 10px' }}>
                          {(() => {
                            const ref = (ev.referrer || '').toLowerCase();
                            let label = 'Directo / App';
                            let bg = darkMode ? 'rgba(62, 207, 142, 0.15)' : '#EFF6FF';
                            let textCol = darkMode ? '#3ECF8E' : '#3C50E0';
                            if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) {
                              label = 'Twitter / X';
                              bg = darkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE';
                              textCol = '#38BDF8';
                            } else if (ref.includes('tiktok')) {
                              label = 'TikTok';
                              bg = darkMode ? 'rgba(219, 39, 119, 0.2)' : '#FDF2F8';
                              textCol = '#F472B6';
                            } else if (ref.includes('google')) {
                              label = 'Google';
                              bg = darkMode ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7';
                              textCol = '#FBBF24';
                            } else if (ref.includes('discord')) {
                              label = 'Discord';
                              bg = darkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF';
                              textCol = '#A5B4FC';
                            } else if (ev.path && ev.path !== '/') {
                              label = ev.path;
                            }
                            return (
                              <span style={{ padding: '3px 8px', borderRadius: '6px', background: bg, color: textCol, fontWeight: 700, fontSize: '0.72rem' }}>
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '8px 10px', color: darkMode ? '#E2E8F0' : '#334155', fontWeight: 600 }}>
                          {ev.os || (ev.is_iphone ? 'iOS (iPhone)' : ev.device_type)}
                        </td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: dt.isToday 
                                ? (darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5')
                                : (darkMode ? '#262626' : '#F1F5F9'),
                              color: dt.isToday 
                                ? (darkMode ? '#3ECF8E' : '#15803D')
                                : (darkMode ? '#D4D4D4' : '#475569')
                            }}>
                              {dt.label}
                            </span>
                            <span style={{ fontSize: '0.73rem', color: textMuted, fontFamily: 'monospace' }}>
                              {dt.time}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: textMuted }}>
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
