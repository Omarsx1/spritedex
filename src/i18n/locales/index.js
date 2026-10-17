// Los tres idiomas. Se importan como modulos planos (no JSON) para que las pruebas de
// node --test puedan cargarlos sin atributos de importacion.
import es from './es.js';
import en from './en.js';
import ptBR from './pt-BR.js';

export const DICCIONARIOS = { es, en, 'pt-BR': ptBR };
export { es, en, ptBR };
