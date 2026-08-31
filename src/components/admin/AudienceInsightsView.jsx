import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Globe, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  Layers, 
  Activity, 
  ArrowUpRight, 
  ShieldCheck, 
  Compass, 
  Tablet, 
  Calendar,
  Zap,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { resolveCountry, setIgnoreTelemetry } from '../../utils/telemetry';
import { showConfirmDialog, showSuccessAlert } from '../../utils/alert';

const AppleIcon = ({ size = 15, color = 'currentColor', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 814 1000"
    xmlSpace="preserve"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path
      fill={color}
      d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
    />
  </svg>
);

const WindowsIcon = ({ size = 14, color = '#00adef', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 88 88"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <rect x="1" y="1" width="41" height="41" fill={color} />
    <rect x="46" y="1" width="41" height="41" fill={color} />
    <rect x="1" y="46" width="41" height="41" fill={color} />
    <rect x="46" y="46" width="41" height="41" fill={color} />
  </svg>
);

const AndroidIcon = ({ size = 14, color = '#34A853', style = {} }) => (
  <svg
    width={size}
    height={size}
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 150"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
  >
    <path
      fill={color}
      d="M255.285 143.47c-.084-.524-.164-1.042-.251-1.56a128.119 128.119 0 0 0-12.794-38.288 128.778 128.778 0 0 0-23.45-31.86 129.166 129.166 0 0 0-22.713-18.005c.049-.08.09-.168.14-.25 2.582-4.461 5.172-8.917 7.755-13.38l7.576-13.068c1.818-3.126 3.632-6.26 5.438-9.386a11.776 11.776 0 0 0 .662-10.484 11.668 11.668 0 0 0-4.823-5.536 11.85 11.85 0 0 0-5.004-1.61 11.963 11.963 0 0 0-2.218.018 11.738 11.738 0 0 0-8.968 5.798c-1.814 3.127-3.628 6.26-5.438 9.386l-7.576 13.069c-2.583 4.462-5.173 8.918-7.755 13.38-.282.487-.567.973-.848 1.467-.392-.157-.78-.313-1.172-.462-14.24-5.43-29.688-8.4-45.836-8.4-.442 0-.879 0-1.324.006-14.357.143-28.152 2.64-41.022 7.12a119.434 119.434 0 0 0-4.42 1.642c-.262-.455-.532-.911-.79-1.367-2.583-4.462-5.173-8.918-7.755-13.38L65.123 15.25c-1.818-3.126-3.632-6.259-5.439-9.386A11.736 11.736 0 0 0 48.5.048 11.71 11.71 0 0 0 43.49 1.66a11.716 11.716 0 0 0-4.077 4.063c-.281.474-.532.967-.742 1.473a11.808 11.808 0 0 0-.365 8.188c.259.786.594 1.554 1.023 2.296a3973.32 3973.32 0 0 1 5.439 9.386c2.53 4.357 5.054 8.713 7.58 13.069 2.582 4.462 5.168 8.918 7.75 13.38.02.038.046.075.065.112A129.184 129.184 0 0 0 45.32 64.38a129.693 129.693 0 0 0-22.2 24.015 127.737 127.737 0 0 0-9.34 15.24 128.238 128.238 0 0 0-10.843 28.764 130.743 130.743 0 0 0-1.951 9.524c-.087.518-.167 1.042-.247 1.56A124.978 124.978 0 0 0 0 149.118h256c-.205-1.891-.449-3.77-.734-5.636l.019-.012Z"
    />
    <path
      fill="#202124"
      d="M194.59 113.712c5.122-3.41 5.867-11.3 1.661-17.62-4.203-6.323-11.763-8.682-16.883-5.273-5.122 3.41-5.868 11.3-1.662 17.621 4.203 6.322 11.764 8.682 16.883 5.272ZM78.518 108.462c4.206-6.321 3.46-14.21-1.662-17.62-5.123-3.41-12.68-1.05-16.886 5.27-4.203 6.323-3.458 14.212 1.662 17.622 5.122 3.41 12.683 1.05 16.886-5.272Z"
    />
  </svg>
);

// Helper para identificar exclusivamente sesiones de la Mac del desarrollador/administrador
const isMacOrAdminEvent = (ev) => {
  if (!ev) return false;
  const os = (ev.os || '').toLowerCase();
  const ref = (ev.referrer || '').toLowerCase();
  const path = (ev.path || '').toLowerCase();

  // Si el canal de acceso fue explícitamente el portal de administración/estudio
  if (ref.includes('studio-override') || ref.includes('nexus') || path.includes('studio') || path.includes('override')) {
    return true;
  }

  // Si es un dispositivo Mac del administrador
  if (os.includes('mac') || os.includes('darwin')) {
    return true;
  }

  return false;
};

export function AudienceInsightsView({ darkMode = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month'
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all' | 'mobile' | 'desktop'
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // 15 | 25 | 50 | 100 | 'all'

  const loadAudienceData = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        // Fetch up to 2500 recent analytics events for complete historical date analysis
        const { data: rawEvents, error } = await supabase
          .from('analytics_events')
          .select('id, session_id, device_type, browser, os, is_iphone, referrer, path, created_at')
          .order('created_at', { ascending: false })
          .limit(2500);

        if (error) {
          console.error('Error loading analytics events for audience:', error);
        }

        if (rawEvents && rawEvents.length > 0) {
          setEvents(rawEvents);
        } else {
          setEvents([]);
        }
      }
    } catch (err) {
      console.error('Audience data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIgnoreTelemetry(true);
    loadAudienceData();

    // 1. WebSocket en tiempo real para eventos de audiencia
    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel('realtime_audience_insights')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'analytics_events' },
          () => {
            loadAudienceData();
          }
        )
        .subscribe();
    }

    // 2. Intervalo de respaldo periódico cada 30 segundos
    const interval = setInterval(loadAudienceData, 30000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, deviceFilter, tableSearch, pageSize]);

  // Filter events based on time and device filters
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    return events.filter((ev) => {
      const evDate = new Date(ev.created_at);
      const evTime = evDate.getTime();

      // Extra guard: Exclude any admin portal access
      if (isMacOrAdminEvent(ev)) {
        return false;
      }

      // Time filter
      if (timeFilter === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (evTime < todayStart) return false;
      } else if (timeFilter === 'yesterday') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
        if (evTime < yesterdayStart || evTime >= todayStart) return false;
      } else if (timeFilter === 'week') {
        if (nowMs - evTime > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (timeFilter === 'month') {
        if (nowMs - evTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      // Device filter
      const os = (ev.os || '').toLowerCase();
      const isMob = ev.is_iphone || os.includes('ios') || os.includes('iphone') || os.includes('android') || ev.device_type === 'mobile';
      if (deviceFilter === 'mobile' && !isMob) return false;
      if (deviceFilter === 'desktop' && isMob) return false;

      // Table text search
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const country = resolveCountry(ev.referrer || ev.country || ev.country_code, ev.timezone);
        const matchCountry = country.name.toLowerCase().includes(q) || (country.code || '').toLowerCase().includes(q);
        const matchOS = (ev.os || '').toLowerCase().includes(q);
        const matchBrowser = (ev.browser || '').toLowerCase().includes(q);
        const matchRef = (ev.referrer || '').toLowerCase().includes(q);
        const matchPath = (ev.path || '').toLowerCase().includes(q);
        const matchDate = evDate.toLocaleDateString('es-ES').toLowerCase().includes(q);

        if (!matchCountry && !matchOS && !matchBrowser && !matchRef && !matchPath && !matchDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, timeFilter, deviceFilter, tableSearch]);

  // Aggregate Metrics & Device Breakdown
  const analytics = useMemo(() => {
    const total = filteredEvents.length || 0;
    let iphone = 0;
    let android = 0;
    let mac = 0;
    let windows = 0;
    let linux = 0;
    let tablet = 0;
    let otherDevice = 0;

    const browserMap = {};
    const countryMap = {};
    const hourHistogram = Array(24).fill(0);

    filteredEvents.forEach((ev) => {
      const os = (ev.os || '').toLowerCase();
      const devType = ev.device_type || '';

      // OS Breakdown
      if (ev.is_iphone || os.includes('ios') || os.includes('iphone')) {
        iphone++;
      } else if (os.includes('android')) {
        android++;
      } else if (os.includes('mac') || os.includes('darwin')) {
        mac++;
      } else if (os.includes('win')) {
        windows++;
      } else if (os.includes('linux')) {
        linux++;
      } else if (os.includes('ipad') || devType === 'tablet') {
        tablet++;
      } else {
        otherDevice++;
      }

      // Browser breakdown
      const br = ev.browser || 'Chrome';
      browserMap[br] = (browserMap[br] || 0) + 1;

      // Country / Location resolution from embedded geo tag, country column or timezone
      const resolved = resolveCountry(ev.referrer || ev.country || ev.country_code, ev.timezone);
      const cKey = resolved.name;
      if (!countryMap[cKey]) {
        countryMap[cKey] = {
          name: resolved.name,
          code: resolved.code,
          flag: resolved.flag,
          count: 0
        };
      }
      countryMap[cKey].count++;

      // Hour of day (0..23)
      if (ev.created_at) {
        const evDate = new Date(ev.created_at);
        const hour = evDate.getHours();
        hourHistogram[hour] = (hourHistogram[hour] || 0) + 1;
      }
    });

    const totalMobile = iphone + android + tablet;
    const totalDesktop = mac + windows + linux + otherDevice;
    const mobilePct = total > 0 ? Math.round((totalMobile / total) * 100) : 0;
    const desktopPct = total > 0 ? Math.max(0, 100 - mobilePct) : 0;

    // Peak Hour calculation
    let maxHourCount = 0;
    let peakHour = 0;
    hourHistogram.forEach((count, hour) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        peakHour = hour;
      }
    });

    const formatHourDisplay = (h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formatted = h % 12 === 0 ? 12 : h % 12;
      return `${formatted}:00 ${ampm}`;
    };

    // Sort Top Countries
    const topCountries = Object.values(countryMap)
      .sort((a, b) => b.count - a.count);

    // Sort Browsers
    const topBrowsers = Object.entries(browserMap)
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      mobilePct,
      desktopPct,
      totalMobile,
      totalDesktop,
      iphone,
      android,
      mac,
      windows,
      linux,
      tablet,
      peakHourDisplay: formatHourDisplay(peakHour),
      peakHourCount: maxHourCount,
      hourHistogram,
      topCountries,
      topBrowsers
    };
  }, [filteredEvents]);

  // Color theme variables (Enterprise High Contrast WCAG 2.2 Compliant)
  const c = {
    bgCard: darkMode ? '#171717' : '#FFFFFF',
    borderCard: darkMode ? '#262626' : '#E2E8F0',
    bgInput: darkMode ? '#141414' : '#F8FAFC',
    borderInput: darkMode ? '#2E2E2E' : '#CBD5E1',
    textPrimary: darkMode ? '#EDEDED' : '#0F172A',
    textSecondary: darkMode ? '#A1A1A1' : '#475569',
    textMuted: darkMode ? '#737373' : '#64748B',
    tableHeaderBg: darkMode ? '#121212' : '#F8FAFC',
    rowBorder: darkMode ? '#222222' : '#F1F5F9',
    badgeGreenBg: darkMode ? 'rgba(62, 207, 142, 0.12)' : '#F0FDF4',
    badgeGreenBorder: darkMode ? 'rgba(62, 207, 142, 0.25)' : '#DCFCE7',
    badgeGreenText: darkMode ? '#3ECF8E' : '#15803D',
    barTrack: darkMode ? '#262626' : '#E2E8F0',
    barFillBlue: darkMode ? '#38BDF8' : '#2563EB',
    barFillGreen: darkMode ? '#3ECF8E' : '#10B981',
    barFillPurple: darkMode ? '#A855F7' : '#7C3AED'
  };

  const cardStyle = {
    background: c.bgCard,
    borderRadius: '12px',
    padding: '20px 22px',
    border: `1px solid ${c.borderCard}`,
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease'
  };

  const widgetCardStyle = {
    background: c.bgCard,
    borderRadius: '14px',
    padding: '22px 24px',
    border: `1px solid ${c.borderCard}`,
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)'
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    background: c.bgInput,
    border: `1px solid ${c.borderInput}`,
    color: c.textPrimary,
    fontSize: '0.8rem',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer'
  };

  const maxHourVal = Math.max(...analytics.hourHistogram, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ═══ TOP CONTROL & TIME RANGE FILTER BAR ═══ */}
      <div style={{
        ...cardStyle,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#EFF6FF',
            color: darkMode ? '#3ECF8E' : '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: c.textPrimary, margin: 0 }}>
              Audiencia, Dispositivos & Geografía
            </h2>
            <p style={{ fontSize: '0.74rem', color: c.textSecondary, margin: 0 }}>
              Análisis en tiempo real de plataformas, horas pico de tráfico y distribución de visitas.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={inputStyle}
            title="Filtrar por Período de Tiempo"
          >
            <option value="all">Todo el Histórico</option>
            <option value="week">Últimos 7 Días</option>
            <option value="today">Solo Hoy</option>
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            style={inputStyle}
            title="Filtrar por Tipo de Dispositivo"
          >
            <option value="all">Todos los Dispositivos</option>
            <option value="mobile">Solo Móviles</option>
            <option value="desktop">Solo Escritorio</option>
          </select>

          <button
            type="button"
            onClick={loadAudienceData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: darkMode ? '#1F1F1F' : '#FFFFFF',
              border: `1px solid ${c.borderCard}`,
              color: c.textPrimary,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* ═══ TOP 4 AUDIENCE KPI CARDS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Mobile vs Desktop */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Móviles vs Desktop</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: c.badgeGreenBg, border: `1px solid ${c.badgeGreenBorder}`, color: c.badgeGreenText, fontSize: '0.72rem', fontWeight: 700 }}>
              <Smartphone size={12} />
              <span>{analytics.mobilePct}% Móvil</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {analytics.totalMobile} <span style={{ fontSize: '1rem', fontWeight: 600, color: c.textMuted }}>/ {analytics.totalDesktop} PC</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: c.barTrack, borderRadius: '3px', marginTop: '10px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${analytics.mobilePct}%`, background: c.barFillBlue, height: '100%' }} />
            <div style={{ width: `${analytics.desktopPct}%`, background: darkMode ? '#525252' : '#94A3B8', height: '100%' }} />
          </div>
        </div>

        {/* KPI 2: Unique Countries */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Países & Regiones</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: darkMode ? 'rgba(56, 189, 248, 0.12)' : '#EFF6FF', border: `1px solid ${darkMode ? 'rgba(56, 189, 248, 0.25)' : '#BFDBFE'}`, color: darkMode ? '#38BDF8' : '#1E40AF', fontSize: '0.72rem', fontWeight: 700 }}>
              <Globe size={12} />
              <span>Internacional</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {analytics.topCountries.length}{' '}
            <span style={{ fontSize: '1.1rem' }}>
              {analytics.topCountries.slice(0, 3).map(ct => ct.flag).join(' ')}
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '8px' }}>
            Top: {analytics.topCountries[0]?.name || 'Detectando...'} ({analytics.topCountries[0]?.count || 0} visitas)
          </div>
        </div>

        {/* KPI 3: Peak Traffic Hour */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Hora Pico de Mayor Tráfico</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: darkMode ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7', border: `1px solid ${darkMode ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A'}`, color: '#D97706', fontSize: '0.72rem', fontWeight: 700 }}>
              <Clock size={12} />
              <span>Punta</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {analytics.peakHourDisplay}
          </div>
          <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '8px' }}>
            Concentra {analytics.peakHourCount} sesiones registradas
          </div>
        </div>

        {/* KPI 4: Top Browser */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Navegador Principal</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: darkMode ? 'rgba(168, 85, 247, 0.12)' : '#F5F3FF', border: `1px solid ${darkMode ? 'rgba(168, 85, 247, 0.25)' : '#DDD6FE'}`, color: darkMode ? '#A855F7' : '#6D28D9', fontSize: '0.72rem', fontWeight: 700 }}>
              <Compass size={12} />
              <span>Web / App</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {analytics.topBrowsers[0]?.name || 'Chrome'}
          </div>
          <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '8px' }}>
            {analytics.topBrowsers[0]?.pct || 0}% de los navegadores detectados
          </div>
        </div>
      </div>

      {/* ═══ 24-HOUR HOURLY DISTRIBUTION HEATMAP & BAR CHART ═══ */}
      <div style={widgetCardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: c.textPrimary, margin: 0 }}>
              Distribución de Tráfico por Horas del Día (00:00 a 23:00)
            </h3>
            <p style={{ fontSize: '0.74rem', color: c.textSecondary, margin: '2px 0 0' }}>
              Identifica a qué horas tus entrenadores están más activos jugando y sincronizando espíritus.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: c.textSecondary }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: c.barFillBlue }} />
            <span>Mayor afluencia de visitas</span>
          </div>
        </div>

        {/* 24-Hour Bar Graph */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(24, 1fr)',
          gap: '4px',
          height: '110px',
          alignItems: 'flex-end',
          padding: '10px 0',
          borderBottom: `1px solid ${c.borderCard}`
        }}>
          {analytics.hourHistogram.map((count, hour) => {
            const heightPct = Math.max(8, Math.round((count / maxHourVal) * 100));
            const isPeak = count === analytics.peakHourCount && count > 0;

            return (
              <div
                key={hour}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative'
                }}
                title={`Hora: ${hour}:00 - ${count} visitas`}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${heightPct}%`,
                    borderRadius: '3px 3px 0 0',
                    background: isPeak 
                      ? (darkMode ? '#3ECF8E' : '#0F172A')
                      : count > 0 ? c.barFillBlue : (darkMode ? '#222222' : '#F1F5F9'),
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 24-Hour Legend Labels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(24, 1fr)',
          gap: '4px',
          marginTop: '6px',
          fontSize: '0.64rem',
          color: c.textMuted,
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          {Array.from({ length: 24 }).map((_, h) => (
            <span key={h}>{h % 3 === 0 ? `${h}h` : ''}</span>
          ))}
        </div>
      </div>

      {/* ═══ 2-COLUMN GRID: DETAILED PLATFORMS & TOP COUNTRIES ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* Column 1: Detailed Operating Systems & Platforms */}
        <div style={widgetCardStyle}>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: c.textPrimary, margin: '0 0 16px' }}>
            Desglose de Dispositivos y Sistemas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* iOS (iPhone) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AppleIcon size={14} color={c.textPrimary} /> iOS (iPhone)
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.iphone} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.iphone / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.iphone / analytics.total) * 100 : 0}%`, height: '100%', background: '#38BDF8', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Android */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AndroidIcon size={14} color="#34A853" /> Android Mobile
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.android} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.android / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.android / analytics.total) * 100 : 0}%`, height: '100%', background: '#34A853', borderRadius: '3px' }} />
              </div>
            </div>

            {/* macOS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AppleIcon size={14} color={c.textPrimary} /> Apple Mac (macOS)
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.mac} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.mac / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.mac / analytics.total) * 100 : 0}%`, height: '100%', background: '#818CF8', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Windows */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <WindowsIcon size={14} color="#00adef" /> Microsoft Windows PC
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.windows} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.windows / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.windows / analytics.total) * 100 : 0}%`, height: '100%', background: '#00adef', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Geographic Distribution (Países) */}
        <div style={widgetCardStyle}>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: c.textPrimary, margin: '0 0 16px' }}>
            Distribución Geográfica (Top Países)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analytics.topCountries.length > 0 ? (
              analytics.topCountries.slice(0, 5).map((country, idx) => {
                const pct = analytics.total > 0 ? Math.round((country.count / analytics.total) * 100) : 0;

                return (
                  <div key={country.code || idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem' }}>{country.flag}</span>
                        <span>{country.name}</span>
                      </span>
                      <span style={{ fontWeight: 800, color: c.textPrimary }}>
                        {country.count} visitas <span style={{ color: c.textMuted, fontWeight: 500 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: country.code === 'GL' ? (darkMode ? '#525252' : '#94A3B8') : c.barFillBlue, borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: c.textSecondary, fontSize: '0.8rem', textAlign: 'center', padding: '24px 0' }}>
                Cargando métricas de ubicación geográfica...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LIVE CONNECTIONS STREAM (Real Time Table & Historical Pagination) ═══ */}
      <div style={{ ...widgetCardStyle, overflow: 'hidden', padding: 0 }}>
        {/* Table Header & Controls Bar */}
        <div style={{
          padding: '18px 22px',
          borderBottom: `1px solid ${c.borderCard}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: c.textPrimary, margin: 0 }}>
                  Registro de Conexiones en Vivo y Fechas Históricas
                </h3>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: darkMode ? '#262626' : '#F1F5F9',
                  color: c.textSecondary,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {filteredEvents.length} registros
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: c.textSecondary, margin: '2px 0 0' }}>
                Historial completo de sesiones por dispositivo, país, canal de origen y fecha exacta.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: c.badgeGreenBg,
                border: `1px solid ${c.badgeGreenBorder}`,
                color: c.badgeGreenText,
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.badgeGreenText }} />
                <span>En Tiempo Real</span>
              </span>

              {/* Toggle Exclude My Device */}
              <button
                type="button"
                onClick={() => {
                  const headers = ['País', 'Código País', 'Dispositivo/SO', 'Navegador', 'Canal de Origen', 'Fecha ISO', 'Fecha Local', 'Hora'];
                  const rows = filteredEvents.map((ev) => {
                    const country = resolveCountry(ev.referrer || ev.country || ev.country_code, ev.timezone);
                    const d = ev.created_at ? new Date(ev.created_at) : new Date();
                    return [
                      `"${country.name}"`,
                      `"${country.code || ''}"`,
                      `"${ev.os || (ev.is_iphone ? 'iOS' : ev.device_type)}"`,
                      `"${ev.browser || 'Chrome'}"`,
                      `"${(ev.referrer || ev.path || 'Directo').replace(/"/g, '""')}"`,
                      `"${d.toISOString()}"`,
                      `"${d.toLocaleDateString('es-ES')}"`,
                      `"${d.toLocaleTimeString('es-ES')}"`
                    ];
                  });
                  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                  const encodedUri = encodeURI(csv);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute('download', `conexiones_spritedex_${new Date().toISOString().slice(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${c.borderCard}`,
                  background: darkMode ? '#262626' : '#FFFFFF',
                  color: c.textPrimary,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: `1px solid ${c.rowBorder}`
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Buscar por País, SO, Navegador o Canal..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  border: `1px solid ${c.borderCard}`,
                  background: darkMode ? '#171717' : '#F8FAFC',
                  color: c.textPrimary,
                  fontSize: '0.78rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Date Filters Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.textSecondary, marginRight: '4px' }}>
                Filtrar Fecha:
              </span>
              {[
                { id: 'all', label: 'Histórico Completo' },
                { id: 'today', label: 'Hoy' },
                { id: 'yesterday', label: 'Ayer' },
                { id: 'week', label: 'Últimos 7 días' },
                { id: 'month', label: 'Últimos 30 días' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTimeFilter(f.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: timeFilter === f.id ? `1px solid ${darkMode ? '#3ECF8E' : '#0F172A'}` : `1px solid ${c.borderCard}`,
                    background: timeFilter === f.id ? (darkMode ? '#3ECF8E' : '#0F172A') : (darkMode ? '#171717' : '#F8FAFC'),
                    color: timeFilter === f.id ? (darkMode ? '#000000' : '#FFFFFF') : c.textSecondary,
                    fontSize: '0.72rem',
                    fontWeight: timeFilter === f.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Rows per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: c.textSecondary }}>Filas:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${c.borderCard}`,
                  background: darkMode ? '#171717' : '#F8FAFC',
                  color: c.textPrimary,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.borderCard}`, color: c.textSecondary, background: c.tableHeaderBg }}>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>PAÍS / REGIÓN</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>DISPOSITIVO & SISTEMA</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>NAVEGADOR</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>CANAL DE ORIGEN</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em', textAlign: 'right' }}>FECHA Y HORA</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalRows = filteredEvents.length;
                if (totalRows === 0) {
                  return (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: c.textSecondary }}>
                        {loading ? 'Cargando sesiones de telemetría...' : 'No se encontraron visitas con los filtros seleccionados.'}
                      </td>
                    </tr>
                  );
                }

                const rowsToShow = pageSize === 'all'
                  ? filteredEvents
                  : filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

                return rowsToShow.map((ev, idx) => {
                  const country = resolveCountry(ev.referrer || ev.country || ev.country_code, ev.timezone);

                  const dt = (() => {
                    if (!ev.created_at) return { label: '--', time: '--', isToday: false, isYesterday: false };
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

                    let dateLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                    if (isToday) dateLabel = 'Hoy';
                    else if (isYesterday) dateLabel = 'Ayer';

                    return { label: dateLabel, time: timeStr, isToday, isYesterday };
                  })();

                  // Channel attribution (strip [geo:XX])
                  let ch = 'Directo / App';
                  let chBg = darkMode ? 'rgba(62, 207, 142, 0.15)' : '#EFF6FF';
                  let chText = darkMode ? '#3ECF8E' : '#2563EB';

                  const rawRef = ev.referrer || '';
                  const ref = rawRef.replace(/\[geo:[A-Z]{2}\]/gi, '').trim().toLowerCase();
                  if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) {
                    ch = 'Twitter / X';
                    chBg = darkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE';
                    chText = '#0284C7';
                  } else if (ref.includes('tiktok')) {
                    ch = 'TikTok';
                    chBg = darkMode ? 'rgba(219, 39, 119, 0.2)' : '#FDF2F8';
                    chText = '#DB2777';
                  } else if (ref.includes('google')) {
                    ch = 'Google';
                    chBg = darkMode ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7';
                    chText = '#D97706';
                  } else if (ev.path && ev.path !== '/') {
                    ch = ev.path;
                  }

                  return (
                    <tr key={ev.id || idx} style={{ borderBottom: `1px solid ${c.rowBorder}`, transition: 'background 0.15s ease' }}>
                      {/* Country with Flag */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.15rem' }}>{country.flag}</span>
                          <span style={{ fontWeight: 700, color: c.textPrimary }}>{country.name}</span>
                        </div>
                      </td>

                      {/* Device & OS */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ fontWeight: 600, color: c.textPrimary }}>
                          {ev.os || (ev.is_iphone ? 'iOS (iPhone)' : ev.device_type || 'Desktop')}
                        </span>
                      </td>

                      {/* Browser */}
                      <td style={{ padding: '12px 18px', color: c.textSecondary }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: darkMode ? '#222222' : '#F1F5F9',
                          border: `1px solid ${c.borderCard}`,
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          {ev.browser || 'Chrome'}
                        </span>
                      </td>

                      {/* Channel */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: chBg, color: chText, fontWeight: 700, fontSize: '0.72rem' }}>
                          {ch}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '12px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: dt.isToday ? c.badgeGreenBg : (dt.isYesterday ? (darkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF') : (darkMode ? '#262626' : '#F1F5F9')),
                            color: dt.isToday ? c.badgeGreenText : (dt.isYesterday ? (darkMode ? '#60A5FA' : '#2563EB') : c.textSecondary)
                          }}>
                            {dt.label}
                          </span>
                          <span style={{ fontSize: '0.73rem', color: c.textMuted, fontFamily: 'monospace' }}>
                            {dt.time}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* ═══ PAGINATION FOOTER ═══ */}
        {filteredEvents.length > 0 && pageSize !== 'all' && (
          <div style={{
            padding: '14px 22px',
            borderTop: `1px solid ${c.borderCard}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: darkMode ? '#171717' : '#FAFAFA'
          }}>
            {/* Range info */}
            <div style={{ fontSize: '0.76rem', color: c.textSecondary }}>
              Mostrando <strong style={{ color: c.textPrimary }}>
                {Math.min(filteredEvents.length, (currentPage - 1) * pageSize + 1)}
              </strong> – <strong style={{ color: c.textPrimary }}>
                {Math.min(filteredEvents.length, currentPage * pageSize)}
              </strong> de <strong style={{ color: c.textPrimary }}>{filteredEvents.length}</strong> sesiones
            </div>

            {/* Pagination Controls */}
            {Math.ceil(filteredEvents.length / pageSize) > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${c.borderCard}`,
                    background: currentPage === 1 ? 'transparent' : (darkMode ? '#262626' : '#FFFFFF'),
                    color: currentPage === 1 ? c.textMuted : c.textPrimary,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Anterior</span>
                </button>

                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: c.textPrimary, padding: '0 8px' }}>
                  Página {currentPage} de {Math.ceil(filteredEvents.length / pageSize)}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= Math.ceil(filteredEvents.length / pageSize)}
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredEvents.length / pageSize), prev + 1))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${c.borderCard}`,
                    background: currentPage >= Math.ceil(filteredEvents.length / pageSize) ? 'transparent' : (darkMode ? '#262626' : '#FFFFFF'),
                    color: currentPage >= Math.ceil(filteredEvents.length / pageSize) ? c.textMuted : c.textPrimary,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: currentPage >= Math.ceil(filteredEvents.length / pageSize) ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= Math.ceil(filteredEvents.length / pageSize) ? 0.5 : 1
                  }}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
