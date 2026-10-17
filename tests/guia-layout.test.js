// Guarda del layout de la guia dentro de la app.
//
// La guia vive en el mismo contenedor que el navbar, y el navbar es `position: absolute`
// respecto a ese contenedor (`App.jsx:1321-1328` + `.app-container { position: relative }`).
// Consecuencia: un `margin-top` en `.guia` se colapsa hacia fuera de `.app-container`, baja el
// contenedor entero y se lleva el navbar consigo, asi que el contenido acaba a la altura de la
// barra. Paso de verdad en `02b462f` y no lo caza ninguna prueba de contenido: es un fallo de
// layout, invisible para `node --test` salvo por esta guarda.
//
// Se comprueba el texto del CSS a proposito: la alternativa seria un navegador headless, y para
// impedir que vuelva a entrar una sola propiedad no compensa el coste del arnes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8');

// Cuerpo de una regla simple, por su selector exacto (asi `.guia` no atrapa `.guia__panel`).
function bloque(selector) {
  const marca = '\n' + selector + ' {';
  const i = css.indexOf(marca);
  assert.notEqual(i, -1, 'no se encontro la regla ' + selector + ' en index.css');
  const abre = css.indexOf('{', i);
  const cierra = css.indexOf('}', abre);
  return css.slice(abre + 1, cierra);
}

test('el aire de arriba de .guia va en padding: un margin-top se colapsa y arrastra el navbar', () => {
  const g = bloque('.guia');
  assert.match(g, /padding:/, '.guia deberia declarar el aire de arriba con padding');
  assert.ok(
    !/\bmargin/.test(g),
    '.guia no debe declarar margin: se colapsa hacia fuera de .app-container y baja el navbar'
  );
});

test('la superficie de la guia vive en .guia__panel, no en el contenedor con el aire', () => {
  const p = bloque('.guia__panel');
  assert.match(p, /background:/, '.guia__panel deberia pintar la superficie');
  assert.match(p, /border-radius:/, '.guia__panel deberia llevar el radio');
  assert.ok(
    !/margin-top/.test(p),
    '.guia__panel no debe abrir con margin-top: mismo colapso que .guia'
  );
});

test('la vista de la app envuelve el contenido en el panel', () => {
  const jsx = readFileSync(new URL('../src/components/GuiaPage.jsx', import.meta.url), 'utf8');
  assert.match(jsx, /className="guia__panel"/, 'GuiaPage deberia envolver el contenido en guia__panel');
  assert.match(jsx, /<main className="guia"/, 'GuiaPage deberia seguir usando main.guia');
});
