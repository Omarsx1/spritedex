import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, Cookie, Settings } from 'lucide-react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

const LOCAL_STORAGE_PRIVACY_KEY = 'fortnite_sprites_privacy_notice_v1';

export function PrivacyNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Preference options for personalization
  const [preferences, setPreferences] = useState({
    essential: true, // Always required for auth & cloud sync
    analytics: true,
    personalized: true
  });

  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem(LOCAL_STORAGE_PRIVACY_KEY);
      if (!savedConsent) {
        setIsVisible(true);
      }
    } catch (e) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      personalized: true,
      status: 'accepted_all',
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const handleRejectAll = () => {
    const consent = {
      essential: true,
      analytics: false,
      personalized: false,
      status: 'rejected_all',
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const handleSaveCustom = () => {
    const consent = {
      ...preferences,
      essential: true,
      status: 'customized',
      timestamp: new Date().toISOString()
    };
    saveConsent(consent);
  };

  const saveConsent = (consentData) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_KEY, JSON.stringify(consentData));
    } catch (e) {
      console.error('Error saving privacy preferences:', e);
    }
    setIsVisible(false);
  };

  return (
    <>
      {isVisible && (
        <div className="privacy-panel-overlay">
          <div className="privacy-panel glass-panel">
            <button
              className="privacy-panel__close"
              onClick={handleRejectAll}
              title="Cerrar"
              aria-label="Cerrar aviso de privacidad"
            >
              <X size={18} />
            </button>

            <div className="privacy-panel__header">
              <ShieldCheck size={22} className="privacy-panel__icon" />
              <h3 className="privacy-panel__title">Uso de Cookies y Privacidad</h3>
            </div>

            <p className="privacy-panel__text">
              Utilizamos cookies, incluidas cookies de terceros (como Google Sign-In y Supabase), para fines operativos, mantener tu sesión activa, guardar tu progreso en la nube, análisis estadísticos y personalizar tu experiencia.
            </p>

            <p className="privacy-panel__subtext">
              Para más información sobre los tipos de cookies y cómo se gestionan en nuestro sitio web, consulta nuestra guía dedicada a la{' '}
              <span
                className="privacy-panel__link"
                onClick={() => setShowPolicyModal(true)}
                title="Abrir guía de gestión de cookies"
              >
                gestión de cookies
              </span>.
            </p>

            {/* Modal / Sección de Personalización */}
            {showPersonalize && (
              <div className="privacy-panel__personalize">
                <div className="privacy-option">
                  <div className="privacy-option__info">
                    <span className="privacy-option__name">Esenciales (Google / Supabase)</span>
                    <span className="privacy-option__desc">Requeridas para el inicio de sesión y sincronización en la nube.</span>
                  </div>
                  <input type="checkbox" checked disabled className="privacy-checkbox" />
                </div>

                <div className="privacy-option">
                  <div className="privacy-option__info">
                    <span className="privacy-option__name">Análisis y Rendimiento</span>
                    <span className="privacy-option__desc">Permite analizar el rendimiento del sitio y optimizar la app.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="privacy-checkbox"
                  />
                </div>

                <div className="privacy-option">
                  <div className="privacy-option__info">
                    <span className="privacy-option__name">Personalización de Experiencia</span>
                    <span className="privacy-option__desc">Guarda tus preferencias de interfaz y filtros personalizados.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.personalized}
                    onChange={(e) => setPreferences(prev => ({ ...prev, personalized: e.target.checked }))}
                    className="privacy-checkbox"
                  />
                </div>

                <button
                  onClick={handleSaveCustom}
                  className="privacy-btn privacy-btn--save"
                >
                  Guardar mis preferencias
                </button>
              </div>
            )}

            {/* Botones de acción */}
            <div className="privacy-panel__actions">
              <button
                onClick={() => setShowPersonalize(!showPersonalize)}
                className="privacy-btn privacy-btn--secondary"
              >
                {showPersonalize ? 'Ocultar opciones' : 'Personalizar opciones'}
              </button>

              <div className="privacy-panel__btn-group">
                <button
                  onClick={handleRejectAll}
                  className="privacy-btn privacy-btn--reject"
                >
                  Rechazar todo
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="privacy-btn privacy-btn--accept"
                >
                  Aceptar todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal explicativo de Gestión de Cookies */}
      {showPolicyModal && (
        <PrivacyPolicyModal
          onClose={() => setShowPolicyModal(false)}
          onOpenPreferences={() => {
            setIsVisible(true);
            setShowPersonalize(true);
          }}
        />
      )}
    </>
  );
}
