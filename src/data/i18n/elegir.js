// Eleccion pura de textos y nombres por idioma. Sin imports de JSON para que node --test la
// cargue directamente: spritesData.js le pasa los diccionarios.

// Idiomas que muestran el nombre oficial en ingles. pt-BR y pt-PT lo hacen de forma TEMPORAL:
// no hay fuente de nombres en portugues en el repo. Quitarlos de aqui cuando la haya.
export const IDIOMAS_NOMBRE_EN = ['en', 'pt-BR', 'pt-PT'];

// Texto de los datos del juego. El diccionario va por texto en español:
// { 'Texto es': { en, 'pt-BR', 'pt-PT' } }. Si falta el idioma, se devuelve el español.
export function elegirTextoJuego(traducciones, valor, lang) {
  if (!valor || lang === 'es') return valor;
  const entrada = traducciones[valor];
  return (entrada && entrada[lang]) || valor;
}

// Nombre de familia: en los idiomas de IDIOMAS_NOMBRE_EN se usa el mapa en ingles.
export function elegirNombreFamilia(familyId, lang, nombresEs, nombresEn) {
  if (!familyId) return '';
  if (IDIOMAS_NOMBRE_EN.includes(lang)) return nombresEn[familyId] || nombresEs[familyId] || familyId;
  return nombresEs[familyId] || familyId;
}
