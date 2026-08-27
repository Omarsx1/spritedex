import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  ExternalLink, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Settings,
  Database,
  BarChart3,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SpiritCatalogTable } from './SpiritCatalogTable';
import { SpiritEditorModal } from './SpiritEditorModal';
import { UserManagementTable } from './UserManagementTable';
import { AudienceInsightsView } from './AudienceInsightsView';
import { clearAdminSession } from './AdminAuthGate';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function AdminLayout({ sprites = [], onRefreshSprites, onExitAdmin }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTab = urlParams.get('tab');
      if (paramTab && ['analytics', 'audience', 'catalog', 'users'].includes(paramTab)) {
        return paramTab;
      }
      const hashTab = window.location.hash.replace('#', '');
      if (hashTab && ['analytics', 'audience', 'catalog', 'users'].includes(hashTab)) {
        return hashTab;
      }
      const stored = localStorage.getItem('spritedex_studio_active_tab');
      if (stored && ['analytics', 'audience', 'catalog', 'users'].includes(stored)) {
        return stored;
      }
    } catch {}
    return 'analytics';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('spritedex_studio_active_tab', tabId);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usersCount, setUsersCount] = useState(0);
  const [editingSpirit, setEditingSpirit] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('spritedex_studio_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramTab = urlParams.get('tab');
        if (paramTab && ['analytics', 'audience', 'catalog', 'users'].includes(paramTab)) {
          setActiveTab(paramTab);
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('user_collections')
        .select('*', { count: 'exact', head: true })
        .then(({ count }) => {
          if (count !== null && count !== undefined) {
            setUsersCount(count);
          }
        });
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('spritedex_studio_theme', next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    clearAdminSession();
    onExitAdmin();
  };

  const handleOpenNew = () => {
    setEditingSpirit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (sprite) => {
    setEditingSpirit(sprite);
    setIsEditorOpen(true);
  };

  const handleSaveSpirit = () => {
    setIsEditorOpen(false);
    onRefreshSprites();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: darkMode ? '#121212' : '#F1F5F9',
      color: darkMode ? '#EDEDED' : '#1E293B',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>
      {/* ═══ SILICON VALLEY LEFT SIDEBAR (TailAdmin Style) ═══ */}
      <aside style={{
        width: sidebarOpen ? '280px' : '76px',
        minWidth: sidebarOpen ? '280px' : '76px',
        background: darkMode ? '#171717' : '#FFFFFF',
        borderRight: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          borderBottom: darkMode ? '1px solid #2E2E2E' : '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: darkMode ? 'linear-gradient(135deg, #3ECF8E, #10B981)' : 'linear-gradient(135deg, #3C50E0, #00F0E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: darkMode ? '#121212' : '#FFFFFF',
              boxShadow: darkMode ? '0 4px 12px rgba(62, 207, 142, 0.25)' : '0 4px 12px rgba(60, 80, 224, 0.25)',
              flexShrink: 0
            }}>
              <ShieldCheck size={20} />
            </div>
            {sidebarOpen && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: darkMode ? '#EDEDED' : '#1E293B', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Spritedex
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: darkMode ? '#3ECF8E' : '#3C50E0', letterSpacing: '0.04em' }}>
                  STUDIO ENTERPRISE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ flex: 1, padding: '20px 14px', overflowY: 'auto' }}>
          {sidebarOpen && (
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: darkMode ? '#737373' : '#8A99AD', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px' }}>
              MENU
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Dashboard / Analytics */}
            <button
              type="button"
              onClick={() => handleTabChange('analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'analytics' ? (darkMode ? '#232323' : 'rgba(60, 80, 224, 0.08)') : 'transparent',
                color: activeTab === 'analytics' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'),
                fontSize: '0.86rem',
                fontWeight: activeTab === 'analytics' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                whiteSpace: 'nowrap'
              }}
              title="Dashboard de Analíticas"
            >
              <LayoutDashboard size={18} style={{ color: activeTab === 'analytics' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'), flexShrink: 0 }} />
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Dashboard & Métricas</span>}
            </button>

            {/* Audience, Devices & Geography */}
            <button
              type="button"
              onClick={() => handleTabChange('audience')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'audience' ? (darkMode ? '#232323' : 'rgba(60, 80, 224, 0.08)') : 'transparent',
                color: activeTab === 'audience' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'),
                fontSize: '0.86rem',
                fontWeight: activeTab === 'audience' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Dispositivos, Horarios y Países"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <Globe size={18} style={{ color: activeTab === 'audience' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'), flexShrink: 0 }} />
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Dispositivos & Países</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: darkMode ? 'rgba(56, 189, 248, 0.15)' : '#EFF6FF',
                  color: darkMode ? '#38BDF8' : '#2563EB',
                  flexShrink: 0
                }}>
                  GEO
                </span>
              )}
            </button>

            {/* Spirit Catalog */}
            <button
              type="button"
              onClick={() => handleTabChange('catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'catalog' ? (darkMode ? '#232323' : 'rgba(60, 80, 224, 0.08)') : 'transparent',
                color: activeTab === 'catalog' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'),
                fontSize: '0.86rem',
                fontWeight: activeTab === 'catalog' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Catálogo de Espíritus"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <Layers size={18} style={{ color: activeTab === 'catalog' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'), flexShrink: 0 }} />
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Catálogo de Espíritus</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeTab === 'catalog' ? (darkMode ? 'rgba(62, 207, 142, 0.15)' : '#3C50E0') : (darkMode ? '#262626' : '#E2E8F0'),
                  color: activeTab === 'catalog' ? (darkMode ? '#3ECF8E' : '#FFFFFF') : (darkMode ? '#A1A1A1' : '#475569'),
                  flexShrink: 0
                }}>
                  {sprites.length}
                </span>
              )}
            </button>

            {/* Registered Users & Cloud Collections */}
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'users' ? (darkMode ? '#232323' : 'rgba(60, 80, 224, 0.08)') : 'transparent',
                color: activeTab === 'users' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'),
                fontSize: '0.86rem',
                fontWeight: activeTab === 'users' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Usuarios & Cuentas Registradas"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <Users size={18} style={{ color: activeTab === 'users' ? (darkMode ? '#3ECF8E' : '#3C50E0') : (darkMode ? '#A1A1A1' : '#64748B'), flexShrink: 0 }} />
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Usuarios & Cuentas</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeTab === 'users' ? (darkMode ? 'rgba(62, 207, 142, 0.15)' : '#3C50E0') : (darkMode ? '#262626' : '#E2E8F0'),
                  color: activeTab === 'users' ? (darkMode ? '#3ECF8E' : '#FFFFFF') : (darkMode ? '#A1A1A1' : '#475569'),
                  flexShrink: 0
                }}>
                  {usersCount || 0}
                </span>
              )}
            </button>

            {/* Quick Add Spirit */}
            <button
              type="button"
              onClick={handleOpenNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: darkMode ? '#A1A1A1' : '#64748B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Nuevo Espíritu"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <PlusCircle size={18} style={{ color: '#3ECF8E', flexShrink: 0 }} />
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Nuevo Espíritu</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5',
                  color: '#3ECF8E',
                  flexShrink: 0
                }}>
                  CMS
                </span>
              )}
            </button>
          </nav>

          {sidebarOpen && (
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: darkMode ? '#737373' : '#8A99AD', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '28px', marginBottom: '10px', paddingLeft: '10px' }}>
              SISTEMA & WEB
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* View Live Web */}
            <button
              type="button"
              onClick={onExitAdmin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                color: darkMode ? '#A1A1A1' : '#64748B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                whiteSpace: 'nowrap'
              }}
              title="Ver Sitio Web Público"
            >
              <ExternalLink size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Ver Web Pública</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div style={{
          padding: '16px',
          borderTop: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
          background: darkMode ? '#171717' : '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: darkMode ? '#3ECF8E' : 'linear-gradient(135deg, #3C50E0, #7551FF)',
              color: darkMode ? '#121212' : '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: darkMode ? '0 2px 8px rgba(62, 207, 142, 0.3)' : '0 2px 8px rgba(60, 80, 224, 0.25)'
            }}>
              AD
            </div>
            {sidebarOpen && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: darkMode ? '#EDEDED' : '#1E293B', lineHeight: 1.1 }}>
                  Admin
                </div>
                <div style={{ fontSize: '0.7rem', color: darkMode ? '#A1A1A1' : '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF8E', flexShrink: 0 }} />
                  <span>Acceso Maestro</span>
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#737373' : '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          background: darkMode ? '#171717' : '#FFFFFF',
          borderBottom: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}>
          {/* Left: Sidebar Toggle + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '480px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#A1A1A1' : '#64748B',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Menu size={20} />
            </button>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar o presiona ⌘K..."
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 38px',
                  borderRadius: '10px',
                  background: darkMode ? '#1C1C1C' : '#F8FAFC',
                  border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                  color: darkMode ? '#EDEDED' : '#1E293B',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: darkMode ? '#737373' : '#94A3B8' }} />
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: darkMode ? '#737373' : '#94A3B8',
                background: darkMode ? '#171717' : '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '4px',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0'
              }}>
                ⌘K
              </div>
            </div>
          </div>

          {/* Right: Cloud Sync Status & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isSupabaseConfigured ? (darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5') : (darkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7'),
              color: isSupabaseConfigured ? (darkMode ? '#3ECF8E' : '#10B981') : '#F59E0B',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSupabaseConfigured ? '#3ECF8E' : '#F59E0B' }} />
              <span>{isSupabaseConfigured ? 'Supabase Cloud Sync: Activo' : 'Modo Autónomo'}</span>
            </div>

            {/* Dark / Light Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: darkMode ? '#1C1C1C' : '#F8FAFC',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                color: darkMode ? '#3ECF8E' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={handleOpenNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: darkMode ? '#3ECF8E' : '#3C50E0',
                color: darkMode ? '#121212' : '#FFFFFF',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: darkMode ? '0 4px 12px rgba(62, 207, 142, 0.25)' : '0 4px 12px rgba(60, 80, 224, 0.25)'
              }}
            >
              <PlusCircle size={15} />
              <span>Crear Espíritu</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '28px', flex: 1, maxWidth: '1440px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {activeTab === 'analytics' && (
            <AnalyticsDashboard darkMode={darkMode} />
          )}
          {activeTab === 'audience' && (
            <AudienceInsightsView darkMode={darkMode} />
          )}
          {activeTab === 'catalog' && (
            <SpiritCatalogTable
              sprites={sprites}
              globalSearch={searchFilter}
              onAddNew={handleOpenNew}
              onEdit={handleOpenEdit}
              onRefresh={onRefreshSprites}
              darkMode={darkMode}
            />
          )}
          {activeTab === 'users' && (
            <UserManagementTable
              sprites={sprites}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>

      {/* Spirit Editor Modal */}
      {isEditorOpen && (
        <SpiritEditorModal
          spirit={editingSpirit}
          existingSprites={sprites}
          onSave={handleSaveSpirit}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
}
