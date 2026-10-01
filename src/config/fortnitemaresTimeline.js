/**
 * Pacing of the one-time Fortnitemares entrance, in ms from the start of the
 * cinematic. Kept out of the component so `node --test` can assert the order
 * without a JSX transform.
 *
 * Reads as a season-launch sting (~4.4 s): the corruption builds, the bats
 * break the frame, the themed wordmark takes over, the crimson flood hits,
 * then the interface settles back to something readable.
 */
export const FNM_PHASES = [
  { id: 'corrupt', at: 0 },      // CRT tearing begins on the live UI
  { id: 'swarm', at: 420 },     // bats fly in from every edge
  { id: 'brand', at: 1080 },    // FORTNITE wordmark becomes Fortnitemares
  { id: 'curse', at: 1900 },    // crimson flood + scanline surge
  { id: 'settle', at: 3000 },   // layers thin out, interface readable
  { id: 'done', at: 4400 }      // cinematic finished, theme stays on
];

/* Bats released at the swarm beat. The count is what makes the entrance read as
   a flock crossing the screen rather than a handful of sprites; below ~20 the
   gaps between them are more visible than the swarm itself. */
export const FNM_SWARM_COUNT = 34;

/** Pause before the corruption starts, so the first paint is still the normal UI. */
export const FNM_BOOT_DELAY = 320;
