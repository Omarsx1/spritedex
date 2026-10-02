import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Google } from './ui/Google';
import { conGoogle, origenActual } from '../utils/authActions';
import { X, Cloud, LogIn, LogOut, Mail, Key, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';
import { getSupabase, isSupabaseConfigured, shouldSkipAnonymousAuth } from '../utils/supabase';
import { trackEvent } from '../utils/telemetry';
import { t } from '../i18n';
import {
  normalizarUsuario,
  validarUsuario,
  validarContrasena,
  usuarioAEmail,
  esCorreoSintetico,
  usuarioDeSesion
} from '../utils/usuario';

// Un motivo de validacion -> su texto. Vive fuera del componente para no recrear el mapa
// en cada pintado.
const MENSAJES_USUARIO = {
  largo: 'auth.usuarioLargo',
  inicio: 'auth.usuarioInicio',
  caracteres: 'auth.usuarioCaracteres',
  guiones: 'auth.usuarioGuiones',
  reservado: 'auth.usuarioReservado'
};

// Supabase avisa de un usuario ya registrado de dos formas: un error con "already
// registered" (confirmacion de correo activada) o un usuario sin identidades (confirmacion
// desactivada). Para quien lo lee significan lo mismo: ese nombre ya es de alguien.
function esUsuarioCogido(data, error) {
  if (error && /already registered|already exists|user_already_exists/i.test(error.message || '')) return true;
  return Boolean(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
}

// Espera antes de preguntar si el nombre esta libre: escribir "juan" no debe lanzar
// cinco consultas.
const ESPERA_DISPONIBILIDAD = 400;

// Los avisos de error y exito son los mismos en las tres puertas, asi que viven una sola vez.
function Alertas({ error, message }) {
  return (
    <>
      {error && <div className="auth-modal__alert--error">{error}</div>}
      {message && <div className="auth-modal__alert--success">{message}</div>}
    </>
  );
}

export function AuthModal({ user, onClose, onAuthSuccess, onSignOut }) {
  // El usuario y la contrasena son la via principal; el correo y Google quedan detras de
  // un interruptor discreto para no ofrecer tres puertas a la vez.
  const [usuario, setUsuario] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [modoCorreo, setModoCorreo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  // { usuario, libre } del ultimo sondeo; null mientras no hay respuesta o el RPC no existe.
  const [disponibilidad, setDisponibilidad] = useState(null);

  const esReclamo = Boolean(user && user.is_anonymous);
  const revisionUsuario = validarUsuario(usuario);
  const revisionContrasena = validarContrasena(password);
  const puedeEnviar = revisionUsuario.ok && revisionContrasena.ok;

  // Aviso de disponibilidad, solo al crear cuenta. En el reclamo no aporta: el updateUser
  // ya falla si el nombre esta cogido. Si la funcion usuario_libre todavia no existe en el
  // proyecto, el error se ignora y el aviso se queda oculto: la puerta la cierra el propio
  // signUp, igual que resolverCodigo con las funciones que aun no estan desplegadas.
  useEffect(() => {
    if (user || !isSignUp || !revisionUsuario.ok) {
      setDisponibilidad(null);
      return undefined;
    }
    const nombre = revisionUsuario.usuario;
    let cancelado = false;
    const id = setTimeout(async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase) return;
        const { data, error: errorRpc } = await supabase.rpc('usuario_libre', { usuario: nombre });
        if (cancelado || errorRpc) return;
        setDisponibilidad({ usuario: nombre, libre: data === true });
      } catch {
        // Sin RPC no hay aviso: el error del signUp hablara por si solo.
      }
    }, ESPERA_DISPONIBILIDAD);
    // Cancelar al desmontar o al cambiar el nombre evita que la respuesta de un nombre
    // viejo pinte "disponible" sobre el nombre nuevo.
    return () => { cancelado = true; clearTimeout(id); };
  }, [user, isSignUp, revisionUsuario.ok, revisionUsuario.usuario]);

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

  // Usuario y contrasena: crear cuenta, entrar o reclamar una sesion anonima.
  const handleUsuarioAuth = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const nombre = revisionUsuario.usuario;

    try {
      const supabase = await getSupabase();
      if (esReclamo) {
        // Reclamo: la sesion anonima sigue siendo la misma (mismo user_id), solo gana
        // credencial. Por eso la coleccion, el codigo de amigo y las amistades no se tocan.
        const { data, error: errorReclamo } = await supabase.auth.updateUser({
          email: usuarioAEmail(nombre),
          password,
          data: { username: nombre, email_contacto: emailContacto || '' }
        });
        if (esUsuarioCogido(data, errorReclamo)) {
          setError(t('auth.usuarioCogido'));
          return;
        }
        if (errorReclamo) throw errorReclamo;
        // Con "Confirm email" activado Supabase deja el correo pendiente: la sesion sigue
        // siendo anonima y el aviso de exito seria mentira. Solo hay conversion real cuando
        // el usuario dejo de ser anonimo y no quedo ningun correo por confirmar.
        const convertido = data && data.user;
        if (!convertido || convertido.is_anonymous || convertido.new_email) {
          setError(t('auth.cuentaNoCompletada'));
          return;
        }
        trackEvent('signup', { method: 'username' });
        setMessage(t('auth.usuarioCreado'));
      } else if (isSignUp) {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: usuarioAEmail(nombre),
          password,
          options: { data: { username: nombre, email_contacto: emailContacto || '' } }
        });
        if (esUsuarioCogido(data, errorRegistro)) {
          setError(t('auth.usuarioCogido'));
          return;
        }
        if (errorRegistro) throw errorRegistro;
        trackEvent('signup', { method: 'username' });
        setMessage(t('auth.usuarioCreado'));
      } else {
        const { error: errorEntrada } = await supabase.auth.signInWithPassword({
          email: usuarioAEmail(nombre),
          password
        });
        if (errorEntrada) throw errorEntrada;
        trackEvent('login', { method: 'username' });
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || t('auth.errorAutenticar'));
    } finally {
      setLoading(false);
    }
  };

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

  // Vuelta para quien ya tiene usuario: en produccion siempre hay una sesion anonima
  // silenciosa, asi que sin esta puerta quien reclama se queda sin forma de entrar en su
  // cuenta de siempre. signOut se llama directo (handleSignOut cierra la modal y aqui hace
  // falta que siga abierta) y onSignOut conserva la copia de recuperacion del invitado.
  const handleCambiarAEntrada = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = await getSupabase();
    if (supabase) await supabase.auth.signOut();
    if (onSignOut) onSignOut();
    setIsSignUp(false);
    setMessage(t('auth.sesionInvitadoCerrada'));
    setLoading(false);
  };

  // Linea de identidad: el usuario con @ cuando se conoce, si no el correo. El alias
  // sintetico <usuario>@spritedex.gg no se muestra nunca como si fuera un correo real.
  const nombreSesion = user ? usuarioDeSesion(user) : '';
  const correoVisible = user && !esCorreoSintetico(user.email) ? (user.email || '') : '';
  const identidad = nombreSesion ? '@' + nombreSesion : correoVisible;

  // El correo de contacto solo tiene sentido al crear cuenta; en el reclamo siempre es
  // un alta nueva, por eso se muestra tambien.
  const mostrarContacto = esReclamo || isSignUp;
  const ayudaUsuario = usuario && !revisionUsuario.ok ? t(MENSAJES_USUARIO[revisionUsuario.motivo]) : '';
  const ayudaContrasena = password && !revisionContrasena.ok ? t('auth.contrasenaCorta') : '';
  const disponible = !user && isSignUp && disponibilidad &&
    disponibilidad.usuario === normalizarUsuario(usuario) ? disponibilidad : null;

  // Un solo formulario para las tres situaciones: crear cuenta, entrar y reclamar la
  // sesion anonima. handleUsuarioAuth decide cual toca.
  const formularioUsuario = (
    <form onSubmit={handleUsuarioAuth} className="auth-modal__form">
      <div className="auth-modal__input-group">
        <User size={16} className="auth-modal__input-icon" />
        <input
          type="text"
          placeholder={t('auth.placeholderUsuario')}
          value={usuario}
          onChange={(e) => setUsuario(e.target.value.toLowerCase())}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="auth-modal__input"
        />
      </div>

      {ayudaUsuario && <p className="auth-modal__link-desc">{ayudaUsuario}</p>}

      <div className="auth-modal__input-group">
        <Key size={16} className="auth-modal__input-icon" />
        <input
          type={verContrasena ? 'text' : 'password'}
          placeholder={t('auth.placeholderContrasena')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={esReclamo || isSignUp ? 'new-password' : 'current-password'}
          className="auth-modal__input auth-modal__input--ojo"
        />
        {/* El ojo vive DENTRO de la casilla: el boton de texto de antes empujaba el
            formulario hacia abajo y se leia como un paso mas del registro. */}
        <button
          type="button"
          onClick={() => setVerContrasena(!verContrasena)}
          className="auth-modal__ojo"
          aria-label={verContrasena ? t('auth.ocultarContrasena') : t('auth.mostrarContrasena')}
          title={verContrasena ? t('auth.ocultarContrasena') : t('auth.mostrarContrasena')}
        >
          {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {ayudaContrasena && <p className="auth-modal__link-desc">{ayudaContrasena}</p>}

      {mostrarContacto && (
        <>
          <div className="auth-modal__input-group">
            <Mail size={16} className="auth-modal__input-icon" />
            <input
              type="email"
              placeholder={t('auth.placeholderCorreoContacto')}
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              autoComplete="email"
              className="auth-modal__input"
            />
          </div>
          <p className="auth-modal__link-desc">{t('auth.ayudaCorreoContacto')}</p>
          {/* El aviso va aqui, pegado al correo opcional: es justo lo que se pierde si
              olvida la contrasena y no dejo ninguno. */}
          <p className="auth-modal__link-desc">{t('auth.guardaContrasena')}</p>
        </>
      )}

      {disponible && (
        <div className={disponible.libre ? 'auth-modal__alert--success' : 'auth-modal__alert--error'}>
          {disponible.libre ? t('auth.usuarioDisponible') : t('auth.usuarioCogido')}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary auth-modal__btn-submit"
        disabled={loading || !puedeEnviar}
      >
        <LogIn size={16} />
        <span>{esReclamo || isSignUp ? t('auth.registrarse') : t('auth.iniciarSesion')}</span>
      </button>
    </form>
  );

  // Correo real y Google: las vias que ya funcionaban, ahora detras del interruptor.
  const panelSecundario = modoCorreo ? (
    <div className="auth-modal__link-section">
      <button
        onClick={handleGoogleAuth}
        className="auth-modal__btn-google auth-modal__btn-google--sm"
        disabled={loading}
      >
        <Google width="16" height="16" />
        <span>{esReclamo ? t('auth.vincularGoogle') : t('auth.continuarGoogle')}</span>
      </button>

      <div className="auth-modal__divider">
        <span>{t('auth.oConCorreo')}</span>
      </div>

      <form
        onSubmit={esReclamo ? handleLinkEmail : handleEmailAuth}
        className="auth-modal__form auth-modal__form--compact"
      >
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
            placeholder={esReclamo ? t('auth.placeholderNuevaContrasena') : t('auth.placeholderContrasena')}
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
          <span>{esReclamo ? t('auth.vincularCorreo') : (isSignUp ? t('auth.registrarse') : t('auth.iniciarSesion'))}</span>
        </button>
      </form>
    </div>
  ) : null;

  const interruptorSecundario = (
    <div className="auth-modal__toggle-container">
      <button
        type="button"
        onClick={() => { setModoCorreo(!modoCorreo); setError(null); setMessage(null); }}
        className="auth-modal__toggle"
        aria-expanded={modoCorreo}
      >
        {t('auth.otrosMetodos')}
      </button>
    </div>
  );

  return (
    <Modal onClose={onClose} className="modal-content glass-panel auth-modal__content">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal__header">
          <ShieldCheck size={44} color="#10b981" className="auth-modal__header-icon" />
          <h2 className="auth-modal__title">
            {user ? (esReclamo ? t('auth.conectadoComoInvitado') : t('auth.sincronizacionNube')) : (isSignUp ? t('auth.crearCuenta') : t('auth.iniciarSesion'))}
          </h2>
          <p className="auth-modal__subtitle">
            {user
              ? (esReclamo ? t('auth.guardadoLocal') : (identidad ? t('auth.conectadoComo', { email: identidad }) : t('auth.sincronizadoNube')))
              : t('auth.subtituloInvitado')}
          </p>
        </div>

        {user ? (
          <div className="auth-modal__body">
            {/* La tarjeta solo para cuentas: al invitado le decia "sincronizado en la nube"
                justo debajo de "guardado solo en este dispositivo". Su progreso si sube, pero
                la llave para volver a el vive en este navegador, y eso no se promete. */}
            {!esReclamo && (
              <div className="auth-modal__status-card">
                <div className="auth-modal__status-title">{t('auth.sincronizadoNube')}</div>
                <div className="auth-modal__status-text">
                {t('auth.cambioAutomatico')}
                </div>
              </div>
            )}

            {esReclamo && (
              <div className="auth-modal__link-section">
                <div className="auth-modal__link-title">
                  {t('auth.convierteCuenta')}
                </div>

                <Alertas error={error} message={message} />

                {formularioUsuario}

                <div className="auth-modal__toggle-container">
                  <button
                    type="button"
                    onClick={handleCambiarAEntrada}
                    className="auth-modal__toggle"
                    disabled={loading}
                  >
                    {t('auth.yaTienesUsuario')}
                  </button>
                </div>

                {interruptorSecundario}
                {panelSecundario}
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

            <Alertas error={error} message={message} />

            {formularioUsuario}

            <div className="auth-modal__toggle-container">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="auth-modal__toggle"
              >
                {isSignUp ? t('auth.yaTienesCuenta') : t('auth.noTienesCuenta')}
              </button>
            </div>

            {interruptorSecundario}
            {panelSecundario}
          </div>
        )}
    </Modal>
  );
}
