// Los dos idiomas. Se importan como modulos planos (no JSON) para que las pruebas de
// node --test puedan cargarlos sin atributos de importacion.
import es from './es.js';
import en from './en.js';

export const DICCIONARIOS = { es, en };
export { es, en };
