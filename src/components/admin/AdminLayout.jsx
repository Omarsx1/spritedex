import React, { useState } from 'react';
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
  Users
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SpiritCatalogTable } from './SpiritCatalogTable';
import { SpiritEditorModal } from './SpiritEditorModal';
import { clearAdminSession } from './AdminAuthGate';
import { isSupabaseConfigured } from '../../utils/supabase';

export function AdminLayout({ sprites = [], onRefreshSprites, onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'catalog'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSpirit, setEditingSpirit] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

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
      background: '#F1F5F9',
      color: '#1E293B',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex'
    }}>
      {/* ═══ SILICON VALLEY LEFT SIDEBAR (TailAdmin Style) ═══ */}
      <aside style={{
        width: sidebarOpen ? '260px' : '76px',
        minWidth: sidebarOpen ? '260px' : '76px',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
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
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3C50E0, #00F0E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(60, 80, 224, 0.25)'
            }}>
              <ShieldCheck size={20} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Spritedex
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3C50E0', letterSpacing: '0.04em' }}>
                  STUDIO ENTERPRISE
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ flex: 1, padding: '20px 14px', overflowY: 'auto' }}>
          {sidebarOpen && (
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A99AD', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px' }}>
              MENU
            </div>
          )}

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Dashboard / Analytics */}
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'analytics' ? 'rgba(60, 80, 224, 0.08)' : 'transparent',
                color: activeTab === 'analytics' ? '#3C50E0' : '#64748B',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'analytics' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                justifyContent: sidebarOpen ? 'flex-start' : 'center'
              }}
              title="Dashboard de Analíticas"
            >
              <LayoutDashboard size={18} style={{ color: activeTab === 'analytics' ? '#3C50E0' : '#64748B' }} />
              {sidebarOpen && <span>Dashboard & Métricas</span>}
            </button>

            {/* Spirit Catalog */}
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'catalog' ? 'rgba(60, 80, 224, 0.08)' : 'transparent',
                color: activeTab === 'catalog' ? '#3C50E0' : '#64748B',
                fontSize: '0.86rem',
                fontWeight: activeTab === 'catalog' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Catálogo de Espíritus"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Layers size={18} style={{ color: activeTab === 'catalog' ? '#3C50E0' : '#64748B' }} />
                {sidebarOpen && <span>Catálogo de Espíritus</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeTab === 'catalog' ? '#3C50E0' : '#E2E8F0',
                  color: activeTab === 'catalog' ? '#FFFFFF' : '#475569'
                }}>
                  {sprites.length}
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
                color: '#64748B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Nuevo Espíritu"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PlusCircle size={18} style={{ color: '#10B981' }} />
                {sidebarOpen && <span>Nuevo Espíritu</span>}
              </div>
              {sidebarOpen && (
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: '#ECFDF5',
                  color: '#10B981'
                }}>
                  CMS
                </span>
              )}
            </button>
          </nav>

          {sidebarOpen && (
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8A99AD', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '28px', marginBottom: '10px', paddingLeft: '10px' }}>
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
                color: '#64748B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                justifyContent: sidebarOpen ? 'flex-start' : 'center'
              }}
              title="Ver Sitio Web Público"
            >
              <ExternalLink size={18} />
              {sidebarOpen && <span>Ver Web Pública</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#3C50E0',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              OS
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.1 }}>
                  Omar Salazar
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                  <span>Lead Admin</span>
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
                color: '#94A3B8',
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
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Left: Sidebar Toggle + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '480px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748B',
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
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#1E293B',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <div style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#94A3B8',
                background: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #E2E8F0'
              }}>
                ⌘K
              </div>
            </div>
          </div>

          {/* Right: Cloud Sync Status & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: isSupabaseConfigured ? '#ECFDF5' : '#FEF3C7',
              color: isSupabaseConfigured ? '#059669' : '#D97706',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSupabaseConfigured ? '#10B981' : '#F59E0B' }} />
              <span>{isSupabaseConfigured ? 'Supabase Cloud Sync: Activo' : 'Modo Autónomo'}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                background: '#3C50E0',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(60, 80, 224, 0.25)'
              }}
            >
              <PlusCircle size={15} />
              <span>Crear Espíritu</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '28px', flex: 1, maxWidth: '1440px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          {activeTab === 'analytics' ? (
            <AnalyticsDashboard />
          ) : (
            <SpiritCatalogTable
              sprites={sprites}
              globalSearch={searchFilter}
              onAddNew={handleOpenNew}
              onEdit={handleOpenEdit}
              onRefresh={onRefreshSprites}
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
