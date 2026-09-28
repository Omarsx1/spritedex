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
- [ ] Paso 3. Vincular Google con linkIdentity (con mensaje claro si el proyecto no tiene
      activado "Manual Linking", y sin prometer lo que no cumple).
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

