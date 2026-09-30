// La ruta de amigos devolvia el user_state ENTERO, y dentro viaja _profile con el correo,
// el nombre y el pais del otro usuario. Nada de eso se dibuja: era una fuga silenciosa.
// Esta prueba fija el invariante para que no vuelva a colarse.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fuente = fs.readFileSync('src/utils/friendCode.js', 'utf8');

test('la ruta de amigo limpia el perfil antes de devolverlo', () => {
  assert.ok(fuente.includes('sinPerfil('), 'fetch debe usar sinPerfil sobre user_state');
  assert.ok(!/_profile\s*\|\|/.test(fuente), 'no debe reconstruir el perfil del otro usuario');
  assert.ok(!fuente.includes('country_flag'), 'el perfil no debe volver a armarse aqui');
});

test('el canal en tiempo real tambien limpia el perfil', () => {
  const canal = fuente.slice(fuente.indexOf('export function subscribeToFriendCollection'));
  assert.ok(canal.includes('sinPerfil('), 'onUpdate debe recibir el estado sin perfil');
});

test('lo unico que se devuelve del otro es su coleccion', () => {
  const retorno = fuente.slice(fuente.indexOf('if (data && data.user_state)'), fuente.indexOf('if (error)'));
  assert.ok(retorno.includes('sinPerfil(data.user_state)'), 'userState debe ir limpio');
  // Se busca la CLAVE del objeto devuelto, no la palabra suelta: el comentario de al lado
  // explica justamente que _profile se descarta, y con includes() eso daba un falso fallo.
  assert.ok(!/\bprofile\b\s*[,:]/m.test(retorno), 'no se devuelve ningun objeto profile');
});
