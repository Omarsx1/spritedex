import React, { useState } from 'react';
import { X, Cloud, LogIn, LogOut, CheckCircle, Mail, Key, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export function AuthModal({ user, onClose, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-panel" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <Cloud size={48} color="#a855f7" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>Configuración de Nube</h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
              Para activar el guardado automático en la nube con Supabase, agrega tus variables de entorno <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> y <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> en Vercel.
            </p>
            <p style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
              ✓ Mientras tanto, tus datos están 100% seguros guardados localmente en tu dispositivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;
        setMessage('¡Cuenta creada! Revisa tu correo o inicia sesión.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (googleError) {
        if (googleError.message?.includes('provider is not enabled') || googleError.code === 'validation_failed') {
          throw new Error('Google Sign-In requiere configuración de Google Cloud. Por favor usa el registro con correo abajo.');
        }
        throw googleError;
      }
    } catch (err) {
      setError(err.message || 'Error con Google Sign-In');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <ShieldCheck size={44} color="#10b981" style={{ marginBottom: '8px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>
            {user ? 'Sincronización en la Nube' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
            {user ? `Conectado como ${user.email}` : 'Guarda tu Pokédex en la nube y accede desde cualquier dispositivo'}
          </p>
        </div>

        {user ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <CheckCircle size={24} color="#10b981" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>Tu Pokédex está sincronizado</div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>Cualquier cambio se guarda automáticamente en la nube</div>
            </div>

            <button
              onClick={handleSignOut}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Google Sign In */}
            <button
              onClick={handleGoogleAuth}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span>O con Correo</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '12px' }}>
                {message}
              </div>
            )}

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                <input
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '6px', opacity: loading ? 0.6 : 1 }}
                disabled={loading}
              >
                <LogIn size={16} />
                <span>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</span>
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate gratis'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
