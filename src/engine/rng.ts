/**
 * Seeded PRNG so procedural content (starfield, belt rocks) is stable across reloads instead
 * of reshuffling every refresh. See docs/ENGINE_SPEC.md §9.
 */

/** mulberry32: fast, small, good-enough statistical quality for visual jitter. Same seed
 *  always produces the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function (): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives a stable numeric seed from a body id, for per-body procedural variation (gas band
 *  noise, star pulse phase) that stays consistent across reloads without a table of seeds. */
export function hashSeed(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
