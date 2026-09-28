# Vinculacion de cuentas y proteccion del progreso anonimo

## Objetivo
Que un usuario anonimo (acceso rapido 1-clic) no pueda perder su progreso al vincular o
al cerrar sesion, y que vea el camino para vincular su cuenta.

## Problema (verificado contra la documentacion de Supabase)
1. El boton "Vincular con Google" llamaba a signInWithOAuth (inicio de sesion nuevo), no a
   linkIdentity: entraba como usuario NUEVO y con coleccion vacia, aunque la interfaz
   prometia conservar los sprites.
2. El menu del usuario solo ofrecia "Cerrar Sesion". Y el avatar, con sesion anonima
   abierta, abre el menu en vez de la modal: no habia camino visible para vincular.
3. handleSignOutCleanup borraba el progreso local (setUserState({}) + removeItem). Segun
   Supabase, un anonimo que cierra sesion ya no puede acceder a su cuenta: se perdian las
   dos copias.

## Plan por pasos (un commit y una verificacion por paso)
- [ ] Paso 1. Menu: estado honesto ("Solo en este dispositivo") y boton para vincular.
- [ ] Paso 2. Cerrar sesion ya no destruye: copia de recuperacion + oferta de restaurar.
 - [x] Paso 1. Menu: estado honesto ("Solo en este dispositivo"), nota de aviso y boton
      para vincular que abre la modal. Verificado en navegador con un usuario falso
      temporal (la rama anonima no se puede probar creando usuarios reales).
 - [x] Paso 2. Cerrar sesion ya no destruye: se guarda una copia recuperable y la app la
      restaura sola si no hay progreso local y la sesion es de invitado. Verificado: con
      copia valida restaura (2 espiritus marcados en la interfaz) y consume la copia; con
      copia de mas de 30 dias la descarta.
 - [x] Paso 3. Vincular Google con linkIdentity cuando la sesion es anonima, con mensaje
      claro si el proyecto no tiene "Manual Linking" activado. Verificado con
      instrumentacion temporal: la rama anonima llama a linkIdentity (no a signInWithOAuth).
 - [x] Hallazgo del paso 3: la modal de acceso solo se renderizaba con `!user`, asi que un
      invitado NO podia abrirla de ninguna forma (su boton en el menu habria quedado
      muerto). Ahora se abre tambien con sesion anonima, que es la unica via para
      vincular. Y se corrigio el texto que le prometia "seguro en la nube".
- [ ] Paso 4. Recuperar los datos de la usuaria afectada (requiere autorizacion explicita:
      es una escritura en la base).

## Reglas
- Nada a produccion sin autorizacion.
- Verificacion en navegador de las ramas anonimas con un usuario falso temporal en local
  (nunca creando usuarios reales en Supabase).
- Un commit por paso.

## Nota sobre Supabase
La vinculacion de identidades exige activar "Enable Manual Linking" en Authentication.
Sin eso, linkIdentity falla: el paso 3 debe detectarlo y decirlo, no fallar en silencio.
