import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import { sounds } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import { t } from '../i18n';

const STORAGE_KEY = 'spritedex_install_dismissed_v1';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [manualChromeGuide, setManualChromeGuide] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
    setIsIOS(isIOSDevice);

    // 3. Check if user previously dismissed automatic prompt
    if (!safeStorage.getItem(STORAGE_KEY)) {
      if (isIOSDevice) {
        const timer = setTimeout(() => setShowPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    }

    // 4. Android / Chrome / Desktop PWA prompt listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!safeStorage.getItem(STORAGE_KEY)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // 5. Escuchar evento manual para abrir la guía desde el menú en cualquier momento
  useEffect(() => {
    const handleManualOpen = () => {
      const ua = window.navigator.userAgent || '';
      const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
      setIsIOS(isIOSDevice);
      setShowPrompt(true);
    };

    window.addEventListener('spritedex:open-install-prompt', handleManualOpen);
    return () => window.removeEventListener('spritedex:open-install-prompt', handleManualOpen);
  }, []);

  const handleDismiss = () => {
    sounds.playBeep?.();
    setShowPrompt(false);
    setManualChromeGuide(false);
    safeStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleInstallClick = async () => {
    sounds.playBeep?.();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        safeStorage.setItem(STORAGE_KEY, 'true');
      }
      setDeferredPrompt(null);
    } else {
      // Si el navegador ya consumió el prompt nativo, mostrar guía manual de Chrome
      setManualChromeGuide(true);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt-overlay" onClick={handleDismiss}>
      <div className="install-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button
          className="install-prompt-close"
          onClick={handleDismiss}
          aria-label={t('instalar.cerrar')}
        >
          <X size={16} />
        </button>

        <div className="install-prompt-header">
          <div className="install-prompt-icon-wrap">
            <Smartphone size={22} color="#00F0E8" />
          </div>
          <div>
            <div className="install-prompt-badge">{t('instalar.badge')}</div>
            <h3 className="install-prompt-title">{t('instalar.titulo')}</h3>
          </div>
        </div>

        <p className="install-prompt-desc">
          {t('instalar.descripcion')}
        </p>

        {isIOS ? (
          <div className="install-prompt-ios-guide">
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">1</span>
              <span>
                {t('instalar.ios1Prefijo')} <strong>{t('instalar.ios1Boton')}</strong> <Share size={14} className="inline-icon" /> {t('instalar.ios1Sufijo')}
              </span>
            </div>
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">2</span>
              <span>
                {t('instalar.ios2Prefijo')} <strong>{t('instalar.ios2Boton')}</strong> <PlusSquare size={14} className="inline-icon" />.
              </span>
            </div>
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">3</span>
              <span>{t('instalar.ios3')}</span>
            </div>

            <button className="install-prompt-btn-done" onClick={handleDismiss}>
              <Check size={16} />
              <span>{t('instalar.entendido')}</span>
            </button>
          </div>
        ) : manualChromeGuide ? (
          <div className="install-prompt-ios-guide">
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">1</span>
              <span>{t('instalar.chrome1Prefijo')} <strong>{t('instalar.chrome1Negrita')}</strong> {t('instalar.chrome1Sufijo')}</span>
            </div>
            <div className="install-prompt-step">
              <span className="install-prompt-step-num">2</span>
              <span>{t('instalar.chrome2Prefijo')} <strong>{t('instalar.chrome2A')}</strong> {t('instalar.chrome2O')} <strong>{t('instalar.chrome2B')}</strong>.</span>
            </div>
            <button className="install-prompt-btn-done" onClick={handleDismiss}>
              <Check size={16} />
              <span>{t('instalar.entendido')}</span>
            </button>
          </div>
        ) : (
          <div className="install-prompt-android-actions">
            <button className="install-prompt-btn-install" onClick={handleInstallClick}>
              <Download size={16} />
              <span>{t('instalar.instalarDispositivo')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
