import React, { useState } from 'react';
import { X, Cloud, LogIn, LogOut, CheckCircle, Mail, Key, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export function AuthModal({ user, onClose, onAuthSuccess, onSignOut }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isSupabaseConfigured) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content glass-panel auth-modal__content--unconfigured" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <div className="auth-modal__header">
            <Cloud size={48} color="#a855f7" className="auth-modal__header-icon" />
            <h2 className="auth-modal__title">Configuración de Nube</h2>
            <p className="auth-modal__subtitle">
              Para activar el guardado automático en la nube con Supabase, agrega tus variables de entorno <code className="auth-modal__code">VITE_SUPABASE_URL</code> y <code className="auth-modal__code">VITE_SUPABASE_ANON_KEY</code> en Vercel.
            </p>
            <p className="auth-modal__local-notice">
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

  const handleAnonymousAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión rápida');
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
          throw new Error('Google Sign-In requiere activar Google en Supabase. Puedes usar "Acceso Rápido 1-Clic" arriba sin registrarte.');
        }
        throw googleError;
      }
    } catch (err) {
      setError(err.message || 'Error con Google Sign-In');
      setLoading(false);
    }
  };

  const handleLinkEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password
      });
      if (updateError) throw updateError;
      setMessage('¡Excelente! Tu cuenta ahora está vinculada a tu correo. Puedes usarla en cualquier dispositivo.');
    } catch (err) {
      setError(err.message || 'Error al vincular la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    if (onSignOut) onSignOut();
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel auth-modal__content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal__header">
          <ShieldCheck size={44} color="#10b981" className="auth-modal__header-icon" />
          <h2 className="auth-modal__title">
            {user ? (user.is_anonymous ? 'Conectado como Invitado' : 'Sincronización en la Nube') : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </h2>
          <p className="auth-modal__subtitle">
            {user ? (user.is_anonymous ? 'Tu Pokédex está seguro en la nube' : `Conectado como ${user.email}`) : 'Guarda tu Pokédex en la nube y accede desde cualquier dispositivo'}
          </p>
        </div>

        {user ? (
          <div className="auth-modal__body">
            <div className="auth-modal__status-card">
              <CheckCircle size={24} color="#10b981" className="auth-modal__status-icon" />
              <div className="auth-modal__status-title">Tu Pokédex está sincronizado en la nube</div>
              <div className="auth-modal__status-text">
                {user.is_anonymous ? 'Conectado mediante Acceso Rápido 1-Clic' : 'Cualquier cambio se guarda automáticamente'}
              </div>
            </div>

            {user.is_anonymous && (
              <div className="auth-modal__link-section">
                <div className="auth-modal__link-title">
                  🔗 Convierte tu cuenta para acceder desde otros celulares
                </div>
                <p className="auth-modal__link-desc">
                  Vincula tu correo o Google a esta colección. Conservarás todos los Sprites que ya has marcado.
                </p>

                {error && (
                  <div className="auth-modal__alert--error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="auth-modal__alert--success">
                    {message}
                  </div>
                )}

                {/* Link Google */}
                <button
                  onClick={handleGoogleAuth}
                  className="auth-modal__btn-google auth-modal__btn-google--sm"
                  disabled={loading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Vincular con Google</span>
                </button>

                {/* Link Email Form */}
                <form onSubmit={handleLinkEmail} className="auth-modal__form auth-modal__form--compact">
                  <div className="auth-modal__input-group auth-modal__input-group--sm">
                    <Mail size={14} className="auth-modal__input-icon" />
                    <input
                      type="email"
                      placeholder="Tu correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="auth-modal__input auth-modal__input--sm"
                    />
                  </div>

                  <div className="auth-modal__input-group auth-modal__input-group--sm">
                    <Key size={14} className="auth-modal__input-icon" />
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="auth-modal__input auth-modal__input--sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary auth-modal__btn-submit auth-modal__btn-submit--sm"
                    disabled={loading}
                  >
                    <span>Vincular Correo</span>
                  </button>
                </form>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="btn-secondary auth-modal__btn-signout"
              disabled={loading}
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <div>
            {/* 1-Click Anonymous Quick Access */}
            <button
              onClick={handleAnonymousAuth}
              className="auth-modal__btn-quick"
              disabled={loading}
            >
              <span>⚡ Acceso Rápido 1-Clic (Sin Registro)</span>
            </button>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleAuth}
              className="auth-modal__btn-google"
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

            <div className="auth-modal__divider">
              <span>O con Correo</span>
            </div>

            {error && (
              <div className="auth-modal__alert--error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-modal__alert--success">
                {message}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="auth-modal__form">
              <div className="auth-modal__input-group">
                <Mail size={16} className="auth-modal__input-icon" />
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-modal__input"
                />
              </div>

              <div className="auth-modal__input-group">
                <Key size={16} className="auth-modal__input-icon" />
                <input
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-modal__input"
                />
              </div>

              <button
                type="submit"
                className="btn-primary auth-modal__btn-submit"
                disabled={loading}
              >
                <LogIn size={16} />
                <span>{isSignUp ? 'Registrarse' : 'Iniciar Sesión'}</span>
              </button>
            </form>

            <div className="auth-modal__toggle-container">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="auth-modal__toggle"
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
