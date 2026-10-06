// La marca de sesion del CMS. Vive en sessionStorage: aguanta la recarga dentro de la pestaña
// y se cae al cerrarla. El fallo que estas pruebas protegen: entrar con la sesion ya abierta
// (el boton "Entrar al CMS") no dejaba marca, asi que recargar dentro del panel devolvia a la
// pantalla de entrada aunque la sesion siguiera abierta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_AUTH_KEY, isUserAdminAuthenticated, marcarAdminAutenticado, clearAdminSession } from '../src/utils/adminAuth.js';

function conSessionStorage(fn) {
  const almacen = new Map();
  const previo = globalThis.window;
  globalThis.window = {};
  globalThis.sessionStorage = {
    getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
    setItem: (clave, valor) => { almacen.set(clave, String(valor)); },
    removeItem: (clave) => { almacen.delete(clave); },
  };
  try {
    return fn(almacen);
  } finally {
    globalThis.window = previo;
    delete globalThis.sessionStorage;
  }
}

test('sin marca no hay sesion de administrador', () => {
  assert.equal(conSessionStorage(() => isUserAdminAuthenticated()), false);
});

test('marcar deja la sesion y guarda con que correo se entro', () => {
  conSessionStorage((almacen) => {
    assert.equal(marcarAdminAutenticado('salazarjuniorf@gmail.com'), true);
    assert.equal(isUserAdminAuthenticated(), true);
    const guardado = JSON.parse(almacen.get(ADMIN_AUTH_KEY));
    assert.equal(guardado.email, 'salazarjuniorf@gmail.com');
    assert.ok(guardado.authenticatedAt > 0);
  });
});

test('la marca sobrevive a una recarga (se lee de sessionStorage, no de memoria)', () => {
  conSessionStorage(() => {
    marcarAdminAutenticado('a@b.c');
    // Recargar = volver a preguntar sin estado en memoria.
    assert.equal(isUserAdminAuthenticated(), true);
    assert.equal(isUserAdminAuthenticated(), true);
  });
});

test('cerrar la sesion del CMS borra la marca', () => {
  conSessionStorage(() => {
    marcarAdminAutenticado('a@b.c');
    clearAdminSession();
    assert.equal(isUserAdminAuthenticated(), false);
  });
});

test('una marca corrupta no abre el panel', () => {
  conSessionStorage((almacen) => {
    almacen.set(ADMIN_AUTH_KEY, 'esto no es json');
    assert.equal(isUserAdminAuthenticated(), false);
  });
});

test('sin navegador (pruebas de node) nunca hay sesion', () => {
  assert.equal(isUserAdminAuthenticated(), false);
  assert.equal(marcarAdminAutenticado('a@b.c'), false);
});

