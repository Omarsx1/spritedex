/**
 * Detecta de forma precisa el entorno y navegador del usuario.
 * Permite optimizar animaciones pesadas en iOS/Safari para evitar estrangulamiento térmico,
 * mientras activa 100% de los efectos dinámicos en Android, Chrome y Chromium.
 */
export const isSafariOrIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  return isIOS || isSafari;
};

export const isAndroidOrChromium = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  const isAndroid = ua.includes('android');
  const isChrome = ua.includes('chrome') || ua.includes('chromium');
  return isAndroid || (isChrome && !isSafariOrIOS());
};

// Inicializa las clases en el body para control por CSS
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (isSafariOrIOS()) {
    document.body.classList.add('is-safari-ios');
  } else {
    document.body.classList.add('is-android-chromium');
  }
}
