import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Google } from './ui/Google';
import { conGoogle } from '../utils/authActions';
import { X, Cloud, LogIn, LogOut, CheckCircle, Mail, Key, ShieldCheck } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../utils/supabase';
import { trackEvent } from '../utils/telemetry';

export function AuthModal({ user, onClose, onAuthSuccess, onSignOut }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isSupabaseConfigured) {
    return (
      <Modal onClose={onClose} className="modal-content glass-panel auth-modal__content--unconfigured">
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
      </Modal>
    );
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = await getSupabase();
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpError) throw signUpError;
        trackEvent('signup', { method: 'email' });
        setMessage('¡Cuenta creada! Revisa tu correo o inicia sesión.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        trackEvent('login', { method: 'email' });
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
      const supabase = await getSupabase();
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      trackEvent('login', { method: 'anonymous' });
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
      const { error: errorGoogle } = await conGoogle(Boolean(user?.is_anonymous));
      if (errorGoogle) throw errorGoogle;
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
      const supabase = await getSupabase();
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
    const supabase = await getSupabase();
    if (supabase) await supabase.auth.signOut();
    if (onSignOut) onSignOut();
    setLoading(false);
    onClose();
  };

  return (
    <Modal onClose={onClose} className="modal-content glass-panel auth-modal__content">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal__header">
          <ShieldCheck size={44} color="#10b981" className="auth-modal__header-icon" />
          <h2 className="auth-modal__title">
            {user ? (user.is_anonymous ? 'Conectado como Invitado' : 'Sincronización en la Nube') : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </h2>
          <p className="auth-modal__subtitle">
            {user ? (user.is_anonymous ? 'Tu Spritedex está guardado solo en este dispositivo' : `Conectado como ${user.email}`) : 'Guarda tu Spritedex en la nube y accede desde cualquier dispositivo'}
          </p>
        </div>

        {user ? (
          <div className="auth-modal__body">
            <div className="auth-modal__status-card">
              <CheckCircle size={24} color="#10b981" className="auth-modal__status-icon" />
              <div className="auth-modal__status-title">Tu Spritedex está sincronizado en la nube</div>
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
                  <Google width="16" height="16" />
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
              <Google width="18" height="18" />
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
    </Modal>
  );
}
