// La guia de espiritus dentro de la aplicacion.
//
// Es la misma guia que sirve el build en /guia-espiritus, pero pintada dentro del armazon de
// la app: el contenido sale del modelo compartido (src/seo/guia.js) y los numeros de la misma
// lista de espiritus que usa el generador estatico (ALL_SPRITES, la que le pasa
// scripts/prerender-seo.mjs), asi que la pantalla y la pagina indexada no pueden discrepar.
// Ni una etiqueta de HTML en la copia: el modelo son datos y aqui se decide como se pinta.
import React, { useEffect, useMemo, useRef } from 'react';
import { ALL_SPRITES } from '../data/spritesData';
import { modeloGuia } from '../seo/guia.js';
import { datosGuia } from '../seo/guiaDatos.js';
import { etiquetasGuia } from '../seo/contenido.js';

// Un bloque del modelo: parrafo o lista. El modelo no trae marcado, asi que el renderer decide
// (aqui, como en el generador estatico).
function Bloque({ bloque }) {
  if (bloque.tipo === 'lista') {
    return (
      <ul className="guia__lista">
        {bloque.items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
  }
  return <p className="guia__texto">{bloque.texto}</p>;
}

// La celda de la rareza llega del modelo como { texto, color } o { texto, degradado } —Special es
// arcoiris, no un color—; las demas son valores sueltos.
function CeldaRareza({ celda }) {
  if (celda === null || typeof celda !== 'object') return <th scope="row">{celda}</th>;
  if (celda.degradado) return <th scope="row" className="rareza-arcoiris">{celda.texto}</th>;
  return <th scope="row" style={celda.color ? { color: celda.color } : undefined}>{celda.texto}</th>;
}

export function GuiaPage({ lang }) {
  // Se cuenta una vez por montaje sobre la lista completa del catalogo.
  const datos = useMemo(() => datosGuia(ALL_SPRITES), []);
  const modelo = useMemo(() => modeloGuia(lang, datos), [lang, datos]);
  const etiquetas = etiquetasGuia(lang);
  // El <h1> es el de la pagina estatica: sale de su mismo titulo, sin una copia aparte.
  const titulo = etiquetas.titulo.replace(' — Spritedex', '');
  const tituloRef = useRef(null);

  // El foco entra en la pagina al montar la ruta. tabIndex=-1 permite enfocar el encabezado
  // sin sumarlo al recorrido del tabulador: quien navega con teclado o con lector de pantalla
  // no se queda en el menu que acaba de usar.
  useEffect(() => {
    if (tituloRef.current) tituloRef.current.focus();
  }, []);

  return (
    <main className="guia" aria-labelledby="guia-titulo">
      <div className="guia__panel">
        <h1 id="guia-titulo" className="guia__titulo" ref={tituloRef} tabIndex={-1}>{titulo}</h1>
        <p className="guia__lead">{etiquetas.descripcion}</p>

        {/* Indice con anclas: los mismos ids que las secciones (ver el modelo compartido), asi
            que indice y secciones no pueden desincronizarse. */}
        <nav className="guia__indice" aria-label={modelo.indice}>
          <ol>
            {modelo.secciones.concat([modelo.faq]).map((s) => (
              <li key={s.id}><a href={'#' + s.id}>{s.titulo}</a></li>
            ))}
          </ol>
        </nav>

        {modelo.secciones.map((seccion) => (
          <section
            id={seccion.id}
            className="guia__seccion"
            aria-labelledby={seccion.id + '-titulo'}
            key={seccion.id}
          >
            <h2 id={seccion.id + '-titulo'} className="guia__h2">{seccion.titulo}</h2>
            {seccion.bloques.map((bloque, i) => <Bloque bloque={bloque} key={i} />)}
            {seccion.tabla && (
              <div className="guia__tabla-caja">
                <table className="guia__tabla">
                  {/* El titulo viene del modelo compartido: es el mismo que pinta la pagina
                      estatica, para que las dos caras digan lo mismo. */}
                  {seccion.tabla.titulo && <caption>{seccion.tabla.titulo}</caption>}
                  <thead>
                    <tr>
                      {seccion.tabla.cabeceras.map((cabecera) => (
                        <th scope="col" key={cabecera}>{cabecera}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seccion.tabla.filas.map((fila) => (
                      <tr key={fila[0].texto || fila[0]}>
                        {/* La primera celda nombra la fila (la rareza): encabezado, no dato. */}
                        <CeldaRareza celda={fila[0]} />
                        {fila.slice(1).map((celda, i) => <td key={i}>{celda}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        <section
          id={modelo.faq.id}
          className="guia__seccion"
          aria-labelledby={modelo.faq.id + '-titulo'}
        >
          <h2 id={modelo.faq.id + '-titulo'} className="guia__h2">{modelo.faq.titulo}</h2>
          {modelo.faq.entradas.map(([pregunta, respuesta]) => (
            <details className="guia__faq" key={pregunta}>
              <summary className="guia__resumen">{pregunta}</summary>
              <p className="guia__texto">{respuesta}</p>
            </details>
          ))}
        </section>

        <p className="guia__nota">{modelo.nota}</p>
      </div>
    </main>
  );
}
