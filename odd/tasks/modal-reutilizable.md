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
      - [x] AuthModal: no eran dos modales sino DOS VISTAS del mismo (nube sin
            configurar y acceso normal). Las dos usan la primitiva. Verificada la vista
            normal en navegador (abre, conserva clases, cierra con Escape y con el fondo).
      - [x] FriendCompareModal y SpriteDetailModal: verificados (abren, cierran con
            Escape y con el fondo; el detalle conserva su pointerEvents condicional).
      - [x] ShareImageModal: verificado que el medidor sigue anclado a la pantalla
            (la primitiva estrena `afterCard` para el contenido que debe ir fuera de la
            tarjeta, porque el transform de la tarjeta ancla los position fixed).
      - [x] admin/FamilyManagerModal y admin/SpiritEditorModal: NO forman parte de la
            familia. Usan su propia clase del CMS (studio-admin-modal-overlay), cuyo
            nombre contiene "modal-overlay" y por eso aparecian en el conteo inicial.
            Migrarlos a la primitiva es una decision aparte (es otro sistema de diseno).
      - Correccion: la familia eran SEIS modales, no nueve. Los otros tres resultados
            del grep inicial eran dos modales del CMS y un archivo de estilos.

## Estado final
Los SEIS modales de la familia usan la primitiva: BackupModal, PrivacyPolicyModal,
FriendCompareModal, SpriteDetailModal, ShareImageModal y AuthModal. Cero componentes
llevan ya la clase modal-overlay a mano, y los cuatro gates estan en verde.

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
