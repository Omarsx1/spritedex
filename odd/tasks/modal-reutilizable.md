# Un solo Modal y fin de la duplicacion

## Objetivo
Un componente `Modal` reutilizable, sin cambiar aspecto ni comportamiento, y sin
arriesgar la app en produccion.

## Problema (medido)
- 9 archivos reimplementan la modal (overlay propio).
- 4 manejan `Escape` por su cuenta, 4 animan la entrada con GSAP, 7 cierran al tocar el fondo.
- `src/components/ui/` tiene un solo componente: no hay primitivas de UI.
- El bug de "el fondo hace scroll detras de la modal" estaba en los 9 a la vez.
- 13 componentes pasan de 400 lineas; 5 pasan de 800 (hasta 1516).

## Plan por pasos (un commit y una verificacion por paso)
- [x] Paso 1. Red de seguridad barata: constantes del contrato de la captura, try/catch
      en el precalculo y regla `no-use-before-define` en el linter. Commits fdca908,
      6ccdb0d, e4b4a3b.
- [x] Paso 2. Red de pruebas. Commit bd1a9eb (6 pruebas con el runner de Node y smoke
      test real). Verificado que el smoke SI detecta un TDZ: el build pasaba y el smoke
      fallo con "ErrorBoundary" y salida 1.
      De paso se arreglo que el lint del CI no aplicaba la configuracion (d936f41,
      15949c1): daba 0 errores porque no leia `.oxlintrc.json`.
- [x] Paso 3. `ui/Modal.jsx` con el mismo DOM y migracion de BackupModal (la mas simple).
      Verificado en navegador: abre desde el menu, no se cierra sola (guard de 400 ms),
      conserva las clases y el maxWidth, cierra con Escape (nuevo, como el resto) y con
      el fondo, sin errores de pagina.
- [~] Paso 4. Migrar el resto, verificando cada uno.
      - [x] PrivacyPolicyModal: conserva z-index 99999 y sus estilos propios (el
            componente pasa `overlayStyle`), cierra con Escape y con el fondo.
      - [ ] AuthModal (tiene DOS overlays en el mismo archivo, hay que separarlos).
      - [x] FriendCompareModal y SpriteDetailModal: verificados (abren, cierran con
            Escape y con el fondo; el detalle conserva su pointerEvents condicional).
      - [x] ShareImageModal: verificado que el medidor sigue anclado a la pantalla
            (la primitiva estrena `afterCard` para el contenido que debe ir fuera de la
            tarjeta, porque el transform de la tarjeta ancla los position fixed).
      - [ ] admin/FamilyManagerModal, admin/SpiritEditorModal (1516 lineas, el ultimo).
- [ ] Paso 5. Borrar el andamiaje que quede sin uso.

## Reglas de trabajo
- Nada se despliega a produccion sin autorizacion explicita del usuario.
- Cada paso: oxlint + build + verificacion en navegador (monta la app, abre la modal,
  Escape, click en fondo, geometria del overlay).
- Un commit por paso, en espanol y corto, para poder revertir solo ese paso.
- El `Modal` debe renderizar el MISMO markup que hoy para que la migracion sea invisible:
  mismo `.modal-overlay`, misma clase del contenedor y misma animacion.

## Criterios de aceptacion
1. Aspecto y comportamiento identicos en cada modal migrado (verificado en navegador).
2. Las 9 modales migradas sin duplicar overlay, Escape, fondo ni animacion.
3. Lint y build limpios en cada paso.
4. Cero cambios en produccion hasta autorizacion.

## Ruta
Delegada/inline por paso segun tamano. Paso 1 inline (3 cambios mecanicos ya entendidos).
