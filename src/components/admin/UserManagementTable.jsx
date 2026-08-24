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

  // Enterprise Corporate Color System (WCAG 2.2 AAA / AA Compliant)
  const c = {
    bgCard: darkMode ? '#171717' : '#FFFFFF',
    borderCard: darkMode ? '#262626' : '#E2E8F0',
    bgInput: darkMode ? '#141414' : '#F8FAFC',
    borderInput: darkMode ? '#2E2E2E' : '#CBD5E1',
    textPrimary: darkMode ? '#EDEDED' : '#0F172A',      // High contrast > 15:1
    textSecondary: darkMode ? '#A1A1A1' : '#475569',    // High contrast > 7:1
    textMuted: darkMode ? '#737373' : '#64748B',        // High contrast > 4.8:1
    tableHeaderBg: darkMode ? '#121212' : '#F8FAFC',
    rowBorder: darkMode ? '#222222' : '#F1F5F9',
    badgeSelfBg: darkMode ? '#3ECF8E' : '#0F172A',
    badgeSelfText: darkMode ? '#000000' : '#FFFFFF',
    tagMyCodeBg: darkMode ? 'rgba(62, 207, 142, 0.12)' : '#EFF6FF',
    tagMyCodeBorder: darkMode ? 'rgba(62, 207, 142, 0.3)' : '#BFDBFE',
    tagMyCodeText: darkMode ? '#3ECF8E' : '#1E40AF',
    badgeAuthBg: darkMode ? 'rgba(62, 207, 142, 0.12)' : '#F0FDF4',
    badgeAuthBorder: darkMode ? 'rgba(62, 207, 142, 0.25)' : '#DCFCE7',
    badgeAuthText: darkMode ? '#3ECF8E' : '#15803D',
    pillNeutralBg: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
    pillNeutralBorder: darkMode ? '#2E2E2E' : '#E2E8F0',
    pillNeutralText: darkMode ? '#D4D4D4' : '#334155',
    barTrack: darkMode ? '#262626' : '#E2E8F0',
    barFill: darkMode ? '#3ECF8E' : '#2563EB'
  };

  const cardStyle = {
    background: c.bgCard,
    borderRadius: '12px',
    padding: '20px 22px',
    border: `1px solid ${c.borderCard}`,
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease'
  };

  const containerStyle = {
    background: c.bgCard,
    borderRadius: '14px',
    border: `1px solid ${c.borderCard}`,
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease'
  };

  const inputStyle = {
    padding: '9px 14px',
    borderRadius: '8px',
    background: c.bgInput,
    border: `1px solid ${c.borderInput}`,
    color: c.textPrimary,
    fontSize: '0.82rem',
    fontWeight: 600,
    outline: 'none'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ═══ TOP 4 KPI CARDS (Enterprise Clean Design) ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total Registered Users */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Cuentas en Nube</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: c.badgeAuthBg, border: `1px solid ${c.badgeAuthBorder}`, color: c.badgeAuthText, fontSize: '0.72rem', fontWeight: 700 }}>
              <ShieldCheck size={12} />
              <span>Supabase Auth</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.totalUsers.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Conversion Rate */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Tasa de Conversión</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: c.pillNeutralBg, border: `1px solid ${c.pillNeutralBorder}`, color: c.pillNeutralText, fontSize: '0.72rem', fontWeight: 700 }}>
              <TrendingUp size={12} />
              <span>Login / Visitas</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.conversionRate}%
          </div>
        </div>

        {/* Card 3: Total Caught Spirits */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Espíritus Atrapados</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: c.pillNeutralBg, border: `1px solid ${c.pillNeutralBorder}`, color: c.pillNeutralText, fontSize: '0.72rem', fontWeight: 700 }}>
              <Sparkles size={12} />
              <span>{selectedGen === 2 ? '2ª Gen' : selectedGen === 1 ? '1ª Gen' : 'Globales'}</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.totalCaughtAll.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Avg Collection Progress */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.textSecondary }}>Progreso Promedio</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '6px', background: c.pillNeutralBg, border: `1px solid ${c.pillNeutralBorder}`, color: c.pillNeutralText, fontSize: '0.72rem', fontWeight: 700 }}>
              <Star size={12} />
              <span>Maestría</span>
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: c.textPrimary, letterSpacing: '-0.03em' }}>
            {metrics.avgProgress}%
          </div>
        </div>
      </div>

      {/* ═══ USER'S OWN ACCOUNT NOTICE BANNER (Accessible & Professional) ═══ */}
      {myFriendCode && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          background: darkMode ? '#1A1A1A' : '#F8FAFC',
          border: `1px solid ${darkMode ? '#2E2E2E' : '#CBD5E1'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: c.badgeSelfBg,
              color: c.badgeSelfText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Crown size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: c.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Tu Cuenta de Entrenador (Este Dispositivo):</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: c.tagMyCodeBg,
                  border: `1px solid ${c.tagMyCodeBorder}`,
                  color: c.tagMyCodeText,
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.86rem'
                }}>
                  {myFriendCode}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: c.textSecondary, marginTop: '2px' }}>
                Tu fila aparece identificada con la insignia <strong>👑 TÚ</strong> y borde distintivo en la tabla.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: c.textSecondary }}>Filtro Activo:</span>
            <span style={{
              padding: '3px 8px',
              borderRadius: '6px',
              background: darkMode ? '#262626' : '#FFFFFF',
              border: `1px solid ${darkMode ? '#333333' : '#CBD5E1'}`,
              color: c.textPrimary,
              fontSize: '0.76rem',
              fontWeight: 700
            }}>
              {selectedGen === 2 ? 'Temporada Actual (2ª Gen)' : selectedGen === 1 ? '1ª Generación' : 'Todas las Generaciones'}
            </span>
          </div>
        </div>
      )}

      {/* ═══ TABLE CONTROL & FILTERS HEADER ═══ */}
      <div style={{
        ...containerStyle,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
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
              padding: '9px 14px 9px 36px',
              boxSizing: 'border-box'
            }}
          />
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
        </div>

        {/* Filters: Generation Selector, Progress Filter & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Generation / Season Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} style={{ color: c.textSecondary }} />
            <select
              value={selectedGen}
              onChange={(e) => { setSelectedGen(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                ...inputStyle,
                fontWeight: 700,
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

      {/* ═══ USERS DATA TABLE (Enterprise Corporate Style) ═══ */}
      <div style={{
        ...containerStyle,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.borderCard}`, color: c.textSecondary, background: c.tableHeaderBg }}>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>ENTRENADOR / CUENTA</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>CÓDIGO DE AMIGO</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>PROGRESO ({selectedGen === 2 ? '2ª Gen' : selectedGen === 1 ? '1ª Gen' : 'Total'})</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>ESTRELLAS</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em' }}>ÚLTIMA SINCRONIZACIÓN</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em', textAlign: 'right' }}>ESTADO</th>
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
                        borderBottom: `1px solid ${c.rowBorder}`,
                        borderLeft: isMe ? `3px solid ${darkMode ? '#3ECF8E' : '#0F172A'}` : '3px solid transparent',
                        background: isMe
                          ? (darkMode ? '#1C1C1C' : '#F8FAFC')
                          : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Trainer Avatar & ID */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: isMe
                              ? (darkMode ? '#3ECF8E' : '#0F172A')
                              : (darkMode ? '#262626' : '#F1F5F9'),
                            color: isMe
                              ? (darkMode ? '#000000' : '#FFFFFF')
                              : (darkMode ? '#D4D4D4' : '#334155'),
                            border: `1px solid ${isMe ? (darkMode ? '#3ECF8E' : '#0F172A') : (darkMode ? '#333333' : '#E2E8F0')}`,
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {user.friendCode.slice(-2)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: c.textPrimary }}>
                                Entrenador #{user.friendCode.slice(-4)}
                              </span>
                              {isMe && (
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: c.badgeSelfBg,
                                  color: c.badgeSelfText,
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Crown size={9} /> TÚ
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: c.textMuted, fontFamily: 'monospace' }}>
                              {shortId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Friend Code with Copy Button */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isMe ? c.tagMyCodeBg : (darkMode ? '#222222' : '#F1F5F9'),
                            border: `1px solid ${isMe ? c.tagMyCodeBorder : (darkMode ? '#2E2E2E' : '#E2E8F0')}`,
                            color: isMe ? c.tagMyCodeText : c.textPrimary,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: '0.03em'
                          }}>
                            {user.friendCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(user.friendCode)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedCode === user.friendCode ? (darkMode ? '#3ECF8E' : '#15803D') : c.textMuted,
                              cursor: 'pointer',
                              padding: '3px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Copiar Código de Amigo"
                          >
                            {copiedCode === user.friendCode ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Collection Progress Bar */}
                      <td style={{ padding: '12px 18px', minWidth: '170px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                            <span style={{ color: c.textPrimary, fontWeight: 600 }}>
                              {user.caughtCount} / {scopedSprites.length} espíritus
                            </span>
                            <strong style={{ color: c.textPrimary, fontWeight: 800 }}>
                              {user.progressPct}%
                            </strong>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: c.barTrack, borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${user.progressPct}%`,
                              height: '100%',
                              background: user.progressPct > 0 ? c.barFill : c.borderInput,
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Stars */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: c.textPrimary, fontWeight: 700, fontSize: '0.8rem' }}>
                          <Star size={13} fill="#D97706" color="#D97706" />
                          <span>{user.starCount}</span>
                        </div>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '12px 18px', color: c.textSecondary }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
                          <Clock size={12} />
                          <span>{formatRelativeTime(user.updatedAt)}</span>
                        </div>
                      </td>

                      {/* Cloud Sync Status */}
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: c.badgeAuthBg,
                          border: `1px solid ${c.badgeAuthBorder}`,
                          color: c.badgeAuthText,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.badgeAuthText }} />
                          <span>Nube Activa</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: c.textSecondary }}>
                    {loading ? 'Cargando usuarios de Supabase...' : 'No se encontraron usuarios registrados con los filtros seleccionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ═══ TABLE PAGINATION FOOTER ═══ */}
        <div style={{
          padding: '14px 20px',
          borderTop: `1px solid ${c.borderCard}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: c.tableHeaderBg
        }}>
          <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>
            Mostrando <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)}</strong> a <strong>{Math.min(currentPage * pageSize, filteredUsers.length)}</strong> de <strong>{filteredUsers.length}</strong> cuentas
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${c.borderCard}`,
                background: c.bgCard,
                color: currentPage === 1 ? c.textMuted : c.textPrimary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <ChevronLeft size={13} />
              <span>Anterior</span>
            </button>

            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: c.textPrimary, padding: '0 6px' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${c.borderCard}`,
                background: c.bgCard,
                color: currentPage === totalPages ? c.textMuted : c.textPrimary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: 700
              }}
            >
              <span>Siguiente</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
