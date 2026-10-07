// Garantiza que visitantes anonimos sin capturas (incluyendo bots y crawlers)
// no creen filas vacias en user_collections (Lazy Sync).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appFuente = fs.readFileSync('src/App.jsx', 'utf8');
const supabaseFuente = fs.readFileSync('src/utils/supabase.js', 'utf8');

test('App.jsx implementa guardado diferido (Lazy Sync) para usuarios anonimos sin capturas', () => {
  assert.ok(appFuente.includes('hasCloudRecordRef'), 'debe tener referencia de registro previo en la nube');
  assert.ok(appFuente.includes('tieneCapturas'), 'debe calcular si el estado contiene capturas');
  assert.ok(
    appFuente.includes('isAnon && !tieneCapturas && !hasCloudRecordRef.current'),
    'debe omitir la sincronizacion con la nube si es anonimo, no tiene capturas y no tiene registro previo'
  );
});

test('supabase.js detecta navegadores automatizados (webdriver) y bots web', () => {
  assert.ok(supabaseFuente.includes('navigator.webdriver'), 'debe comprobar navigator.webdriver');
  assert.ok(supabaseFuente.includes('googlebot'), 'debe comprobar googlebot');
  assert.ok(supabaseFuente.includes('bingbot'), 'debe comprobar bingbot');
  assert.ok(supabaseFuente.includes('bytespider'), 'debe comprobar rastreadores adicionales');
});
