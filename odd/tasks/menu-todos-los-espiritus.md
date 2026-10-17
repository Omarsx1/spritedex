# Menú hamburguesa: "Todos los espíritus" no lleva a ningún sitio reconocible

**Feature**: `menu-todos-los-espiritus`
**Estado**: pendiente (anotada, sin empezar)
**Fecha**: 2026-10-16

## Objetivo

Que el botón "Todos los espíritus" del menú hamburguesa lleve a un destino que coincida con lo
que promete su etiqueta, y que no se sienta muerto cuando el usuario ya está en el catálogo.

## Contexto verificado

- El botón vive en `src/components/Navbar.jsx:457-466`:
  `href={conIdioma('/', getLang())}` y `onClick={(evento) => navegarEnApp(evento, '/')}`.
- **Destino real**: el inicio de la app (`/`, `/en`, `/pt-br`), que ES el catálogo con filtros.
  No lleva al listado estático `/espiritus`.
- La intención está documentada en `Navbar.jsx:454-456`: *"Al catálogo y no al listado estático:
  dentro de la app un índice sin filtros repetiría la rejilla que el usuario ya tiene. El listado
  prerenderizado sigue enlazado desde el pie de las páginas estáticas."*
- **Defecto**: `irA` (`src/App.jsx:1139-1145`) hace `history.pushState` y solo mueve los flags
  `enAmigos`, `enCompartir` y `enGuia`. Si el usuario ya está en el catálogo, los tres ya están en
  `false` y `irA` **no toca los filtros**: el clic no produce ningún cambio visible y además deja
  una entrada duplicada en el historial de "atrás". Se percibe como un botón muerto.
- **Desajuste de etiqueta**: el texto promete un destino concreto ("Todos los espíritus") y
  entrega el inicio.

## Criterios de aceptación (propuestos, a confirmar)

- [ ] Al pulsarlo desde el catálogo, el usuario ve un cambio real (por ejemplo: se restablecen los
      filtros y sube al principio de la rejilla, o la etiqueta pasa a decir lo que de verdad hace).
- [ ] No se añade una entrada de historial cuando la ruta no cambia.
- [ ] La etiqueta y el destino coinciden en los tres idiomas.
- [ ] Se mantiene la navegación en la app y el `href` real sigue vivo para cmd/clic central.

## Alternativas (ninguna decidida)

1. **Resetear los filtros** al llegar al catálogo y desplazar arriba: convierte el clic en una
   acción útil y con efecto visible.
2. **Renombrar la etiqueta** a algo que describa el destino real ("Catálogo", "Inicio") y dejar el
   comportamiento como está.
3. **Apuntar al listado estático** `/espiritus`, que es lo que la etiqueta promete; se descartó en
   su día por repetir la rejilla (ver el comentario del código).

## Log

- **L1** Origen: el usuario preguntó a dónde lleva ese botón (2026-10-16). Al verificar el
  recorrido se encontró el defecto del historial y el desajuste de etiqueta.
- **L2** Decisión del usuario: *"lo anotamos como tarea aparte"*. No se implementa ahora para no
  mezclar cambios con la rama del rediseño (`feat/rediseno-guia-y-armazon`).
