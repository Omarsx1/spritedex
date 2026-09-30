# Panel de administradores y cierre de la puerta del CMS

Estado: **publicado y verificado en producción** (commit `b9589f3`, en `dev` y `main`).
El SQL se ejecutó ANTES de publicar a propósito: la puerta nueva necesita la tabla
`admins`, y publicar antes habría dejado el CMS sin acceso para todos.

## Objetivo

Que el acceso al CMS lo decida la base (lista de administradores) y no una clave escrita en
el código, y poder otorgar y quitar accesos desde el propio panel.

## Por qué

- La clave `override2026` vivía en `AdminAuthGate.jsx` y viajaba en el bundle público:
  cualquiera la lee. Escondía la interfaz, no protegía datos.
- El permiso de ver todas las colecciones estaba anclado a **un uid fijo** en una política
  de RLS, así que no había forma de dar acceso a un segundo administrador.
- `analytics_events` (el registro de visitas) era legible por cualquiera sin sesión:
  medido, 467 filas.

## Tareas

- [x] `src/components/admin/AdminsView.jsx`: sección nueva. Lista (correo, nota, alta),
      otorga por correo y quita con confirmación. Marca tu fila con "TÚ" y bloquea que te
      quites a ti mismo (la RPC también lo rechaza). Si las RPC no existen, lo dice.
- [x] `src/components/admin/AdminLayout.jsx`: entrada "Administradores" en el menú y su
      rama de render.
- [x] `src/components/admin/AdminAuthGate.jsx`: fuera `DEFAULT_PASSCODE`, fuera el modo
      "Clave Maestra". La única puerta es correo + contraseña, y después se comprueba en la
      base que la cuenta esté en la lista; si no, se cierra la sesión que se acaba de abrir.
      Si la nube no está configurada, se dice en vez de ofrecer un formulario inútil.
- [x] SQL en Supabase (lo ejecutó el dueño): tabla `admins`, función `es_admin()`, políticas
      de `admins`/`user_collections`/`analytics_events` y las tres RPC del panel.
- [x] Publicar (dev + main) y comprobar la puerta en producción.
- [x] **Corrección**: el dueño entra a la app con Google, no con contraseña, así que la
      puerta se quedó sin entrada para él (fallo detectado por él, no por las pruebas). Se
      añadió "Continuar con Google" (`conGoogle`, con vuelta a la propia ruta del CMS) y,
      sobre todo, la puerta **detecta la sesión que ya existe** y comprueba la lista: si eres
      admin, entra sin pedir nada. También avisa cuando la sesión abierta es la de invitado,
      porque esa no sirve para el CMS.
- [ ] Comprobar en el panel: la tabla muestra todas las filas, y "Administradores" permite
      otorgar y quitar.

## Restricciones respetadas

- Cero dependencias nuevas, cero cambios en Supabase desde el código.
- El CMS sigue en español y fuera de i18n; la app pública no se toca.
- Ninguna cuenta pierde acceso a lo suyo: las políticas nuevas **suman** permisos.

## Verificación hecha

- `pnpm lint` (0 errores, sin avisos nuevos en los archivos tocados), `pnpm test` (59) y
  `pnpm build` en verde.
- Chrome headless contra la copia local, en `/studio-override`: la puerta se dibuja, ya no
  hay campo de clave ni selector "Clave Maestra", la palabra `override2026` no aparece y la
  única entrada es correo + contraseña. Sin errores de página.
- Pendiente de verificación real: la sección Administradores necesita sesión de admin, así
  que solo se puede comprobar desde su navegador.

## Verificación en producción (medida, no supuesta)

Con la clave pública y sin sesión, las mismas peticiones que hace la app:

| tabla | antes | después |
|---|---|---|
| `user_collections` | 0 filas | 0 filas |
| `analytics_events` | **467 filas** | **0 filas** |
| `friend_requests` | 0 filas | 0 filas |
| `admin_metricas_usuarios` | 401 | 401 |
| `sprites` | 20 filas | 20 filas (el catálogo es público a propósito) |

Puerta del CMS en `spritedex.gg/studio-override` con Chrome real: se dibuja, no hay campo
de clave, no hay selector "Clave Maestra" y la única entrada es correo + contraseña.

Queda en manos del dueño: entrar al CMS y comprobar que la tabla lista todas las filas y que
la sección Administradores otorga y quita accesos (requiere su sesión).
