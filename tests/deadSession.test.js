// La sesion muerta es la regla que decide cuando la app cierra una sesion que Supabase ya
// invalido. Es pura, y por eso se prueba aqui.
//
// La regresion que originaron estas pruebas: con la identidad borrada en Supabase, cada
// intento de guardar fallaba en silencio y el usuario perdia lo marcado en esa ventana
// hasta que el token caducaba.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isDeadSessionError } from '../src/utils/deadSession.js';

test('la clave foranea rota significa que la identidad ya no existe', () => {
  assert.equal(isDeadSessionError({ code: '23503', message: 'violates foreign key' }), true);
});

test('un 401 con el token rechazado tambien reinicia la sesion', () => {
  assert.equal(isDeadSessionError({ status: 401 }), true);
  assert.equal(isDeadSessionError({ code: '401' }), true);
  assert.equal(isDeadSessionError({ code: 'PGRST301', status: 401 }), true);
});

test('los fallos normales de red o permisos no cuentan', () => {
  assert.equal(isDeadSessionError({ code: '23505', message: 'duplicate key' }), false);
  assert.equal(isDeadSessionError({ status: 500 }), false);
  assert.equal(isDeadSessionError({ status: 403, code: '42501' }), false);
  assert.equal(isDeadSessionError({ message: 'Failed to fetch' }), false);
});

test('sin error no hay nada que reaccionar', () => {
  assert.equal(isDeadSessionError(null), false);
  assert.equal(isDeadSessionError(undefined), false);
});
