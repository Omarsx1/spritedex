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
  Star,
  Layers,
  Crown
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { getMyFriendCode } from '../../utils/friendCode';

export function UserManagementTable({ sprites = [], darkMode = false }) {
  const [rawCollections, setRawCollections] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'high_progress' | 'active_catch'
  const [selectedGen, setSelectedGen] = useState(2); // 2 = Temporada Actual (2ª Gen), 1 = 1ª Gen, 0 = Todas
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState(null);
  const pageSize = 15;

  const myFriendCode = useMemo(() => getMyFriendCode(), []);

  // Filter pool of sprites according to selected generation
  const scopedSprites = useMemo(() => {
    if (selectedGen === 0) return sprites;
    return sprites.filter((s) => s.gen === selectedGen);
  }, [sprites, selectedGen]);

  const gen2Count = useMemo(() => sprites.filter(s => s.gen === 2).length || 60, [sprites]);
  const gen1Count = useMemo(() => sprites.filter(s => s.gen === 1).length || 109, [sprites]);
  const allCount = useMemo(() => sprites.length || 169, [sprites]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        // 1. Fetch user collections
        const { data: collections, error: colError } = await supabase
          .from('user_collections')
          .select('id, user_id, friend_code, user_state, updated_at')
          .order('updated_at', { ascending: false });

        if (colError) {
          console.error('Error fetching user_collections from Supabase:', colError);
        }

        // 2. Fetch total visits for conversion rate
        const { count: visitCount } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true });

        setTotalVisits(visitCount || 0);

        if (collections) {
          setRawCollections(collections);
        } else {
          setRawCollections([]);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Compute user metrics dynamically according to the selected generation pool
  const users = useMemo(() => {
    const totalPool = scopedSprites.length || 1;

    return rawCollections.map((col, idx) => {
      const st = col.user_state || {};
      let caught = 0;
      let stars = 0;

      if (typeof st === 'object' && st !== null) {
        scopedSprites.forEach((sprite) => {
          const val = st[sprite.id];
          if (val && (val.owned === true || val.caught === true || (val.stars && val.stars > 0) || (val.level && val.level > 0))) {
            caught++;
          }
          if (val && (val.stars || val.level)) {
            stars += Number(val.stars || val.level || 0);
          }
        });
      }

      const pct = Math.min(100, Math.round((caught / totalPool) * 100));
      const isMe = (col.friend_code && myFriendCode && col.friend_code.trim().toUpperCase() === myFriendCode.trim().toUpperCase());

      return {
        id: col.id || `usr_${idx}`,
        userId: col.user_id || 'Anónimo',
        friendCode: col.friend_code || `SDEX-${(col.user_id || 'USER').slice(0, 4).toUpperCase()}`,
        caughtCount: caught,
        starCount: stars,
        progressPct: pct,
        isMe: isMe,
        updatedAt: col.updated_at || new Date().toISOString()
      };
    });
  }, [rawCollections, scopedSprites, myFriendCode]);

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

      {/* ═══ USER'S OWN ACCOUNT NOTICE BANNER ═══ */}
      {myFriendCode && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '14px',
          background: darkMode ? 'rgba(0, 240, 232, 0.07)' : 'rgba(60, 80, 224, 0.06)',
          border: darkMode ? '1px solid rgba(0, 240, 232, 0.3)' : '1px solid rgba(60, 80, 224, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#00F0E8',
              color: '#060714',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Crown size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: textPrimary }}>
                Tu Cuenta de Entrenador (Este Dispositivo): <span style={{ color: '#00F0E8', fontFamily: 'monospace', fontSize: '0.95rem' }}>{myFriendCode}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: textMuted }}>
                Tu fila aparece identificada con la insignia <strong style={{ color: '#00F0E8' }}>👑 TÚ</strong> y borde cian brillante en la tabla de abajo.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: textMuted }}>Generación Activa:</span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: darkMode ? '#262626' : '#F1F5F9',
              color: '#00F0E8',
              fontSize: '0.78rem',
              fontWeight: 800
            }}>
              {selectedGen === 2 ? 'Temporada Actual (2ª Gen)' : selectedGen === 1 ? '1ª Generación' : 'Todas las Generaciones'}
            </span>
          </div>
        </div>
      )}

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
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
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

        {/* Filters: Generation Selector, Progress Filter & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Generation / Season Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} style={{ color: textMuted }} />
            <select
              value={selectedGen}
              onChange={(e) => { setSelectedGen(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                ...inputStyle,
                fontWeight: 700,
                borderColor: selectedGen === 2 ? '#00F0E8' : (darkMode ? '#2E2E2E' : '#E2E8F0'),
                cursor: 'pointer'
              }}
              title="Filtrar por Temporada / Generación"
            >
              <option value={2}>🎮 Temporada Actual (2ª Gen - {gen2Count} Espíritus)</option>
              <option value={1}>🌟 1ª Generación ({gen1Count} Espíritus)</option>
              <option value={0}>📦 Todas las Generaciones ({allCount} Espíritus)</option>
            </select>
          </div>

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
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>PROGRESO ({selectedGen === 2 ? '2ª Gen' : selectedGen === 1 ? '1ª Gen' : 'Total'})</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ESTRELLAS</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ÚLTIMA SINCRONIZACIÓN</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) => {
                  const shortId = user.userId.length > 18 ? `${user.userId.slice(0, 8)}...${user.userId.slice(-6)}` : user.userId;
                  const isMe = user.isMe;

                  return (
                    <tr
                      key={user.id || idx}
                      style={{
                        borderBottom: rowBorder,
                        borderLeft: isMe ? '4px solid #00F0E8' : '4px solid transparent',
                        background: isMe
                          ? (darkMode ? 'rgba(0, 240, 232, 0.08)' : 'rgba(60, 80, 224, 0.05)')
                          : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Trainer Avatar & ID */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: isMe
                              ? 'linear-gradient(135deg, #00F0E8, #3ECF8E)'
                              : (darkMode ? 'linear-gradient(135deg, #262626, #3ECF8E)' : 'linear-gradient(135deg, #E2E8F0, #3C50E0)'),
                            color: isMe ? '#060714' : '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: isMe ? '0 0 12px rgba(0, 240, 232, 0.4)' : 'none'
                          }}>
                            {user.friendCode.slice(-2)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, color: isMe ? '#00F0E8' : textPrimary }}>
                                Entrenador #{user.friendCode.slice(-4)}
                              </span>
                              {isMe && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: '#00F0E8',
                                  color: '#060714',
                                  fontSize: '0.68rem',
                                  fontWeight: 900,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Crown size={10} /> TÚ
                                </span>
                              )}
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
                            color: isMe ? '#00F0E8' : (darkMode ? '#3ECF8E' : '#3C50E0'),
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
                              {user.caughtCount} / {scopedSprites.length} espíritus
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
