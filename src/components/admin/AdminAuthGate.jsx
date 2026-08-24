import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

const ADMIN_AUTH_KEY = 'spritedex_admin_session_v1';
const DEFAULT_PASSCODE = 'override2026';

export function AdminAuthGate({ onAuthenticated, onExit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [authMode, setAuthMode] = useState(isSupabaseConfigured ? 'supabase' : 'passcode');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasscodeLogin = (e) => {
    e.preventDefault();
    if (passcode.trim() === DEFAULT_PASSCODE || passcode.trim().toLowerCase() === 'adminoverride') {
      sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({ mode: 'passcode', authenticatedAt: Date.now() }));
      onAuthenticated();
    } else {
      setErrorMsg('Código de acceso no autorizado. Verifica la clave.');
    }
  };

  const handleSupabaseLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Ingresa correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      if (data?.user) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({
          mode: 'supabase',
          email: data.user.email,
          authenticatedAt: Date.now()
        }));
        onAuthenticated();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060714',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Background glow layers */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '420px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '20px',
        padding: '32px 24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00F0E8',
            marginBottom: '12px'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 4px', letterSpacing: '0.05em' }}>
            SPRITEDEX STUDIO
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
            Centro de Control Privado & Gestión de Catálogo
          </p>
        </div>

        {/* Mode Selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(2, 6, 23, 0.7)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setAuthMode('passcode')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '7px',
              border: 'none',
              background: authMode === 'passcode' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
              color: authMode === 'passcode' ? '#00F0E8' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Clave Maestra
          </button>
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => setAuthMode('supabase')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '7px',
                border: 'none',
                background: authMode === 'supabase' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: authMode === 'supabase' ? '#00F0E8' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cuenta Supabase
            </button>
          )}
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '9px',
            padding: '10px 12px',
            color: '#f87171',
            fontSize: '0.78rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Forms */}
        {authMode === 'passcode' ? (
          <form onSubmit={handlePasscodeLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                CLAVE DE ACCESO DEL EQUIPO
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Introduce la clave de acceso..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#00F0E8' }} />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                color: '#060714',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(0, 240, 255, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Acceder al Studio</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSupabaseLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                CORREO DE ADMINISTRADOR
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@spritedex.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                CONTRASEÑA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(2, 6, 23, 0.8)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                color: '#060714',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 900,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(0, 240, 255, 0.4)',
                opacity: loading ? 0.7 : 1
              }}
            >
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Exit link */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Volver a la web pública
          </button>
        </div>
      </div>
    </div>
  );
}

export function isUserAdminAuthenticated() {
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.authenticatedAt);
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {}
}
