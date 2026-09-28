// Traduccion de los errores de autenticacion a algo que el usuario entienda.
// Modulo puro (sin dependencias de Vite ni de Supabase) para poder probarlo.
//
// Orden importante: primero el error del PROVEEDOR. La expresion de "manual linking"
// es estrecha a proposito: con /not enabled/ generica, el error de proveedor caia en
// la rama de vinculacion y culpaba a la causa equivocada.
export function mensajeDeAuth(error, esAnonimo) {
  const mensaje = error?.message || '';
  const codigo = error?.code || '';

  if (mensaje.includes('provider is not enabled') || codigo === 'validation_failed') {
    return 'Google no esta activado como proveedor en el proyecto. Puedes vincular con correo: conserva todo tu progreso.';
  }

  if (esAnonimo && /manual linking|linking is disabled|linkidentity/i.test(mensaje)) {
    return 'Vincular con Google todavia no esta activado en el proyecto (falta activar Manual Linking). Vincula con correo: conserva todo tu progreso igual.';
  }

  return mensaje || 'Error con Google Sign-In';
}

