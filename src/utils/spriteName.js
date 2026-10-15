// Nombre visible de un espiritu segun el idioma activo.
// Vive aparte (y sin dependencias de datos) porque el canvas tambien lo usa y las pruebas
// de node importan el canvas: ahi no puede entrar el catalogo en JSON.
import { getLang } from '../i18n/texto.js';
import { IDIOMAS_NOMBRE_EN } from '../data/i18n/elegir.js';

export function pickName(sprite, lang = getLang()) {
  if (!sprite) return '';
  const espanol = sprite.fullName || sprite.name || '';
  if (lang === 'pt-BR') return sprite.fullNamePtBr || sprite.fullNameEn || espanol;
  if (!IDIOMAS_NOMBRE_EN.includes(lang)) return espanol;
  return sprite.fullNameEn || espanol;
}
