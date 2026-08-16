/**
 * World-space hit-testing and the universe/body/detail view state machine. See
 * docs/ENGINE_SPEC.md §3 (interaction model) and §8 (hit-testing).
 *
 * hitTest currently resolves bodies (stars/planets) only, never `entryId`. Moons have no stable
 * identity yet — SceneMoon (engine/scene.ts) is placeholder geometry with no Entry behind it
 * until Phase 3 content exists — so there is nothing honest to return as an entryId. Once
 * Phase 2/3 gives moons real ids, extend the moon loop here rather than inventing a synthetic id
 * now that later code might mistake for a real one.
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
): { bodyId: string; entryId?: string } | null {
  const { wx, wy } = cam.screenToWorld(sx, sy);

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
