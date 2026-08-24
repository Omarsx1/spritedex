import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Cookie, Key, Globe, Check, Sliders, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_PRIVACY_KEY = 'fortnite_sprites_privacy_notice_v1';

export function PrivacyPolicyModal({ onClose, initialTab = 'preferences' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'preferences' | 'guide'
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Preference state
  const [preferences, setPreferences] = useState({
    essential: true, // Always required for auth & cloud sync
    analytics: true,
    personalized: true
  });

  // Load existing preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRIVACY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({
          essential: true,
          analytics: parsed.analytics !== false,
          personalized: parsed.personalized !== false
        });
      }
    } catch {}
  }, []);

  const handleSavePreferences = () => {
    try {
      const consentData = {
        ...preferences,
        essential: true,
        status: 'customized',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_KEY, JSON.stringify(consentData));
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (e) {
      console.error('Error saving cookies preferences:', e);
      onClose();
    }
  };

  const handleAcceptAll = () => {
    try {
      const consentData = {
        essential: true,
        analytics: true,
        personalized: true,
        status: 'accepted_all',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_KEY, JSON.stringify(consentData));
      setPreferences({ essential: true, analytics: true, personalized: true });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel privacy-policy-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="privacy-policy-modal__header" style={{ textAlign: 'center', paddingBottom: '12px' }}>
          <ShieldCheck size={42} color="#00F0E8" className="privacy-policy-modal__icon" />
          <h2 className="privacy-policy-modal__title" style={{ margin: '8px 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
            Centro de Privacidad & Cookies
          </h2>
          <p className="privacy-policy-modal__subtitle" style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8' }}>
            Controla y personaliza las tecnologías de almacenamiento en tu navegador.
          </p>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '4px',
            borderRadius: '12px',
            marginTop: '16px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'preferences' ? 'rgba(0, 240, 232, 0.18)' : 'transparent',
                color: activeTab === 'preferences' ? '#00F0E8' : '#94A3B8',
                fontWeight: activeTab === 'preferences' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sliders size={14} />
              <span>Configurar Preferencias</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'guide' ? 'rgba(0, 240, 232, 0.18)' : 'transparent',
                color: activeTab === 'guide' ? '#00F0E8' : '#94A3B8',
                fontWeight: activeTab === 'guide' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Cookie size={14} />
              <span>Guía de Transparencia</span>
            </button>
          </div>
        </div>

        <div className="privacy-policy-modal__body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px 0' }}>
          {activeTab === 'preferences' ? (
            /* ═══ TAB 1: INTERACTIVE COOKIE PREFERENCE TOGGLES ═══ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Option 1: Essential Cookies */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>Cookies Esenciales & Sesión</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                      Requeridas
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Permiten el inicio de sesión con Google / Supabase y la sincronización segura de tu colección en la nube.
                  </p>
                </div>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  Siempre Activo
                </div>
              </div>

              {/* Option 2: Analytics & Metrics */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>Análisis y Telemetría Anónima</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', color: '#38BDF8' }}>
                      Rendimiento
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Registra datos anónimos de tráfico, tipo de dispositivo (iPhone/Android/PC) y visitas para mejorar la aplicación.
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    background: preferences.analytics ? '#00F0E8' : 'rgba(255, 255, 255, 0.15)',
                    transition: '0.2s',
                    boxShadow: preferences.analytics ? '0 0 10px rgba(0, 240, 232, 0.4)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: preferences.analytics ? '23px' : '3px',
                      bottom: '3px',
                      borderRadius: '50%',
                      background: preferences.analytics ? '#060714' : '#FFFFFF',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Option 3: Personalization & Filters */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#FFFFFF' }}>Personalización Local</strong>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
                      Experiencia
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    Recuerda tu última pestaña seleccionada, filtros de búsqueda, modo de vista móvil y ajustes visuales.
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preferences.personalized}
                    onChange={(e) => setPreferences(prev => ({ ...prev, personalized: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    background: preferences.personalized ? '#00F0E8' : 'rgba(255, 255, 255, 0.15)',
                    transition: '0.2s',
                    boxShadow: preferences.personalized ? '0 0 10px rgba(0, 240, 232, 0.4)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: preferences.personalized ? '23px' : '3px',
                      bottom: '3px',
                      borderRadius: '50%',
                      background: preferences.personalized ? '#060714' : '#FFFFFF',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          ) : (
            /* ═══ TAB 2: TRANSPARENCY & BROWSER GUIDE ═══ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="privacy-policy-section">
                <h3 className="privacy-policy-section__title">
                  <Cookie size={16} color="#00F0E8" />
                  <span>1. ¿Qué es el almacenamiento local (localStorage)?</span>
                </h3>
                <p className="privacy-policy-section__text">
                  El almacenamiento local (<code className="auth-modal__code">localStorage</code>) guarda de forma segura en tu propio dispositivo tus espíritus marcados y favoritos para que puedas jugar aun sin conexión a internet.
                </p>
              </div>

              <div className="privacy-policy-section">
                <h3 className="privacy-policy-section__title">
                  <Key size={16} color="#34d399" />
                  <span>2. Servicios y Tecnologías en la Nube</span>
                </h3>
                <div className="privacy-policy-card">
                  <div className="privacy-policy-card__header">
                    <strong>Autenticación de Google (OAuth) & Supabase</strong>
                    <span className="privacy-policy-badge privacy-policy-badge--blue">Esencial</span>
                  </div>
                  <p className="privacy-policy-card__desc">
                    Si inicias sesión, se utiliza una cookie de sesión encriptada para sincronizar tu colección entre tu móvil y PC sin acceder a tus contraseñas.
                  </p>
                </div>
              </div>

              <div className="privacy-policy-section">
                <h3 className="privacy-policy-section__title">
                  <Globe size={16} color="#facc15" />
                  <span>3. Cómo gestionar cookies en tu navegador</span>
                </h3>
                <ul className="privacy-policy-list">
                  <li><strong>Google Chrome:</strong> Configuración → Privacidad y seguridad → Cookies.</li>
                  <li><strong>Safari (iOS / macOS):</strong> Ajustes → Safari → Privacidad y seguridad.</li>
                  <li><strong>Firefox:</strong> Ajustes → Privacidad y seguridad → Cookies y datos.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="privacy-policy-modal__footer" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {activeTab === 'preferences' ? (
            <>
              <button
                type="button"
                onClick={handleAcceptAll}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#EDEDED',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Aceptar Todo
              </button>

              <button
                type="button"
                onClick={handleSavePreferences}
                style={{
                  flex: 1.4,
                  padding: '11px 18px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00F0E8, #0284C7)',
                  color: '#060714',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(0, 240, 232, 0.35)'
                }}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 size={16} color="#060714" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Guardar Preferencias</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              style={{
                width: '100%',
                padding: '11px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00F0E8, #0284C7)',
                color: '#060714',
                border: 'none',
                fontSize: '0.86rem',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Configurar Mis Preferencias
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

