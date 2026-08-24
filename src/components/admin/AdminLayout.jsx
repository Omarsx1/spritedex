import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  Plus, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Database
} from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SpiritCatalogTable } from './SpiritCatalogTable';
import { SpiritEditorModal } from './SpiritEditorModal';
import { clearAdminSession } from './AdminAuthGate';
import { isSupabaseConfigured } from '../../utils/supabase';

export function AdminLayout({ sprites = [], onRefreshSprites, onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, catalog
  const [editingSpirit, setEditingSpirit] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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
      background: '#060714',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {/* Top Cyber Navigation Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#060714',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.04em', color: '#f8fafc' }}>
                SPRITEDEX <span style={{ color: '#00F0E8' }}>STUDIO</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isSupabaseConfigured ? '#4ade80' : '#f59e0b',
                  boxShadow: `0 0 6px ${isSupabaseConfigured ? '#4ade80' : '#f59e0b'}`
                }} />
                <span>{isSupabaseConfigured ? 'Supabase Cloud Conectado' : 'Modo Local / Autónomo'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(2, 6, 23, 0.8)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'analytics' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: activeTab === 'analytics' ? '#00F0E8' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Activity size={16} />
              <span>Monitoreo & Telemetría</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'catalog' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: activeTab === 'catalog' ? '#00F0E8' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={16} />
              <span>Catálogo de Espíritus ({sprites.length})</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleOpenNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                color: '#060714',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 240, 255, 0.3)'
              }}
            >
              <Plus size={14} />
              <span>Nuevo Espíritu</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '9px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Ir a la web pública de Spritedex"
            >
              <ExternalLink size={14} />
              <span>Ver Web</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '9px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Cerrar Sesión de Studio"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 60px' }}>
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <SpiritCatalogTable
            sprites={sprites}
            onAddNew={handleOpenNew}
            onEdit={handleOpenEdit}
            onRefresh={onRefreshSprites}
          />
        )}
      </main>

      {/* Editor Modal */}
      {isEditorOpen && (
        <SpiritEditorModal
          spirit={editingSpirit}
          onSave={handleSaveSpirit}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  );
}
