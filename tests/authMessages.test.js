// Pruebas de la traduccion de errores de autenticacion. Es texto que ve el usuario y
// decide si puede o no conservar su progreso, asi que conviene tenerlo fijado.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mensajeDeAuth } from '../src/utils/authMessages.js';

test('error de proveedor: no se confunde con el de vinculacion', () => {
  const mensaje = mensajeDeAuth({ message: 'Unsupported provider: provider is not enabled' }, true);
  assert.match(mensaje, /proveedor/);
  assert.doesNotMatch(mensaje, /Manual Linking/);
});

test('sin Manual Linking: lo dice y ofrece el correo', () => {
  const mensaje = mensajeDeAuth({ message: 'Manual linking is disabled for this project' }, true);
  assert.match(mensaje, /Manual Linking/);
  assert.match(mensaje, /correo/);
});

test('ese aviso solo aplica a la sesion anonima', () => {
  const mensaje = mensajeDeAuth({ message: 'Manual linking is disabled for this project' }, false);
  assert.doesNotMatch(mensaje, /Manual Linking/);
});

test('un error desconocido se muestra tal cual, sin inventar causa', () => {
  assert.equal(mensajeDeAuth({ message: 'Failed to fetch' }, true), 'Failed to fetch');
});

test('sin mensaje: texto por defecto', () => {
  assert.equal(mensajeDeAuth({}, false), 'Error con Google Sign-In');
});

