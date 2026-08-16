/**
 * Every tunable number in the scene lives here. Import from this file — do not scatter
 * magic numbers through the render code.
 *
 * These are starting values, chosen to be implemented literally. Tune by eye later.
 * See docs/ENGINE_SPEC.md §4.1.
 */

/** Orbit y-squash, giving the three-quarter orrery view.
 *  IMPORTANT: this is applied to the orbital *path* in world space, never to the camera
 *  transform. Putting it in the camera renders every planet as an ellipse.
 *  See docs/ENGINE_SPEC.md §5.3. */
export const TILT = 0.55;

export const ZOOM_MIN = 0.08;
export const ZOOM_MAX = 6.0;
/** Multiplicative zoom per wheel notch. */
export const ZOOM_STEP = 1.12;

export const CAM_TWEEN_MS = 900;

/** Smallest clickable radius in *screen* pixels, so distant bodies stay pickable. */
export const MIN_PICK_PX = 14;

export const HOVER_IN_MS = 150;
export const HOVER_OUT_MS = 80;

/** Max delta-time in seconds per frame. Without this, returning to a backgrounded tab
 *  produces a multi-second dt and every body teleports along its orbit. */
export const DT_CLAMP = 0.05;

/** Cap the device pixel ratio. 3x displays quadruple fill rate for no visible gain. */
export const DPR_CAP = 2;

export const BG = '#05060d';

/** Mercury's orbital period in seconds. All other periods scale from this by
 *  1/sqrt(orbitRadius), so inner bodies visibly move faster. */
export const BASE_PERIOD_S = 180;

export const STAR_LAYERS = [
  { count: 700, parallax: 0.15, size: [0.6, 1.2], alpha: [0.25, 0.55] },
  { count: 320, parallax: 0.4, size: [0.9, 1.8], alpha: [0.35, 0.75] },
  { count: 140, parallax: 0.8, size: [1.2, 2.6], alpha: [0.5, 0.95] },
] as const;

/** Seeds for anything procedural, so belts and starfields are stable across reloads
 *  rather than reshuffling on every refresh. */
export const SEED_STARFIELD = 0x5eed_1a2b;
export const SEED_BELT = 0x5eed_c0de;

/** Viewport width below which the card becomes a bottom sheet. */
export const MOBILE_BREAKPOINT = 860;
