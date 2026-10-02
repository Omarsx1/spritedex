// El usuario y la contrasena son la credencial que debe sobrevivir a un navegador
// borrado y a un movil nuevo. La regla es pura, asi que se fija aqui.
//
// Lo que estas pruebas NO pueden comprobar: que Supabase acepte la cuenta, que el
// usuario este libre de verdad (eso lo decide el correo unico) ni el comportamiento
// de una sesion anonima reclamada. Eso solo se ve contra un Supabase real.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOMINIO_SINTETICO,
  normalizarUsuario,
  validarUsuario,
  usuarioAEmail,
  esCorreoSintetico,
  validarContrasena,
  usuarioDeSesion
} from '../src/utils/usuario.js';

test('usuarios validos: minusculas, digitos y guion bajo intermedio', () => {
  assert.deepEqual(validarUsuario('juan'), { ok: true, usuario: 'juan' });
  assert.deepEqual(validarUsuario('juanperez'), { ok: true, usuario: 'juanperez' });
  assert.deepEqual(validarUsuario('juan_99'), { ok: true, usuario: 'juan_99' });
  assert.deepEqual(validarUsuario('abc'), { ok: true, usuario: 'abc' });
});

test('demasiado corto y demasiado largo', () => {
  assert.deepEqual(validarUsuario('ab'), { ok: false, motivo: 'largo' });
  assert.deepEqual(validarUsuario(''), { ok: false, motivo: 'largo' });
  assert.deepEqual(validarUsuario('a'.repeat(17)), { ok: false, motivo: 'largo' });
  assert.equal(validarUsuario('a'.repeat(16)).ok, true);
});

test('empieza por digito o guion bajo', () => {
  assert.deepEqual(validarUsuario('1juan'), { ok: false, motivo: 'inicio' });
  assert.deepEqual(validarUsuario('_juan'), { ok: false, motivo: 'inicio' });
});

test('caracteres invalidos y acentos', () => {
  assert.deepEqual(validarUsuario('juan.perez'), { ok: false, motivo: 'caracteres' });
  assert.deepEqual(validarUsuario('juan-perez'), { ok: false, motivo: 'caracteres' });
  assert.deepEqual(validarUsuario('josé'), { ok: false, motivo: 'caracteres' });
});

test('doble guion bajo y guion bajo final', () => {
  assert.deepEqual(validarUsuario('juan__perez'), { ok: false, motivo: 'guiones' });
  assert.deepEqual(validarUsuario('juan_'), { ok: false, motivo: 'guiones' });
});

test('cada reservado queda fuera, tambien escrito en mayusculas', () => {
  const reservados = [
    'admin', 'administrador', 'spritedex', 'soporte', 'moderador', 'equipo', 'oficial',
    'sistema', 'sdex', 'www', 'api', 'login', 'root', 'dev', 'test', 'ayuda', 'staff'
  ];
  for (const nombre of reservados) {
    assert.deepEqual(validarUsuario(nombre), { ok: false, motivo: 'reservado' }, nombre);
  }
  assert.deepEqual(validarUsuario('ADMIN'), { ok: false, motivo: 'reservado' });
});

test('normalizacion: espacios y mayusculas se van', () => {
  assert.equal(normalizarUsuario('  JuanPerez '), 'juanperez');
  assert.equal(normalizarUsuario('Juan Perez'), 'juanperez');
  assert.equal(normalizarUsuario(null), '');
  assert.equal(normalizarUsuario(undefined), '');
});

test('usuarioAEmail: con prefijo, sin prefijo y vacio', () => {
  assert.equal(usuarioAEmail('juan'), 'juan' + DOMINIO_SINTETICO);
  assert.equal(usuarioAEmail('  Juan '), 'juan' + DOMINIO_SINTETICO);
  assert.equal(usuarioAEmail('@juan'), 'juan' + DOMINIO_SINTETICO);
  assert.equal(usuarioAEmail('juan' + DOMINIO_SINTETICO), 'juan' + DOMINIO_SINTETICO);
  assert.equal(usuarioAEmail(''), '');
});

test('esCorreoSintetico distingue el alias del correo real', () => {
  assert.equal(esCorreoSintetico('juan' + DOMINIO_SINTETICO), true);
  assert.equal(esCorreoSintetico('Juan' + DOMINIO_SINTETICO.toUpperCase()), true);
  assert.equal(esCorreoSintetico('juan@gmail.com'), false);
  assert.equal(esCorreoSintetico(''), false);
  assert.equal(esCorreoSintetico(null), false);
});

test('contrasena: corta vs larga', () => {
  assert.deepEqual(validarContrasena('1234567'), { ok: false, motivo: 'corta' });
  assert.deepEqual(validarContrasena(''), { ok: false, motivo: 'corta' });
  assert.deepEqual(validarContrasena('12345678'), { ok: true });
});

test('usuarioDeSesion lee los metadatos y tolera lo que falta', () => {
  assert.equal(usuarioDeSesion({ user_metadata: { username: 'juan' } }), 'juan');
  assert.equal(usuarioDeSesion({ user_metadata: {} }), '');
  assert.equal(usuarioDeSesion({}), '');
  assert.equal(usuarioDeSesion(null), '');
  assert.equal(usuarioDeSesion({ user_metadata: { username: 42 } }), '');
});
