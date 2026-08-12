import React from 'react';
import { X, ShieldCheck, Cookie, Database, Key, Globe } from 'lucide-react';

export function PrivacyPolicyModal({ onClose, onOpenPreferences }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel privacy-policy-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="privacy-policy-modal__header">
          <ShieldCheck size={44} color="#3b82f6" className="privacy-policy-modal__icon" />
          <h2 className="privacy-policy-modal__title">Guía de Gestión de Cookies y Privacidad</h2>
          <p className="privacy-policy-modal__subtitle">
            Transparencia total sobre los datos y cookies que utilizamos en Fortnite Spritedex.
          </p>
        </div>

        <div className="privacy-policy-modal__body">
          {/* Sección 1: ¿Qué son las cookies? */}
          <div className="privacy-policy-section">
            <h3 className="privacy-policy-section__title">
              <Cookie size={16} color="#60a5fa" />
              <span>1. ¿Qué son las cookies y el almacenamiento local?</span>
            </h3>
            <p className="privacy-policy-section__text">
              Las cookies y el almacenamiento local (<code className="auth-modal__code">localStorage</code>) son pequeñas cantidades de información que se guardan de forma segura en tu navegador para recordar tus preferencias y mantener tu sesión activa.
            </p>
          </div>

          {/* Sección 2: Tecnologías que utiliza nuestro sistema */}
          <div className="privacy-policy-section">
            <h3 className="privacy-policy-section__title">
              <Key size={16} color="#34d399" />
              <span>2. Tecnologías utilizadas en este sitio</span>
            </h3>
            
            <div className="privacy-policy-card">
              <div className="privacy-policy-card__header">
                <strong>Autenticación de Google (OAuth)</strong>
                <span className="privacy-policy-badge privacy-policy-badge--blue">Terceros / Esencial</span>
              </div>
              <p className="privacy-policy-card__desc">
                Si eliges registrarte o iniciar sesión con Google, Google utiliza cookies seguras para verificar tu identidad sin que tengamos acceso a tu contraseña.
              </p>
            </div>

            <div className="privacy-policy-card">
              <div className="privacy-policy-card__header">
                <strong>Supabase Cloud Session</strong>
                <span className="privacy-policy-badge privacy-policy-badge--green">Esencial</span>
              </div>
              <p className="privacy-policy-card__desc">
                Almacena el token de sesión encriptado para que tu colección de Sprites se sincronice automáticamente entre tu celular y tu computadora.
              </p>
            </div>

            <div className="privacy-policy-card">
              <div className="privacy-policy-card__header">
                <strong>Almacenamiento Local (Local Storage)</strong>
                <span className="privacy-policy-badge privacy-policy-badge--purple">Propio / Local</span>
              </div>
              <p className="privacy-policy-card__desc">
                Guarda tus Sprites atrapados, maxeados y tus filtros preferidos localmente para que puedas usar la app aun sin conexión.
              </p>
            </div>
          </div>

          {/* Sección 3: Cómo gestionarlas en tu navegador */}
          <div className="privacy-policy-section">
            <h3 className="privacy-policy-section__title">
              <Globe size={16} color="#facc15" />
              <span>3. ¿Cómo controlar las cookies en tu navegador?</span>
            </h3>
            <p className="privacy-policy-section__text">
              Puedes permitir, bloquear o eliminar las cookies instaladas en tu dispositivo mediante la configuración de las opciones de tu navegador web:
            </p>
            <ul className="privacy-policy-list">
              <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies y otros datos de sitios.</li>
              <li><strong>Safari (iOS/Mac):</strong> Ajustes → Safari → Privacidad y seguridad → Bloquear todas las cookies.</li>
              <li><strong>Firefox:</strong> Ajustes → Privacidad y seguridad → Cookies y datos del sitio.</li>
            </ul>
          </div>
        </div>

        <div className="privacy-policy-modal__footer">
          {onOpenPreferences && (
            <button
              onClick={() => {
                onClose();
                onOpenPreferences();
              }}
              className="privacy-btn privacy-btn--secondary"
            >
              Configurar preferencias
            </button>
          )}
          <button onClick={onClose} className="privacy-btn privacy-btn--accept">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
