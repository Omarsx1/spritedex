// Cofre que se muestra cuando un espiritu de 3ª generacion esta maxeado.
// Dos disenos y se alternan de forma estable por id: la misma carta siempre
// enseña el mismo cofre, pero no todos los maxeados se ven iguales.
export const COFRES_MAX = ['/cofre-max-oro.webp', '/cofre-max-plata.webp'];

export function cofreMaxDe(id = '') {
  // Peso por posicion, no suma simple: "peelybones_basic" y "parrot_basic"
  // sumaban igual y a los dos les tocaba el mismo cofre.
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return COFRES_MAX[hash % COFRES_MAX.length];
}
