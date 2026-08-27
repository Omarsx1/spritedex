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
  Zap
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { resolveCountry } from '../../utils/telemetry';

export function AudienceInsightsView({ darkMode = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'today' | 'week'
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all' | 'mobile' | 'desktop'

  const loadAudienceData = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        // Fetch up to 1000 recent analytics events for comprehensive analysis
        const { data: rawEvents, error } = await supabase
          .from('analytics_events')
          .select('id, session_id, device_type, browser, os, is_iphone, referrer, path, created_at')
          .order('created_at', { ascending: false })
          .limit(1000);

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
    loadAudienceData();
    const interval = setInterval(loadAudienceData, 25000);
    return () => clearInterval(interval);
  }, []);

  // Filter events based on time and device filters
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((ev) => {
      const evTime = new Date(ev.created_at).getTime();

      // Time filter
      if (timeFilter === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        if (evTime < todayStart.getTime()) return false;
      } else if (timeFilter === 'week') {
        if (now - evTime > 7 * 24 * 60 * 60 * 1000) return false;
      }

      // Device filter
      const os = (ev.os || '').toLowerCase();
      const isMob = ev.is_iphone || os.includes('ios') || os.includes('iphone') || os.includes('android') || ev.device_type === 'mobile';
      if (deviceFilter === 'mobile' && !isMob) return false;
      if (deviceFilter === 'desktop' && isMob) return false;

      return true;
    });
  }, [events, timeFilter, deviceFilter]);

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
                  <span>🍎</span> iOS (iPhone)
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
                  <span>🤖</span> Android Mobile
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.android} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.android / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.android / analytics.total) * 100 : 0}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>

            {/* macOS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>💻</span> Apple Mac (macOS)
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
                  <span>🪟</span> Microsoft Windows PC
                </span>
                <span style={{ fontWeight: 800, color: c.textPrimary }}>
                  {analytics.windows} <span style={{ color: c.textMuted, fontWeight: 500 }}>({analytics.total > 0 ? Math.round((analytics.windows / analytics.total) * 100) : 0}%)</span>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${analytics.total > 0 ? (analytics.windows / analytics.total) * 100 : 0}%`, height: '100%', background: '#F59E0B', borderRadius: '3px' }} />
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
                      <div style={{ width: `${pct}%`, height: '100%', background: c.barFillBlue, borderRadius: '3px' }} />
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

      {/* ═══ LIVE CONNECTIONS STREAM (Real Time Table) ═══ */}
      <div style={{ ...widgetCardStyle, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: c.textPrimary, margin: 0 }}>
              Registro de Conexiones en Vivo (Dispositivo, País y Hora)
            </h3>
            <p style={{ fontSize: '0.74rem', color: c.textSecondary, margin: '2px 0 0' }}>
              Últimas sesiones registradas en tiempo real desde Supabase Analytics.
            </p>
          </div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: c.badgeGreenBg,
            border: `1px solid ${c.badgeGreenBorder}`,
            color: c.badgeGreenText,
            fontSize: '0.72rem',
            fontWeight: 700
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.badgeGreenText }} />
            <span>En Tiempo Real</span>
          </span>
        </div>

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
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 15).map((ev, idx) => {
                  const country = resolveCountry(ev.referrer || ev.country || ev.country_code, ev.timezone);

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
                            background: dt.isToday ? c.badgeGreenBg : (darkMode ? '#262626' : '#F1F5F9'),
                            color: dt.isToday ? c.badgeGreenText : c.textSecondary
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
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: c.textSecondary }}>
                    {loading ? 'Cargando sesiones de telemetría...' : 'No se encontraron visitas con los filtros seleccionados.'}
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
