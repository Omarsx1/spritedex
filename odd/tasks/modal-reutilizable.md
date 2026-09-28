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
- [ ] Paso 1. Red de seguridad barata: constantes del contrato de la captura, try/catch
      en el precalculo y regla `no-use-before-define` en el linter.
- [ ] Paso 2. Tests del contrato de la captura (clave determinista, marcar invalida,
      el export produce JPEG del tamano esperado).
- [ ] Paso 3. Crear `ui/Modal.jsx` con el mismo DOM que hay hoy y migrar UN modal
      (el mas simple), verificando.
- [ ] Paso 4. Migrar el resto en pares, verificando cada par.
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

