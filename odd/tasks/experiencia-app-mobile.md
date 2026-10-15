# Experiencia app mobile — auditoría y plan

## Objetivo
Que spritedex se **sienta una verdadera app mobile de alto nivel** al entrar y usarla (sigue siendo web/PWA).
Mandato del usuario (2026-10-09): "que los usuarios sientan que están en una verdadera app cuando ingresen y la usen".

## Método y evidencia (2026-10-09)
- Producción (spritedex.gg) en Chrome headless, viewport iPhone 390×844@3x: 10 capturas (entrada, catálogo,
  scroll, /amigos, /compartir, /guia-espiritus, ficha, filtros, menú).
- Barrido de código: src/App.jsx, src/styles/index.css (10k+), src/components/*.
- Límites: sin pase en dispositivo real todavía (requiere iPhone); el subagente explorador no pudo arrancar
  (proveedor sin balance) → barrido inline acotado.
- Capturas: /private/tmp/spritedex-audit/ (copia en las visualizaciones del hilo).

## Hallazgos
### Entrada (primera impresión)
- **F1 · Entrada apilada (P0).** En la primera visita se apilan a la vez: intro Fortnitemares (SKIP), banner
  "23 nuevos", consent de cookies, prompt de instalación y coachmark (capturas 01/02). Una app secuencia:
  launch → home real → consent una vez → instalación tras engagement.
- **F2 · El consent no bloquea el scroll (P0).** La página scrollea por detrás del panel (captura 03). Los
  filtros SÍ bloquean (MobileLiquidFilterBar.jsx:226-234) → reusar ese lock.
- **F3 · /guia-espiritus vive fuera del shell (P1).** Página estática sin navbar ni tokens (captura 06).
  La GuiaPage in-app ya existe en la rama sin pushear → decisión de merge pendiente.

### Overlays y navegación
- **F4 · Menú = popover sin scrim (P1)** (captura 10). El patrón app es bottom-sheet/full-screen.
- **F5 · Ficha = diálogo centrado (P1)** con X (captura 08); en iOS este detalle suele ser sheet con
  drag-to-dismiss. Nombres de variante truncados ("Hacker de …").
- **F6 · Filtros YA son bottom-sheet (referencia interna)** (captura 09): extender ese patrón.

### Táctil, teclado y motion
- **F7 · Todos los inputs < 16px → zoom automático en iOS (P0).** search 0.8rem (L2021), mobile glass
  search 0.84rem (L2521), auth 0.82/0.76rem (L4759/4782), friends 0.82-0.84rem (L7775+).
- **F8 · Press-state desparejo (P1):** 116 reglas :hover vs 20 :active. La mayoría de :hover son decorativas
  (verificado: no esconden affordances), pero el feedback al toque es inconsistente.
- **F9 · reduced-motion incompleto (P1):** 29 animaciones infinitas vs 3 media queries (share glitch, family
  hint, hero fnm). Mitigación manual existente: toggle "Desactivar animaciones".
- **F10 · overscroll-behavior solo en 2 sitios (P2)** (L4359, L4940): rebote/pull-to-refresh accidental en el resto.
- **F11 · Scroll-lock inconsistente (P2):** filtros sí; consent no; ficha por verificar en dispositivo.

### Rendimiento percibido
- **F12 · 28 <img>, solo 7 lazy (P2).** El grid inicial carga de más.
- **F13 · 80 backdrop-filter + 75 animaciones (P2, medir):** riesgo de jank en móviles medios.
- **F14 · Sin service worker (P2):** sin offline; el install prompt promete "carga instantánea" — hoy no existe.
- **F15 · status-bar-style default con tema oscuro (P3):** verificar en standalone real; theme-color estático
  #060714 vs tema estacional.
- **F16 · Hero estacional ~2 pantallas antes del primer contenido útil (nota de jerarquía).**

## Cola de trabajo
- [ ] T1 (P0) Contrato de entrada: overlays en secuencia (nunca apilados), launch directo a la home, consent
  bloquea scroll (reusar lock del filtro). Verificación: captura de primera visita.
- [ ] T2 (P0) Inputs ≥16px (iOS): search, mobile search, auth, friends. Verificación: regla CSS + captura focus.
- [ ] T3 (P1) Press-states: :active único para todo control tocable.
- [ ] T4 (P1) Sheets: menú y ficha a bottom-sheet con scrim + drag-to-dismiss; nombres de variante a 2 líneas.
- [ ] T5 (P1) reduced-motion: cubrir las 29 animaciones infinitas por media query.
- [ ] T6 (P2) overscroll-behavior + scroll-lock consistentes en todos los overlays.
- [ ] T7 (P2) Grid: loading="lazy" + decoding="async" en todas las imágenes de lista.
- [ ] T8 (P2) Service worker (app-shell) + estrategia offline básica.
- [ ] T9 (P3) Decisión guía: merge de la rama (GuiaPage in-app) o dejar estática.
- [ ] T10 (P3) Pase en iPhone real: gestos/scroll/standalone + medición de jank; ajustar.

## Abiertos
- Rama actual (codex/footer-al-menu-hamburguesa): 8 commits verificados sin push (menú + guía in-app).
  ¿Publicar primero y basar esta experiencia encima, o rama nueva desde main?
- Orden de implementación propuesto por defecto: T1 → T2 → T3 → T4.

## Registro
- 2026-10-09: auditoría completada (10 capturas + barrido de código). Sin cambios de código.
