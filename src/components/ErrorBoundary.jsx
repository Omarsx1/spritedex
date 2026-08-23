import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Spritedex ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      // Clear potentially corrupted transient session parameters
      const url = new URL(window.location.href);
      url.search = '';
      window.location.href = url.toString();
    } catch {
      window.location.reload();
    }
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('fortnite_sprites_pokedex_v3_temp');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#060714',
          color: '#fff',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '18px',
            padding: '28px 22px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '14px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={36} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 8px', color: '#f8fafc' }}>
              Reanudando Spritedex
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
              Ocurrió un error al sincronizar con el navegador. Toca el botón para recargar la aplicación sin perder tu progreso.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                color: '#060714',
                fontWeight: 900,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 240, 255, 0.4)'
              }}
            >
              <RefreshCw size={16} />
              <span>Recargar Aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
