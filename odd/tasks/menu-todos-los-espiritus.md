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

## Es carga estructural: es la ÚNICA salida de la guía

Comprobado control por control. No se puede borrar sin sustituirlo:

| Control del menú | Qué hace | ¿Sale de la guía? |
| :--- | :--- | :--- |
| Logo fantasma | `handleLogoClick` (`Navbar.jsx:201-213`): limpia `caches` y recarga con `?v=`. Es "Actualizar aplicación" (`nav.actualizarApp`) | No |
| Override / Runners / Todas | `onGenChange` (`App.jsx:1205-1208`): solo `setActiveGen` + resetea `baseFilter` y `spriteFilter` | **No navega** |
| Guía de espíritus | Va a la guía | — |
| Cookies & Privacidad | Abre un modal | No |
| **Todos los espíritus** | `irA('/')` → `pushState` + `setEnGuia(false)` | **Sí** |

- El único sitio que pone `enGuia = false` es `irA` (`App.jsx:1144`), y `irA` solo corre al navegar
  (`App.jsx:331, 1111, 1144`).
- Intención declarada en `App.jsx:1198`: *"La barra de navegación se dibuja en la app y en la
  guía: en una PWA instalada es la única salida."*
- **Consecuencia**: borrarlo deja al usuario encerrado en la guía, sin botón atrás si la app está
  instalada como PWA.

## Defectos relacionados

- **Mal clasificado**: vive bajo "Ayuda y legal" (`nav.ayudaLegal`), y es navegación, no ayuda ni
  legal.
- **Los botones de GENERACIONES están inertes en la guía**: cambian un filtro que no se está
  mostrando y no navegan. Tocarlos no produce ningún efecto visible.

## Defecto de comportamiento

- `irA` (`src/App.jsx:1139-1145`) hace `history.pushState` y solo mueve los flags
  `enAmigos`, `enCompartir` y `enGuia`. Si el usuario ya está en el catálogo, los tres ya están en
  `false` y `irA` **no toca los filtros**: el clic no produce ningún cambio visible y además deja
  una entrada duplicada en el historial de "atrás". Se percibe como un botón muerto.
- **Desajuste de etiqueta**: el texto promete un destino concreto ("Todos los espíritus") y
  entrega el inicio.

## Criterios de aceptación (propuestos, a confirmar)

- [ ] Al pulsarlo desde el catálogo, el usuario ve un cambio real (por ejemplo: se restablecen los
      filtros y sube al principio de la rejilla, o la etiqueta pasa a decir lo que de verdad hace).
- [ ] No se añade una entrada de historial cuando la ruta no cambia.
- [ ] Desde la guía, el menú sigue ofreciendo una vuelta al catálogo (hoy es este botón).
- [ ] Los botones de generación hacen algo visible cuando se está en la guía, o no se muestran.
- [ ] La etiqueta y el destino coinciden en los tres idiomas.
- [ ] Se mantiene la navegación en la app y el `href` real sigue vivo para cmd/clic central.

## Alternativas (ninguna decidida)

1. **Quedarse con él, pero arreglado**: sacarlo de "Ayuda y legal", resetear los filtros y subir
   arriba para que el clic siempre tenga efecto, y no empujar historial si la ruta no cambia.
2. **Quitarlo y que las generaciones salgan de la guía**: si "Override / Runners / Todas" también
   navegan al catálogo cuando estás en la guía, el botón pasa a ser redundante y desaparece. Deja
   el menú con una sola entrada coherente para volver, en vez de dos que se pisan.
3. **Apuntar al listado estático** `/espiritus`, que es lo que la etiqueta promete; se descartó en
   su día por repetir la rejilla (ver el comentario del código).

## Log

- **L1** Origen: el usuario preguntó a dónde lleva ese botón (2026-10-16). Al verificar el
  recorrido se encontró el defecto del historial y el desajuste de etiqueta.
- **L2** Decisión del usuario: *"lo anotamos como tarea aparte"*. No se implementa ahora para no
  mezclar cambios con la rama del rediseño (`feat/rediseno-guia-y-armazon`).
