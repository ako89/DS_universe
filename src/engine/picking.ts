/**
 * World-space hit-testing and the universe/body/detail view state machine. See
 * docs/ENGINE_SPEC.md §3 (interaction model) and §8 (hit-testing).
 *
 * hitTest resolves a moon's `entryId` only for the currently *focused* body (the optional
 * `focusBodyId` param) — matching ENGINE_SPEC §3's state table, where only the focused body's
 * moons are visible/faded in at all. A moon only has an id once its content module exists
 * (engine/scene.ts); anonymous moon slots are skipped, not treated as a click target, per
 * PLAN.md §0's no-invention rule — there is nothing to open a card with yet.
 */

import type { Camera } from './camera.ts';
import type { SceneBody } from './scene.ts';
import { MIN_PICK_PX } from './constants.ts';

export type ViewState =
  | { level: 'universe' }
  | { level: 'body'; bodyId: string }
  | { level: 'detail'; bodyId: string; entryId: string };

export function hitTest(
  bodies: SceneBody[],
  cam: Camera,
  sx: number,
  sy: number,
  focusBodyId?: string,
): { bodyId: string; entryId?: string } | null {
  const { wx, wy } = cam.screenToWorld(sx, sy);

  if (focusBodyId) {
    const focused = bodies.find((b) => b.id === focusBodyId);
    if (focused) {
      let bestMoon: { entryId: string; distSq: number } | null = null;
      for (const moon of focused.moons) {
        if (moon.id === undefined) continue; // no content behind this moon yet
        const pickR = Math.max(moon.radius, MIN_PICK_PX / cam.zoom);
        const dx = wx - moon.wx;
        const dy = wy - moon.wy;
        const distSq = dx * dx + dy * dy;
        if (distSq <= pickR * pickR && (!bestMoon || distSq < bestMoon.distSq)) {
          bestMoon = { entryId: moon.id, distSq };
        }
      }
      if (bestMoon) return { bodyId: focusBodyId, entryId: bestMoon.entryId };
    }
  }

  let best: { bodyId: string; distSq: number } | null = null;
  for (const body of bodies) {
    if (body.type === 'belt') continue; // a diffuse field, not a single clickable point

    const pickR = Math.max(body.radius, MIN_PICK_PX / cam.zoom);
    const dx = wx - body.wx;
    const dy = wy - body.wy;
    const distSq = dx * dx + dy * dy;

    if (distSq <= pickR * pickR && (!best || distSq < best.distSq)) {
      best = { bodyId: body.id, distSq };
    }
  }

  return best ? { bodyId: best.bodyId } : null;
}

/** Owns the current ViewState and the legal transitions between its three levels, per
 *  ENGINE_SPEC §3's state table. The UI reads `.view`; input.ts and later ui/ modules drive
 *  transitions through these methods rather than constructing ViewState values themselves. */
export class Picking {
  private state: ViewState = { level: 'universe' };

  get view(): ViewState {
    return this.state;
  }

  enterBody(bodyId: string): void {
    this.state = { level: 'body', bodyId };
  }

  enterDetail(bodyId: string, entryId: string): void {
    this.state = { level: 'detail', bodyId, entryId };
  }

  /** Esc, or any other "go back one level" action. */
  back(): void {
    if (this.state.level === 'detail') {
      this.state = { level: 'body', bodyId: this.state.bodyId };
    } else if (this.state.level === 'body') {
      this.state = { level: 'universe' };
    }
  }

  /** Double-click on empty space, or any other "return to the top" action. */
  reset(): void {
    this.state = { level: 'universe' };
  }
}
