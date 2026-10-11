# Sync en vivo — el desktop se pone al día solo

## Objetivo
Que la colección se sienta sincronizada de verdad: marcar en el celular y encontrar eso en el
desktop (y al revés) **sin abrir la app de nuevo ni recargar la web**.

## Problema (reporte del usuario, 2026-10-11)
- En el celular, con sesión, tenía 145/145. El desktop, con la misma cuenta de Google, mostraba 144/145.
- Tuvo que abrir la app del celular (para que subiera su estado) y **recargar** la web del desktop
  (para que leyera) para recién ver los 145.
- Mandato textual: "yo quiero que sea instantáneo; si marco en mi celular, cierro la app, cuando yo
  entre a desktop no quiero que esté condicionado a ese funcionamiento".

## Por qué pasaba (evidencia en código)
- El desktop solo LEE la nube **al cargar la página** o al cambiar la sesión: en src/App.jsx
  `loadUserCollectionFromCloud` se llama solo en el arranque (~L510) y en el cambio de auth (~L519).
  No hay pull al volver a la pestaña ni suscripción a la propia fila.
- El único "en vivo" es de empuje: debounce de 600 ms + flush keepalive al ocultar la pestaña
  (src/utils/pendingSync.js). El celular solo re-sube su estado completo al arrancar.
- El upsert reemplaza `user_state` completo y el merge (unión) es solo del lado cliente al leer.
  Si un dispositivo con estado viejo escribe antes de leer, puede pisar la nube con menos datos.

## Alcance
- Pull al volver a la pestaña / recuperar foco / volver online, con límite de frecuencia, para
  cualquier sesión (invitado incluido).
- Suscripción Realtime a la propia fila de `user_collections` (mismo patrón que
  `subscribeToFriendCollection` en src/utils/friendCode.js), con merge unión y guarda de igualdad
  para no crear un bucle de subidas con el eco de la propia escritura. Solo cuentas no anónimas.
- Blindaje del arranque: la primera escritura espera a que termine la primera lectura, y después se
  garantiza un empuje (así un dispositivo con datos viejos no puede pisar la nube).
- Empuje más rápido en el celular: el debounce baja de 600 ms a 250 ms (el flush al ocultar sigue).

## No entra
- Cambios de esquema o RLS en Supabase (la tabla ya está publicada para Realtime: la usa el radar de amigos).
- UI nueva ni copy nuevo.

## Tareas
- **T1 · Módulo puro** `src/utils/syncPolicy.js` (nuevo): `INTERVALO_MINIMO_DE_REFRESCO_MS = 10_000`,
  `debeRefrescarAlVolver({ haySesion, compartiendo, visible, ahora, ultimoRefresco })` y
  `mismoEstado(a, b)` (compara `owned`/`level` por id, ignora claves que empiezan con `_`).
- **T2 · Pruebas** `tests/syncPolicy.test.js` (nuevo, node:test): política (sin sesión, compartiendo,
  oculto, primera vez, dentro y fuera de la ventana), `mismoEstado` (iguales, orden distinto, distinto
  `owned`, distinto `level`, claves `_`) y guardas de cableado en App.jsx (mismo estilo que
  `tests/lazy-sync.test.js`).
- **T3 · Cableado** en `src/App.jsx`: pull al volver (visibilitychange→visible, focus, online) con
  throttle y guardas; efecto Realtime de la propia fila (solo cuentas no anónimas) con merge +
  `mismoEstado`; ref `lecturaInicialLista` que retiene el primer empuje hasta que termine la primera
  lectura y garantiza un empuje después (contador en deps del efecto); debounce 600 → 250.

## Rutas autorizadas (solo estas)
- src/App.jsx
- src/utils/syncPolicy.js (nuevo)
- tests/syncPolicy.test.js (nuevo)

## Verificación
- `npm test` (node --test)
- `npm run lint` (oxlint)

## Criterios de aceptación
- `npm test` sin fallos nuevos y `npm run lint` limpio.
- Con sesión, volver a la pestaña trae cambios hechos en otro dispositivo sin recargar.
- La propia escritura no genera bucle (la igualdad corta el eco de Realtime).
- Ningún dispositivo escribe antes de terminar su primera lectura.

## Verificación (2026-10-11)
- `npm test` → 256 tests, 255 pasan, 1 falla. El único rojo es `tests/fecha-lanzamiento.test.js`
  (módulo puro de fechas, ajeno a sync): su fixture `2026-10-08` ya quedó en el pasado y
  `src/utils/lanzamiento.js:77` compara contra `Date.now()`. Preexistente, no lo introduce este cambio.
- `npm run lint` → 111 avisos y 2 errores, todos preexistentes; los 2 errores están en
  `assets-src/marca/marca-iconos.mjs` (archivo sin trackear). Nada nuevo en los archivos tocados.
- Verificador independiente (agente read-only): 8/8 puntos PASS (política pura con fuzz de 300 000
  casos sin divergencias en el dominio real; la compuerta del primer empuje cubre todos los caminos
  de salida; `pushTick` garantiza el empuje aunque la fusión no cambie el estado; el camino del
  invitado sube su cambio; Realtime sin bucle de eco; pull con límite y sin listeners duplicados; sin
  regresiones en debounce, `useCallback` ni en las guardas de compartir/sesión muerta/Lazy Sync).

## Riesgos residuales y seguimiento
- El blindaje del arranque es **por carga de página**: si se cambia de cuenta sin recargar (A→B), el
  primer empuje de B no espera la lectura de B. Ventana = latencia del fetch contra el debounce de
  250 ms. Preexistente en esencia; candidato a tarea propia.
- Un `DELETE` de la fila no se refleja en los demás dispositivos (el merge es unión y nunca borra).
- `mismoEstado` no es simétrico ni reflexivo si un valor del estado es `null` o un primitivo; solo
  alcanzable con un localStorage o un JSON importado corrupto (el dominio real quedó cubierto por fuzz).
- Realtime no se puede ejercitar sin red: la publicación de `user_collections` ya está probada por el
  canal de amigos (`subscribeToFriendCollection`).
- `ultimoRefrescoRef` no se reinicia al cambiar de usuario: el primer pull del usuario nuevo puede
  esperar hasta 10 s.

## Evidencia
- Implementación: `5d6f077` — feat(sync): el desktop se pone al dia solo, sin recargar (rama
  `codex/sync-en-vivo-prod`, cherry-pick sobre `origin/main`, subida a producción).
- Rama de desarrollo original: `codex/sync-en-vivo` (sobre el trabajo sin subir del menú/guía).
