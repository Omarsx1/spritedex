// El modelo de la guia (src/seo/guia.js) es la unica fuente de su contenido: lo consumen el
// generador estatico y, mas adelante, la vista dentro de la aplicacion. Aqui se comprueba que
// sigue completo en los dos idiomas, que los numeros de la coleccion entran en la copia y que no
// se le colo marcado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { modeloGuia, formatearFecha } from '../src/seo/guia.js';
import { nombreRareza } from '../src/seo/idioma.js';

const datos = {
  total: 278,
  familias: 24,
  porRareza: [{ nombre: 'Special', n: 120 }, { nombre: 'Rare', n: 100 }, { nombre: 'Legendary', n: 40 }, { nombre: 'Epic', n: 12 }, { nombre: 'Mythic', n: 6 }],
  costos: 15,
  dropMin: 0.75,
  dropMax: 5,
  fecha: '2026-10-04'
};

// Todas las cadenas del modelo, a cualquier profundidad: el modelo es datos anidados.
function textos(valor, salida = []) {
  if (typeof valor === 'string') salida.push(valor);
  else if (Array.isArray(valor)) valor.forEach((v) => textos(v, salida));
  else if (valor && typeof valor === 'object') Object.values(valor).forEach((v) => textos(v, salida));
  return salida;
}

test('el modelo trae secciones y FAQ en los dos idiomas', () => {
  for (const lang of ['es', 'en']) {
    const modelo = modeloGuia(lang, datos);
    assert.equal(modelo.lang, lang);
    assert.equal(modelo.secciones.length, 7, lang + ': secciones de la guia');
    assert.equal(modelo.faq.entradas.length, 6, lang + ': preguntas del FAQ');
    for (const [p, r] of modelo.faq.entradas) {
      assert.ok(p && p.trim() && r && r.trim(), lang + ': par de pregunta y respuesta');
    }
  }
});

test('los numeros de la coleccion entran en la copia', () => {
  for (const lang of ['es', 'en']) {
    const modelo = modeloGuia(lang, datos);
    const plano = textos(modelo).join(' ');
    assert.ok(plano.includes(String(datos.total)), lang + ': falta el total');
    assert.ok(plano.includes(String(datos.familias)), lang + ': faltan las familias');
    assert.ok(plano.includes(' ' + datos.costos + ' '), lang + ': faltan los costos');
    assert.ok(plano.includes(String(datos.dropMin)) && plano.includes(String(datos.dropMax)), lang + ': falta el rango de probabilidad');
    assert.ok(plano.includes(formatearFecha(datos.fecha, lang)), lang + ': falta la fecha de revision');
    const rareza = modelo.secciones.find((s) => s.tabla);
    assert.equal(rareza.tabla.filas.length, datos.porRareza.length, lang + ': filas de la tabla de rareza');
    // La primera celda lleva la etiqueta localizada en mayusculas —la misma que el badge de la
    // tarjeta— y la clave del codigo del juego, de donde cada renderer saca los colores.
    assert.equal(rareza.tabla.filas[0][0].texto, nombreRareza(datos.porRareza[0].nombre, lang));
    assert.equal(rareza.tabla.filas[0][0].clave, datos.porRareza[0].nombre);
    assert.equal(rareza.tabla.filas[0][1], datos.porRareza[0].n);
  }
});

test('un drop por debajo del 0.01% se cuenta como "menos del 0.01%"', () => {
  const raro = { ...datos, dropMin: 0.00001, dropMax: 4 };
  const parrafoDe = (lang) => modeloGuia(lang, raro).secciones.flatMap((s) => s.bloques).map((b) => b.texto).join(' ');
  assert.ok(parrafoDe('es').includes('va de menos del 0.01% al 4%'), 'es: falta la redaccion de menos del 0.01%');
  assert.ok(parrafoDe('en').includes('goes from less than 0.01% to 4%'), 'en: falta la redaccion de less than 0.01%');
});

test('ninguna seccion queda vacia', () => {
  for (const lang of ['es', 'en']) {
    const modelo = modeloGuia(lang, datos);
    for (const seccion of modelo.secciones) {
      assert.ok(seccion.titulo.trim(), lang + ': seccion sin titulo');
      assert.ok(seccion.bloques.length > 0, lang + ': seccion sin bloques: ' + seccion.titulo);
      for (const bloque of seccion.bloques) {
        assert.ok(bloque.tipo === 'parrafo' || bloque.tipo === 'lista', lang + ': bloque desconocido');
        const contenido = bloque.tipo === 'lista' ? bloque.items : [bloque.texto];
        assert.ok(contenido.length > 0 && contenido.every((t) => String(t).trim()), lang + ': bloque vacio en ' + seccion.titulo);
      }
      if (seccion.tabla) {
        assert.ok(seccion.tabla.cabeceras.length > 0 && seccion.tabla.filas.length > 0, lang + ': tabla vacia: ' + seccion.titulo);
      }
    }
    assert.ok(modelo.faq.titulo.trim() && modelo.nota.trim(), lang + ': falta el titulo del FAQ o la nota');
  }
});

test('el modelo no lleva marcado ni atributos', () => {
  for (const lang of ['es', 'en']) {
    for (const texto of textos(modeloGuia(lang, datos))) {
      assert.ok(!/[<>]/.test(texto), lang + ': el modelo trae marcado: ' + texto.slice(0, 60));
      assert.ok(!/class=/.test(texto), lang + ': el modelo trae un atributo: ' + texto.slice(0, 60));
    }
  }
});
