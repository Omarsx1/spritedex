// Los cuatro idiomas. Se importan como modulos planos (no JSON) para que las pruebas de
// node --test puedan cargarlos sin atributos de importacion.
import es from './es.js';
import en from './en.js';
import ptBR from './pt-BR.js';
import ptPT from './pt-PT.js';

export const DICCIONARIOS = { es, en, 'pt-BR': ptBR, 'pt-PT': ptPT };
export { es, en, ptBR, ptPT };
