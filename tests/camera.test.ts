import { describe, expect, it } from 'vitest';
import { Camera } from '../src/engine/camera.ts';
import { ZOOM_MAX, ZOOM_MIN } from '../src/engine/constants.ts';

describe('Camera', () => {
  it('keeps the world point under the cursor fixed across a zoom', () => {
    const cam = new Camera(800, 600);
    cam.x = 100;
    cam.y = -50;
    cam.zoom = 1;

    const sx = 320;
    const sy = 240;
    const worldBefore = cam.screenToWorld(sx, sy);

    cam.zoomAt(sx, sy, 1.5);

    const worldAfter = cam.screenToWorld(sx, sy);
    expect(worldAfter.wx).toBeCloseTo(worldBefore.wx, 9);
    expect(worldAfter.wy).toBeCloseTo(worldBefore.wy, 9);
  });

  it('round-trips a screen point through worldToScreen/screenToWorld after pan and zoom', () => {
    const cam = new Camera(1024, 768);
    cam.panBy(120, -40);
    cam.zoomAt(500, 300, 2);
    cam.panBy(-30, 15);

    const sx = 700;
    const sy = 450;
    const world = cam.screenToWorld(sx, sy);
    const screen = cam.worldToScreen(world.wx, world.wy);

    expect(screen.sx).toBeCloseTo(sx, 9);
    expect(screen.sy).toBeCloseTo(sy, 9);
  });

  it('clamps zoom to ZOOM_MIN/ZOOM_MAX', () => {
    const cam = new Camera(800, 600);
    cam.zoomAt(400, 300, 1e9);
    expect(cam.zoom).toBeLessThanOrEqual(ZOOM_MAX);

    cam.zoomAt(400, 300, 1e-9);
    expect(cam.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
  });

  it('flyTo tweens to the target over time and then stops', () => {
    const cam = new Camera(800, 600);
    cam.flyTo(500, -200, 2, 1000);
    expect(cam.isTweening).toBe(true);

    cam.update(0.5);
    expect(cam.isTweening).toBe(true);
    // Midway through an ease-out-ish curve, we've made meaningful progress but not arrived.
    expect(cam.x).toBeGreaterThan(0);
    expect(cam.x).toBeLessThan(500);

    cam.update(0.6);
    expect(cam.isTweening).toBe(false);
    expect(cam.x).toBeCloseTo(500, 9);
    expect(cam.y).toBeCloseTo(-200, 9);
    expect(cam.zoom).toBeCloseTo(2, 9);
  });

  it('flyTo with ms <= 0 snaps immediately instead of starting a zero-duration tween', () => {
    const cam = new Camera(800, 600);
    cam.flyTo(300, 150, 3, 0);
    expect(cam.isTweening).toBe(false);
    expect(cam.x).toBe(300);
    expect(cam.y).toBe(150);
    expect(cam.zoom).toBe(3);

    // A zero-duration tween would divide 0/0 into NaN on the very first update (elapsed
    // starts at 0, e.g. the first frame after page load, where dt can itself be 0).
    cam.update(0);
    expect(Number.isNaN(cam.x)).toBe(false);
    expect(cam.x).toBe(300);
  });
});
