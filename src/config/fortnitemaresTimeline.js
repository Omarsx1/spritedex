/**
 * Pacing of the one-time Fortnitemares entrance, in ms from the start of the
 * cinematic. Kept out of the component so `node --test` can assert the order
 * without a JSX transform.
 *
 * The entrance is a transformation IN PARTS, the way the user asked for it:
 * the interface stays visible the whole time and each piece changes on its own
 * beat, one after another. Part 1 is the brand (the wordmark mutates and the
 * swarm crosses the frame); part 2 is the ground (the blueprint grid
 * crossfades into the haunted forest); part 3 is the glow (pumpkin firelight,
 * fog and the seasonal accent details wake up). Nothing covers the screen:
 * the visitor watches the web become Fortnitemares piece by piece.
 */
export const FNM_PHASES = [
  { id: 'title', at: 400 },   // parte 1: FORTNITE muta a Fortnitemares + enjambre
  { id: 'ground', at: 2500 }, // parte 2: la rejilla cruza al bosque en crossfade
  { id: 'glow', at: 4100 },   // parte 3: fuego, niebla y acentos de temporada
  { id: 'settle', at: 5400 }, // calma: la interfaz queda completa
  { id: 'done', at: 6600 }    // cinematica terminada, el tema se queda
];

/* Bats released at the title beat. The count is what makes the entrance read as
   a flock crossing the screen rather than a handful of sprites; below ~20 the
   gaps between them are more visible than the swarm itself. */
export const FNM_SWARM_COUNT = 34;

/** Pause before the first part starts, so the first paint is still the normal UI. */
export const FNM_BOOT_DELAY = 320;
