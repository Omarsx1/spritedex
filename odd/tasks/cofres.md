# Contador de cofres y Token Pirata (Beta)

Objetivo: un contador **100% web y propio de Spritedex** para la temporada del Token Pirata.
Cualquier jugador (PC, PS5, Xbox, Switch o móvil) abre la página en su teléfono o PC, toca +1
por cada cofre y ve su progreso. Sin instalar nada, sin apps externas, sin cuentas externas.

Rama: `main` · Entrega: commits por unidad de trabajo · Runner: `npm test` (node --test)

## Specs

- **S1** — En el menú hamburguesa, "Contador de cofres" usa el **cofre real de Fortnite** (`/cofre-max-oro.webp`) y crece al pasar el ratón (hover).
- **S2** — El botón navega a una página interna de Spritedex: `/cofres` (con `/en` y `/pt-br`). No hay enlaces a X, GitHub ni apps externas. Texto del usuario: "nosotros debemos ser independientes".
- **S3** — La página registra cofres con botones **+1**, **+5** y **Deshacer**. Muestra total, hoy y sesión. Se guarda en `localStorage` (`spritedex_cofres_v1`).
- **S4** — El estado del **Token Pirata** se marca/desmarca con un botón y se muestra con el emblema dorado (`/token-pirata.svg`), no con una estrella. Texto: "en lugar de una estrella coloca [emblema]".
- **S5** — Estadísticas derivadas de los datos guardados: días jugados, media por día, mejor día y gráfico de los últimos 14 días.
- **S6** — Funciona en cualquier plataforma con navegador: el jugador de PS5/Xbox/Switch lo usa desde el teléfono. Sin instalar, sin login.
- **S7** — Todo el texto en español, inglés y portugués.
- **S8** — La paleta de la página copia el menú hamburguesa: azul marino, filo de latón, texto pergamino y acentos cian/dorado. Texto: "los colores de los elementos de esta página deben ser como los del menú hamburguesa".
- **S9** — El login bajo el tema Cazatesoros conserva su superficie oscura y su texto se lee. Texto: "corrige los colores del loguin que no se ve nada".
- **S10** — La ruta `/cofres` entra al sitemap y al `<head>` del build.
- **S11** — Con sesión de Spritedex, el contador se sincroniza entre dispositivos en la tabla aislada `chest_counters`; sin sesión o sin tabla, sigue funcionando en local. La fusión conserva el mayor total, el mayor de cada día y el token si aparece en cualquiera de los lados. El historial de Deshacer no se sube.
- **S12** — Modo Equipo manual: plantilla de jugadores, jugador activo, +1/+5/cantidad por jugador, total del equipo, día del equipo, top y deshacer. La fusión en la nube conserva el mayor total y día de cada jugador. No usa replays: es exacto si cada uno cuenta o si una persona lleva la cuenta.
- **S13** — Equipo compartido en tiempo real: código de invitación, cada jugador entra con su cuenta, solo puede sumar/restar su propia fila, totales en vivo por Supabase Realtime y permisos por equipo. Un usuario pertenece a un solo equipo; el dueño que sale lo disuelve. Sin relación ni colaboración con ChestCounter.

## Assumptions

- El contador es manual: el navegador no puede leer replays ni `%APPDATA%`. Esa es justamente la ventaja para consola y móvil.
- "Sesión" es desde que el usuario pulsa "Nueva sesión"; no se reinicia sola al recargar.
- Los datos viven en el dispositivo. Una sincronización con la cuenta de Spritedex queda como siguiente paso, no en esta entrega.

## Tasks

- **T1** Ruta `/cofres`, botón del menú con cofre real y hover. `S1-S2`
- **T2** Contador manual persistente, token y estadísticas. `S3-S6`
- **T3** Traducciones, paleta del menú, login legible y SEO. `S7-S10`
- **T4** Verificación: `npm test`, lint, build y captura de la página. `S1-S10`
- **T5** Sincronización con la cuenta (`chest_counters`, migración SQL, fusión y estado local/cloud). `S11`
- **T6** Modo Equipo manual (roster, jugador activo, totales por jugador, top y sync). `S12`
- **T7** Equipo compartido real (`teams`, `team_members`, RPCs, RLS y Realtime) + UI de crear/unirse. `S13`

## Log

- **L1** (2026-11-13) Usuario: "este sería el botón un hover de aumento de tamaño, y cuando le hagamos click nos lleve a otra página de nuestro spritedex".
- **L2** (2026-11-13) Usuario: "no pongas ver publicación en X que ese es un externo nosotros debemos ser independientes".
- **L3** (2026-11-13) Usuario: "¿por qué tenemos descargar chestcounter? si se supone que vamos a ofrecer ese servicio desde la web".
- **L4** (2026-11-13) Usuario: "¿cómo ofrecemos el servicio a más usuarios? como PS5? no solo a windows". Se prioriza el modo manual web.
- **L5** (2026-11-13) Usuario: "en lugar de una estrella coloca [emblema dorado]" y "los colores de los elementos de esta página deben ser como los del menú hamburguesa".
- **L6** (2026-11-13) Usuario: "corrige los colores del loguin que no se ve nada". Causa: el tema Cazatesoros pintaba el modal con pergamino claro y el login mantiene texto blanco.
- **L7** (2026-11-13) Usuario aprueba la sincronización con la cuenta. Se añade `chest_counters` con RLS, fusión conservadora y estado "Solo en este dispositivo / Sincronizando / Sincronizado". La migración debe ejecutarse en el proyecto Supabase de la app; el MCP disponible apunta a otro proyecto.
- **L8** (2026-11-13) Usuario elige el modo equipo manual. Se implementa plantilla, jugador activo, totales por jugador, total del equipo, top, deshacer y sincronización. La automatización por replays queda descartada para esta versión.
- **L9** (2026-11-13) Usuario elige equipo compartido en tiempo real. Se añaden `teams` y `team_members` con RLS, RPCs atómicas y Realtime; cada jugador cuenta lo suyo. Se retira cualquier referencia a ChestCounter: no es nuestro servicio ni hay colaboración.
