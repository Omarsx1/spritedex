// Calentador de miniaturas por delante del viewport (grid de escritorio).
//
// Bajo red lenta la tarjeta entra al viewport con el hueco vacio: el navegador pide el arte
// cuando ya es visible. Este modulo pide en segundo plano el arte de las tarjetas que estan por
// entrar, con una ventana acotada por delante, concurrencia 2 y prioridad baja, para que lo que
// el usuario esta mirando siempre gane el ancho de banda.
//
// Es aditivo: si no corre o falla, la app se comporta igual que sin el.

const VENTANA = 30;
const RITMO_MS = 120;
const MAX_EN_VUELO = 2;

// Registro de destellos para el arnes de medicion: scripts/measure-scroll-cards.mjs lo lee
// desde la pagina (window.__spriteWarmLog).
const REGISTRO_CALENTADOS = [];
if (typeof window !== 'undefined') {
  window.__spriteWarmLog = REGISTRO_CALENTADOS;
}

// Sin IntersectionObserver o con listas desalineadas (vista lista / swiper movil) no hay nada
// seguro que calentar: se devuelve un no-op y no se toca nada.
export function iniciarCalentador(elementos, urls) {
  const sinEfecto = () => {};
  if (typeof IntersectionObserver !== 'function') return sinEfecto;
  if (!Array.isArray(elementos) || !Array.isArray(urls)) return sinEfecto;
  if (elementos.length === 0 || elementos.length !== urls.length) return sinEfecto;

  // El indice se resuelve por elemento, nunca por posicion en el callback: las entradas pueden
  // llegar desordenadas o tardias.
  const indicePorElemento = new Map();
  elementos.forEach((elemento, indice) => indicePorElemento.set(elemento, indice));

  const pendientes = [];
  const yaCalentados = new Set();
  const enVuelo = new Set();
  let indiceMaximo = -1;
  let temporizador = null;
  let vivo = true;

  // Un arranque cada RITMO_MS y tope de 2 en vuelo: el arte visible no compite por el ancho de
  // banda con estas peticiones de baja prioridad.
  const planificar = () => {
    if (!vivo || temporizador !== null || document.hidden) return;
    if (enVuelo.size >= MAX_EN_VUELO || pendientes.length === 0) return;
    temporizador = setTimeout(arrancarSiguiente, RITMO_MS);
  };

  const arrancarSiguiente = () => {
    temporizador = null;
    if (!vivo || document.hidden || enVuelo.size >= MAX_EN_VUELO || pendientes.length === 0) return;
    const indice = pendientes.shift();
    yaCalentados.add(indice);
    const img = new Image();
    img.fetchPriority = 'low';
    img.decoding = 'async';
    const soltar = () => {
      img.onload = null;
      img.onerror = null;
      enVuelo.delete(img);
      planificar();
    };
    img.onload = soltar;
    img.onerror = soltar;
    enVuelo.add(img);
    REGISTRO_CALENTADOS.push({
      i: indice,
      url: new URL(urls[indice], document.baseURI).href,
      t: performance.now()
    });
    img.src = urls[indice];
    planificar();
  };

  // La ventana es siempre (indiceMaximo, indiceMaximo + VENTANA], acotada al final de urls.
  const rehacerVentana = () => {
    const ultimo = Math.min(indiceMaximo + VENTANA, urls.length - 1);
    const dentro = (indice) => indice > indiceMaximo && indice <= ultimo;
    for (let i = pendientes.length - 1; i >= 0; i -= 1) {
      if (!dentro(pendientes[i])) pendientes.splice(i, 1);
    }
    for (let i = indiceMaximo + 1; i <= ultimo; i += 1) {
      if (yaCalentados.has(i) || pendientes.includes(i)) continue;
      pendientes.push(i);
    }
  };

  const alCambiarVisibilidad = () => {
    if (document.hidden) {
      // En pausa: se suelta el reloj, la cola y la ventana se conservan.
      if (temporizador !== null) {
        clearTimeout(temporizador);
        temporizador = null;
      }
      return;
    }
    planificar();
  };
  document.addEventListener('visibilitychange', alCambiarVisibilidad);

  const observador = new IntersectionObserver((entradas) => {
    if (!vivo) return;
    let crecio = false;
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      const indice = indicePorElemento.get(entrada.target);
      if (typeof indice !== 'number') return;
      if (indice > indiceMaximo) {
        indiceMaximo = indice;
        crecio = true;
      }
    });
    if (!crecio) return;
    rehacerVentana();
    planificar();
  }, { rootMargin: '1500px 0px', threshold: 0 });
  elementos.forEach((elemento) => observador.observe(elemento));

  return () => {
    if (!vivo) return;
    vivo = false;
    observador.disconnect();
    if (temporizador !== null) {
      clearTimeout(temporizador);
      temporizador = null;
    }
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    enVuelo.forEach((img) => {
      // No tocar img.src: reasignarlo dispararia una peticion nueva.
      img.onload = null;
      img.onerror = null;
    });
    enVuelo.clear();
    pendientes.length = 0;
  };
}
