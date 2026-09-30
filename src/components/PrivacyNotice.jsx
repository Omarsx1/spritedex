import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ShieldCheck, X, Check, Cookie, Settings } from 'lucide-react';
import { t } from '../i18n';

const PrivacyPolicyModal = lazy(() => import('./PrivacyPolicyModal').then(m => ({ default: m.PrivacyPolicyModal })));

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
              title={t('privacidad.aviso.cerrar')}
              aria-label={t('privacidad.aviso.cerrarAria')}
            >
              <X size={18} />
            </button>

            <div className="privacy-panel__header">
              <ShieldCheck size={22} className="privacy-panel__icon" />
              <h3 className="privacy-panel__title">{t('privacidad.aviso.titulo')}</h3>
            </div>

            <p className="privacy-panel__text">
              {t('privacidad.aviso.texto')}
            </p>

            <p className="privacy-panel__subtext">
              {t('privacidad.aviso.subtextoA')}{' '}
              <span
                className="privacy-panel__link"
                onClick={() => setShowPolicyModal(true)}
                title={t('privacidad.aviso.abrirGuia')}
              >
                {t('privacidad.aviso.enlace')}
              </span>.
            </p>

            {/* Modal / Sección de Personalización */}
            {showPersonalize && (
              <div className="privacy-panel__personalize">
                <div className="privacy-option">
                  <div className="privacy-option__info">
                    <span className="privacy-option__name">{t('privacidad.aviso.esencialesNombre')}</span>
                    <span className="privacy-option__desc">{t('privacidad.aviso.esencialesDesc')}</span>
                  </div>
                  <input type="checkbox" checked disabled className="privacy-checkbox" />
                </div>

                <div className="privacy-option">
                  <div className="privacy-option__info">
                    <span className="privacy-option__name">{t('privacidad.aviso.analiticaNombre')}</span>
                    <span className="privacy-option__desc">{t('privacidad.aviso.analiticaDesc')}</span>
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
                    <span className="privacy-option__name">{t('privacidad.aviso.personalizacionNombre')}</span>
                    <span className="privacy-option__desc">{t('privacidad.aviso.personalizacionDesc')}</span>
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
                  {t('privacidad.aviso.guardarPreferencias')}
                </button>
              </div>
            )}

            {/* Botones de acción */}
            <div className="privacy-panel__actions">
              <button
                onClick={() => setShowPersonalize(!showPersonalize)}
                className="privacy-btn privacy-btn--secondary"
              >
                {showPersonalize ? t('privacidad.aviso.ocultarOpciones') : t('privacidad.aviso.personalizarOpciones')}
              </button>

              <div className="privacy-panel__btn-group">
                <button
                  onClick={handleRejectAll}
                  className="privacy-btn privacy-btn--reject"
                >
                  {t('privacidad.aviso.rechazarTodo')}
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="privacy-btn privacy-btn--accept"
                >
                  {t('privacidad.aviso.aceptarTodo')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal explicativo de Gestión de Cookies */}
      {showPolicyModal && (
        <Suspense fallback={null}>
          <PrivacyPolicyModal
            onClose={() => setShowPolicyModal(false)}
            onOpenPreferences={() => {
              setIsVisible(true);
              setShowPersonalize(true);
            }}
          />
        </Suspense>
      )}
    </>
  );
}
