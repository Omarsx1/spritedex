// Cofre que se muestra cuando un espiritu de 3ª generacion esta maxeado.
// Dos disenos y se alternan de forma estable por id: la misma carta siempre
// enseña el mismo cofre, pero no todos los maxeados se ven iguales.
export const COFRES_MAX = ['/cofre-max-oro.webp', '/cofre-max-plata.webp'];

export function cofreMaxDe(id = '') {
  let suma = 0;
  for (let i = 0; i < id.length; i += 1) suma += id.charCodeAt(i);
  return COFRES_MAX[suma % COFRES_MAX.length];
}
