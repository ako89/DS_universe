/**
 * Builds and advances the scene: every star and body's world position, plus placeholder moon
 * sub-orbits. See docs/ENGINE_SPEC.md §8 for orbitPos (the tilt lives in the path, not the
 * camera) and §9 for the SceneBody contract.
 *
 * Deliberate deviation from the ENGINE_SPEC §9 contract: SceneBody does NOT carry `data: Body`.
 * No Entry/Body pedagogical content exists until Phase 3, and synthesizing placeholder
 * moons/eraRange to satisfy that type would violate PLAN.md §0's no-invention rules (see the
 * file comments in content/system.ts and the commit that added it). Rendering here is entirely
 * content-agnostic — Phase 2's ui/tooltip.ts and ui/card.ts should look up real content by id via
 * registry.ts separately, not through SceneBody.
 *
 * Moons are real in count (system.ts's moonCount is the actual count published in PLAN.md §3)
 * but placeholder in geometry: no names, just orbiting dots. Where a body's content module
 * exists (src/data/registry.ts), the first N moon slots pick up that module's real Entry ids, in
 * declaration order — see `id` below — so picking.ts has something honest to resolve. Slots
 * beyond the written moons stay anonymous (`id: undefined`) rather than inventing placeholder
 * content, per PLAN.md §0's no-invention rule; they become real once Phase 3 writes that moon.
 */

import { system } from '../content/system.ts';
import type { BodyPlacement } from '../content/system.ts';
import { bodies as contentBodies } from '../data/registry.ts';
import { BASE_PERIOD_S, MOON_BASE_PERIOD_S, MOTION_MIN_SCALE, MOTION_SLOWDOWN_ZOOM_START, TILT, ZOOM_MAX } from './constants.ts';
import { hashSeed, mulberry32 } from './rng.ts';

export interface SceneMoon {
  index: number;
  wx: number;
  wy: number;
  radius: number;
  orbitRadius: number;
  theta: number;
  speed: number;
  /** The real Entry id this moon renders, if its content has been written yet. Absent moons are
   *  visual-only: picking.ts skips them rather than opening a card with nothing to show. */
  id?: string;
}

export interface SceneBody {
  id: string;
  type: 'star' | 'planet' | 'belt';
  wx: number;
  wy: number;
  radius: number;
  hue: number;
  litBy?: 'sol' | 'nova'; // absent for stars themselves
  orbitRadius: number;
  theta: number;
  speed: number;
  moons: SceneMoon[];
  name: string;
  segment?: string; // bodies only
  rockCount?: number; // belt only
  /** World position this body orbits around (its host star; itself, for a star). Not part of
   *  the public contract — updateScene needs it to recompute wx/wy each frame. */
  centerX: number;
  centerY: number;
}

/** World-space orbital position. The y-squash (TILT) is baked into the path here, in world
 *  space — never in the camera transform (ENGINE_SPEC §8), so bodies stay circular. */
export function orbitPos(cx: number, cy: number, r: number, theta: number): { wx: number; wy: number } {
  return { wx: cx + r * Math.cos(theta), wy: cy + r * Math.sin(theta) * TILT };
}

/** Kepler-ish angular speed: proportional to 1/sqrt(orbitRadius), scaled so `refRadius` (in
 *  practice, Mercury's orbit) completes one turn every BASE_PERIOD_S seconds. */
function angularSpeed(orbitRadius: number, refRadius: number): number {
  if (orbitRadius <= 0) return 0;
  const refSpeed = (Math.PI * 2) / BASE_PERIOD_S;
  return refSpeed * Math.sqrt(refRadius / orbitRadius);
}

function moonAngularSpeed(moonOrbitRadius: number, innermostMoonOrbitRadius: number): number {
  const refSpeed = (Math.PI * 2) / MOON_BASE_PERIOD_S;
  return refSpeed * Math.sqrt(innermostMoonOrbitRadius / moonOrbitRadius);
}

