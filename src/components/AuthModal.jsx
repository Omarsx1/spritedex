import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Google } from './ui/Google';
import { conGoogle, origenActual } from '../utils/authActions';
import { X, Cloud, LogIn, LogOut, CheckCircle, Mail, Key, ShieldCheck } from 'lucide-react';
import { getSupabase, isSupabaseConfigured, shouldSkipAnonymousAuth } from '../utils/supabase';
import { trackEvent } from '../utils/telemetry';
import { t } from '../i18n';

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
            <h2 className="auth-modal__title">{t('auth.tituloNube')}</h2>
            <p className="auth-modal__subtitle">
              {t('auth.nubeTextoA')}<code className="auth-modal__code">VITE_SUPABASE_URL</code>{t('auth.nubeTextoB')}<code className="auth-modal__code">VITE_SUPABASE_ANON_KEY</code>{t('auth.nubeTextoC')}
            </p>
            <p className="auth-modal__local-notice">
              {t('auth.avisoLocal')}
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
          password,
          // Sin emailRedirectTo, Supabase usa el Site URL y el correo de confirmacion
          // puede devolver al usuario a OTRO dominio, donde su copia local no existe.
          // Fijandolo al origen actual, la confirmacion siempre vuelve donde se registro.
          options: { emailRedirectTo: origenActual() }
        });
        if (signUpError) throw signUpError;
        trackEvent('signup', { method: 'email' });
        setMessage(t('auth.cuentaCreada'));
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
      setError(err.message || t('auth.errorAutenticar'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousAuth = async () => {
    try {
      // En local, preview y tuneles no se crean usuarios reales: el acceso rapido es la
      // unica puerta que no respetaba los guardias de entorno y ensuciaba la base de
      // produccion con cuentas de prueba. Para probarlo a proposito: VITE_ALLOW_ANON_AUTH=true.
      if (shouldSkipAnonymousAuth()) {
        setError(t('auth.entornoSinCuentas'));
        return;
      }
      setLoading(true);
      setError(null);
      const supabase = await getSupabase();
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      trackEvent('login', { method: 'anonymous' });
      if (onAuthSuccess) onAuthSuccess();
      onClose();
    } catch (err) {
      setError(err.message || t('auth.errorSesionRapida'));
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
      setError(err.message || t('auth.errorGoogle'));
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
      setMessage(t('auth.cuentaVinculada'));
    } catch (err) {
      setError(err.message || t('auth.errorVincular'));
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
            {user ? (user.is_anonymous ? t('auth.conectadoComoInvitado') : t('auth.sincronizacionNube')) : (isSignUp ? t('auth.crearCuenta') : t('auth.iniciarSesion'))}
          </h2>
          <p className="auth-modal__subtitle">
            {user ? (user.is_anonymous ? t('auth.guardadoLocal') : t('auth.conectadoComo', { email: user.email })) : t('auth.subtituloInvitado')}
          </p>
        </div>

        {user ? (
          <div className="auth-modal__body">
            <div className="auth-modal__status-card">
              <CheckCircle size={24} color="#10b981" className="auth-modal__status-icon" />
              <div className="auth-modal__status-title">{t('auth.sincronizadoNube')}</div>
              <div className="auth-modal__status-text">
                {user.is_anonymous ? t('auth.accesoRapidoConectado') : t('auth.cambioAutomatico')}
              </div>
            </div>

            {user.is_anonymous && (
              <div className="auth-modal__link-section">
                <div className="auth-modal__link-title">
                  {t('auth.convierteCuenta')}
                </div>
                <p className="auth-modal__link-desc">
                  {t('auth.linkDesc')}
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
                  <span>{t('auth.vincularGoogle')}</span>
                </button>

                {/* Link Email Form */}
                <form onSubmit={handleLinkEmail} className="auth-modal__form auth-modal__form--compact">
                  <div className="auth-modal__input-group auth-modal__input-group--sm">
                    <Mail size={14} className="auth-modal__input-icon" />
                    <input
                      type="email"
                      placeholder={t('auth.placeholderCorreo')}
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
                      placeholder={t('auth.placeholderNuevaContrasena')}
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
                    <span>{t('auth.vincularCorreo')}</span>
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
              <span>{t('auth.cerrarSesion')}</span>
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
              <span>{t('auth.accesoRapido')}</span>
            </button>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleAuth}
              className="auth-modal__btn-google"
              disabled={loading}
            >
              <Google width="18" height="18" />
              <span>{t('auth.continuarGoogle')}</span>
            </button>

            <div className="auth-modal__divider">
              <span>{t('auth.oConCorreo')}</span>
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
                  placeholder={t('auth.placeholderCorreo')}
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
                  placeholder={t('auth.placeholderContrasena')}
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
                <span>{isSignUp ? t('auth.registrarse') : t('auth.iniciarSesion')}</span>
              </button>
            </form>

            <div className="auth-modal__toggle-container">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="auth-modal__toggle"
              >
                {isSignUp ? t('auth.yaTienesCuenta') : t('auth.noTienesCuenta')}
              </button>
            </div>
          </div>
        )}
    </Modal>
  );
}
