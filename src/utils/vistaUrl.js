// Estado de la vista en la URL: generacion, busqueda, filtros, orden y modo de vista.
//
// Sin esto la vista vivia solo en memoria: recargar devolvia siempre a la 2ª generacion con
// los filtros limpios y no habia forma de compartir "mira esta lista filtrada". Con la URL
// como fuente de verdad el enlace se comparte, atras/adelante del navegador funcionan y una
// recarga te deja donde estabas.
//
// Modulo puro (sin DOM ni React) para poder probarlo con node --test, igual que el resto de
// helpers: entra y sale una cadena de query, nunca un objeto window.
//
// Los parametros que NO son de la vista (friend, studio, perf, halloween...) se conservan
// intactos: aqui solo se tocan las claves de VISTA_POR_DEFECTO.

export const GENERACIONES_VALIDAS = ['0', '1', '2'];
export const VISTAS_VALIDAS = ['grid', 'list'];

// Lo que se considera "vista sin tocar": nada de esto se escribe en la URL, asi que una vista
// por defecto deja la barra de direcciones limpia.
export const VISTA_POR_DEFECTO = Object.freeze({
  gen: '2',
  q: '',
  tema: 'all',
  familia: 'all',
  estado: 'all',
  orden: 'default',
  lanzados: '0',
  vista: 'grid',
});

const CLAVES = Object.keys(VISTA_POR_DEFECTO);

function texto(valor) {
  return String(valor == null ? '' : valor).trim();
}

function textoBooleano(valor) {
  return valor === true || valor === 1 || valor === '1' ? '1' : '0';
}

// Deja cualquier entrada (params de la URL o el estado de React) en la forma canonica. Lo que
// no encaja cae al valor por defecto en vez de romper la vista: una URL vieja o editada a
// mano nunca debe dejar la app en un estado imposible.
export function normalizarVista(entrada = {}) {
  const gen = texto(entrada.gen);
  const vista = texto(entrada.vista);
  return {
    gen: GENERACIONES_VALIDAS.indexOf(gen) !== -1 ? gen : VISTA_POR_DEFECTO.gen,
    q: texto(entrada.q),
    tema: texto(entrada.tema) || VISTA_POR_DEFECTO.tema,
    familia: texto(entrada.familia) || VISTA_POR_DEFECTO.familia,
    estado: texto(entrada.estado) || VISTA_POR_DEFECTO.estado,
    orden: texto(entrada.orden) || VISTA_POR_DEFECTO.orden,
    lanzados: textoBooleano(entrada.lanzados),
    vista: VISTAS_VALIDAS.indexOf(vista) !== -1 ? vista : VISTA_POR_DEFECTO.vista,
  };
}

export function leerVista(search = '') {
  const params = new URLSearchParams(texto(search).replace(/^[?]/, ''));
  const entrada = {};
  for (const clave of CLAVES) entrada[clave] = params.get(clave);
  return normalizarVista(entrada);
}

// Devuelve la cadena de query (?a=1&b=2) lista para pegar al pathname. Solo escribe lo que se
// sale de lo por defecto, para que la URL no se llene de ruido.
export function escribirVista(vista = {}, search = '') {
  const normal = normalizarVista(vista);
  const params = new URLSearchParams(texto(search).replace(/^[?]/, ''));
  for (const clave of CLAVES) {
    if (normal[clave] === VISTA_POR_DEFECTO[clave]) params.delete(clave);
    else params.set(clave, normal[clave]);
  }
  const query = params.toString();
  return query ? '?' + query : '';
}

// Une pathname + query + hash respetando el idioma de la ruta (/en/...) y sin tocar el resto.
export function urlConVista(vista, search = '', origen = {}) {
  const pathname = origen.pathname || '/';
  const hash = origen.hash || '';
  return pathname + escribirVista(vista, search) + hash;
}

