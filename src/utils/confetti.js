// canvas-confetti solo hace falta cuando hay algo que celebrar: se importa en el
// momento del uso para que no entre en la ruta critica.
let confettiPromise = null;

export function fireConfetti(options) {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then((mod) => mod.default);
  }
  confettiPromise
    .then((confetti) => confetti(options))
    .catch(() => {});
}

