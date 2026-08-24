import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  Clock, 
  TrendingUp, 
  Share2, 
  RefreshCw,
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function UserManagementTable({ sprites = [], darkMode = false }) {
  const [users, setUsers] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'high_progress' | 'recent'
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState(null);
  const pageSize = 15;

  const totalSpriteCount = sprites.length || 60;

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        // 1. Fetch user collections
        const { data: collections, error: colError } = await supabase
          .from('user_collections')
          .select('id, user_id, friend_code, user_state, created_at, updated_at')
          .order('updated_at', { ascending: false });

        if (colError) throw colError;

        // 2. Fetch total visits for conversion rate
        const { count: visitCount } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true });

        setTotalVisits(visitCount || 0);

        if (collections) {
          const parsedUsers = collections.map((col, idx) => {
            const st = col.user_state || {};
            let caught = 0;
            let stars = 0;

            if (typeof st === 'object' && st !== null) {
              Object.values(st).forEach((val) => {
                if (val && (val.caught || val.stars > 0)) {
                  caught++;
                }
                if (val && val.stars) {
                  stars += Number(val.stars) || 0;
                }
              });
            }

            const pct = Math.min(100, Math.round((caught / totalSpriteCount) * 100));

            return {
              id: col.id || `usr_${idx}`,
              userId: col.user_id || 'Anónimo',
              friendCode: col.friend_code || `SDEX-${(col.user_id || 'USER').slice(0, 4).toUpperCase()}`,
              caughtCount: caught,
              starCount: stars,
              progressPct: pct,
              updatedAt: col.updated_at || col.created_at || new Date().toISOString()
            };
          });

          setUsers(parsedUsers);
        }
      } else {
        // Fallback local sample data
        setUsers([
          {
            id: 'demo_1',
            userId: 'usr_local_master',
            friendCode: 'SDEX-A9K2',
            caughtCount: 42,
            starCount: 120,
            progressPct: 70,
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [totalSpriteCount]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const conversionRate = totalVisits > 0 ? Math.round((totalUsers / totalVisits) * 100) : 0;
    const totalCaughtAll = users.reduce((acc, u) => acc + u.caughtCount, 0);
    const avgProgress = totalUsers > 0 ? Math.round(users.reduce((acc, u) => acc + u.progressPct, 0) / totalUsers) : 0;

    return {
      totalUsers,
      conversionRate,
      totalCaughtAll,
      avgProgress
    };
  }, [users, totalVisits]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const matchesCode = (u.friendCode || '').toLowerCase().includes(q);
        const matchesId = (u.userId || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesId) return false;
      }

      if (filterType === 'high_progress' && u.progressPct < 50) return false;
      if (filterType === 'active_catch' && u.caughtCount === 0) return false;

      return true;
    });
  }, [users, searchQuery, filterType]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Desconocido';
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Styles based on Supabase Dark Theme
  const cardStyle = {
    background: darkMode ? '#1C1C1C' : '#FFFFFF',
    borderRadius: '14px',
    padding: '22px 24px',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };

  const containerStyle = {
    background: darkMode ? '#1C1C1C' : '#FFFFFF',
    borderRadius: '16px',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };

  const inputStyle = {
    padding: '9px 14px',
    borderRadius: '10px',
    background: darkMode ? '#171717' : '#F8FAFC',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    color: darkMode ? '#EDEDED' : '#1E293B',
    fontSize: '0.82rem',
    fontWeight: 600,
    outline: 'none'
  };

  const textPrimary = darkMode ? '#EDEDED' : '#1E293B';
  const textMuted = darkMode ? '#8B949E' : '#64748B';
  const tableHeaderBg = darkMode ? '#171717' : '#F8FAFC';
  const rowBorder = darkMode ? '1px solid #262626' : '1px solid #F1F5F9';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ═══ TOP 4 KPI CARDS FOR USER METRICS ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Total Registered Users */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Cuentas en Nube</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5', color: '#3ECF8E', fontSize: '0.72rem', fontWeight: 800 }}>
              <ShieldCheck size={12} />
              <span>Supabase Auth</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.totalUsers.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Conversion Rate */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Tasa de Conversión</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE', color: '#38BDF8', fontSize: '0.72rem', fontWeight: 800 }}>
              <TrendingUp size={12} />
              <span>Login / Visitas</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.conversionRate}%
          </div>
        </div>

        {/* Card 3: Total Caught Spirits */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Espíritus Atrapados</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', color: '#F59E0B', fontSize: '0.72rem', fontWeight: 800 }}>
              <Sparkles size={12} />
              <span>Globales</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.totalCaughtAll.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Avg Collection Progress */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textMuted }}>Progreso Promedio</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', borderRadius: '20px', background: darkMode ? 'rgba(168, 85, 247, 0.15)' : '#F5F3FF', color: '#A855F7', fontSize: '0.72rem', fontWeight: 800 }}>
              <Star size={12} />
              <span>Maestría</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.avgProgress}%
          </div>
        </div>
      </div>

      {/* ═══ TABLE CONTROL & FILTERS HEADER ═══ */}
      <div style={{
        ...containerStyle,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por Código de Amigo (SDEX-XXXX) o ID..."
            style={{
              ...inputStyle,
              width: '100%',
              padding: '10px 14px 10px 38px',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
        </div>

        {/* Filters & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
            style={inputStyle}
          >
            <option value="all">Todos los Entrenadores</option>
            <option value="high_progress">Colecciones &gt; 50%</option>
            <option value="active_catch">Con Espíritus Atrapados</option>
          </select>

          <button
            type="button"
            onClick={loadUserData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              background: darkMode ? '#171717' : '#FFFFFF',
              border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
              color: textMuted,
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* ═══ USERS DATA TABLE (TailAdmin & Supabase Dark Style) ═══ */}
      <div style={{
        ...containerStyle,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0', color: textMuted, background: tableHeaderBg }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ENTRENADOR / CUENTA</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>CÓDIGO DE AMIGO</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>PROGRESO COLECCIÓN</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ESTRELLAS</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ÚLTIMA SINCRONIZACIÓN</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) => {
                  const shortId = user.userId.length > 18 ? `${user.userId.slice(0, 8)}...${user.userId.slice(-6)}` : user.userId;

                  return (
                    <tr key={user.id || idx} style={{ borderBottom: rowBorder, transition: 'background 0.15s ease' }}>
                      {/* Trainer Avatar & ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: darkMode ? 'linear-gradient(135deg, #262626, #3ECF8E)' : 'linear-gradient(135deg, #E2E8F0, #3C50E0)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {user.friendCode.slice(-2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: textPrimary }}>
                              Entrenador #{user.friendCode.slice(-4)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: textMuted, fontFamily: 'monospace' }}>
                              {shortId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Friend Code with Copy Button */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: darkMode ? '#232323' : '#F1F5F9',
                            color: darkMode ? '#3ECF8E' : '#3C50E0',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            letterSpacing: '0.04em'
                          }}>
                            {user.friendCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(user.friendCode)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedCode === user.friendCode ? '#3ECF8E' : textMuted,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Copiar Código de Amigo"
                          >
                            {copiedCode === user.friendCode ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Collection Progress Bar */}
                      <td style={{ padding: '14px 20px', minWidth: '180px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                            <span style={{ color: textPrimary, fontWeight: 700 }}>
                              {user.caughtCount} / {totalSpriteCount} espíritus
                            </span>
                            <strong style={{ color: darkMode ? '#3ECF8E' : '#3C50E0' }}>
                              {user.progressPct}%
                            </strong>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: darkMode ? '#262626' : '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${user.progressPct}%`,
                              height: '100%',
                              background: darkMode ? 'linear-gradient(90deg, #10B981, #3ECF8E)' : 'linear-gradient(90deg, #3C50E0, #00F0E8)',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Stars */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 800, fontSize: '0.84rem' }}>
                          <Star size={14} fill="#F59E0B" />
                          <span>{user.starCount}</span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '14px 20px', color: textMuted }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                          <Clock size={13} />
                          <span>{formatRelativeTime(user.updatedAt)}</span>
                        </div>
                      </td>

                      {/* Cloud Sync Status */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5',
                          color: '#3ECF8E',
                          fontSize: '0.74rem',
                          fontWeight: 800
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF8E' }} />
                          <span>Nube Activa</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: textMuted }}>
                    {loading ? 'Cargando usuarios de Supabase...' : 'No se encontraron usuarios registrados con los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ TABLE PAGINATION FOOTER ═══ */}
        <div style={{
          padding: '16px 24px',
          borderTop: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: darkMode ? '#171717' : '#F8FAFC'
        }}>
          <span style={{ fontSize: '0.8rem', color: textMuted }}>
            Mostrando <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}</strong> a <strong>{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> de <strong>{filteredUsers.length}</strong> cuentas
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                background: darkMode ? '#1C1C1C' : '#FFFFFF',
                color: currentPage === 1 ? (darkMode ? '#525252' : '#CBD5E1') : textPrimary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary, padding: '0 8px' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                background: darkMode ? '#1C1C1C' : '#FFFFFF',
                color: currentPage === totalPages ? (darkMode ? '#525252' : '#CBD5E1') : textPrimary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