function buildMoons(parentId: string, centerX: number, centerY: number, parentRadius: number, count: number): SceneMoon[] {
  if (count <= 0) return [];
  const rand = mulberry32(hashSeed(parentId));
  const innermost = parentRadius * 2.4;
  // In declaration order, so moon slot i renders content/bodies/<parentId>.ts's i-th moon, once
  // that module exists. Bodies with no content module yet (Phase 3 hasn't reached them) get [].
  const entryIds = contentBodies.get(parentId)?.moons.map((m) => m.id) ?? [];

  return Array.from({ length: count }, (_, i) => {
    const orbitRadius = parentRadius * (2.4 + i * 0.9);
    const theta = rand() * Math.PI * 2;
    const pos = orbitPos(centerX, centerY, orbitRadius, theta);
    const entryId = entryIds[i];
    return {
      index: i,
      wx: pos.wx,
      wy: pos.wy,
      radius: Math.max(1.5, parentRadius * 0.12),
      orbitRadius,
      theta,
      speed: moonAngularSpeed(orbitRadius, innermost),
      ...(entryId !== undefined ? { id: entryId } : {}),
    };
  });
}

function buildBody(placement: BodyPlacement, star: { at: readonly [number, number] }, mercuryOrbitRadius: number): SceneBody {
  const theta = placement.phase * Math.PI * 2;
  const speed = placement.type === 'belt' ? 0 : angularSpeed(placement.orbitRadius, mercuryOrbitRadius);
  const pos = orbitPos(star.at[0], star.at[1], placement.orbitRadius, theta);

  return {
    id: placement.id,
    type: placement.type,
    wx: pos.wx,
    wy: pos.wy,
    radius: placement.radius,
    hue: placement.hue,
    litBy: placement.litBy,
    orbitRadius: placement.orbitRadius,
    theta,
    speed,
    moons: placement.type === 'belt' ? [] : buildMoons(placement.id, pos.wx, pos.wy, placement.radius, placement.moonCount),
    name: placement.name,
    segment: placement.segment,
    ...(placement.rockCount !== undefined ? { rockCount: placement.rockCount } : {}),
    centerX: star.at[0],
    centerY: star.at[1],
  };
}

export function buildScene(): SceneBody[] {
  const starMap = new Map(system.stars.map((s) => [s.id, s]));

  const mercury = system.bodies.find((b) => b.id === 'mercury');
  if (!mercury) {
    throw new Error('content/system.ts is missing "mercury", the orbital period reference body');
  }

  const scene: SceneBody[] = [];

  for (const star of system.stars) {
    scene.push({
      id: star.id,
      type: 'star',
      wx: star.at[0],
      wy: star.at[1],
      radius: star.radius,
      hue: star.hue,
      orbitRadius: 0,
      theta: 0,
      speed: 0,
      moons: buildMoons(star.id, star.at[0], star.at[1], star.radius, star.moonCount),
      name: star.name,
      centerX: star.at[0],
      centerY: star.at[1],
    });
  }

  for (const placement of system.bodies) {
    const star = starMap.get(placement.litBy);
    if (!star) {
      throw new Error(`content/system.ts body "${placement.id}" references unknown star "${placement.litBy}"`);
    }
    scene.push(buildBody(placement, star, mercury.orbitRadius));
  }

  return scene;
}

/** Orbital speed multiplier for the current camera zoom: 1 (full speed) at or below
 *  MOTION_SLOWDOWN_ZOOM_START, easing down to MOTION_MIN_SCALE at ZOOM_MAX via a smoothstep so
 *  the transition has no visible snap. Callers scale `dt` by this before passing it to
 *  updateScene, rather than updateScene taking zoom itself — keeps updateScene's own contract
 *  (ENGINE_SPEC §9) untouched; this is a Phase 5 addition on top of it. */
export function motionTimeScale(zoom: number): number {
  if (zoom <= MOTION_SLOWDOWN_ZOOM_START) return 1;
  const t = Math.min(1, (zoom - MOTION_SLOWDOWN_ZOOM_START) / (ZOOM_MAX - MOTION_SLOWDOWN_ZOOM_START));
  const eased = t * t * (3 - 2 * t);
  return 1 - eased * (1 - MOTION_MIN_SCALE);
}

export function updateScene(bodies: SceneBody[], dt: number, paused: boolean): void {
  if (paused || dt <= 0) return;

  for (const body of bodies) {
    body.theta += body.speed * dt;
    const pos = orbitPos(body.centerX, body.centerY, body.orbitRadius, body.theta);
    body.wx = pos.wx;
    body.wy = pos.wy;

    for (const moon of body.moons) {
      moon.theta += moon.speed * dt;
      const moonPos = orbitPos(body.wx, body.wy, moon.orbitRadius, moon.theta);
      moon.wx = moonPos.wx;
      moon.wy = moonPos.wy;
    }
  }
}
