import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

const STORAGE_KEY = 'spritedex_install_dismissed_v1';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Check if user previously dismissed prompt
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Delay showing prompt slightly for smoother initial render
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Desktop PWA prompt listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDismiss = () => {
    sounds.playBeep?.();
    setShowPrompt(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleInstallClick = async () => {
    sounds.playBeep?.();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        try {
          localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {}
      }
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt-overlay" onClick={handleDismiss}>
      <div className="install-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="install-prompt-close"
          onClick={handleDismiss}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        <div className="install-prompt-header">
          <div className="install-prompt-icon-wrap">
            <Smartphone size={22} color="#00F0E8" />
          </div>
          <div>
            <div className="install-prompt-badge">⚡ APP OFICIAL SPRITEDEX</div>
            <h3 className="install-prompt-title">Instalar como Acceso Directo</h3>
          </div>
        </div>

        <p className="install-prompt-desc">
          Disfruta de la mejor experiencia a pantalla completa, carga instantánea y sin barras de navegador.
        </p>

        {isIOS ? (
          <div className="install-prompt-ios-guide">
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">1</span>
              <span>
                Toca el botón <strong>Compartir</strong> <Share size={14} className="inline-icon" /> en la barra de Safari.
              </span>
            </div>
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">2</span>
              <span>
                Baja y selecciona <strong>"Agregar al inicio"</strong> <PlusSquare size={14} className="inline-icon" />.
              </span>
            </div>
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">3</span>
              <span>¡Listo! Ábrelo desde tu pantalla de inicio como una App.</span>
            </div>

            <button className="install-prompt-btn-done" onClick={handleDismiss}>
              <Check size={16} />
              <span>¡Entendido!</span>
            </button>
          </div>
        ) : (
          <div className="install-prompt-android-actions">
            <button className="install-prompt-btn-install" onClick={handleInstallClick}>
              <Download size={16} />
              <span>Instalar en mi Dispositivo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
