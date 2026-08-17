import { describe, expect, it } from 'vitest';
import { motionTimeScale } from '../src/engine/scene.ts';
import { MOTION_MIN_SCALE, MOTION_SLOWDOWN_ZOOM_START, ZOOM_MAX, ZOOM_MIN } from '../src/engine/constants.ts';

describe('motionTimeScale', () => {
  it('runs at full speed at and below the slowdown start', () => {
    expect(motionTimeScale(ZOOM_MIN)).toBe(1);
    expect(motionTimeScale(MOTION_SLOWDOWN_ZOOM_START)).toBe(1);
  });

  it('eases down to MOTION_MIN_SCALE exactly at ZOOM_MAX', () => {
    expect(motionTimeScale(ZOOM_MAX)).toBeCloseTo(MOTION_MIN_SCALE, 9);
  });

  it('clamps rather than going below MOTION_MIN_SCALE past ZOOM_MAX', () => {
    expect(motionTimeScale(ZOOM_MAX * 10)).toBeCloseTo(MOTION_MIN_SCALE, 9);
  });

  it('is monotonically non-increasing as zoom increases', () => {
    const samples = Array.from({ length: 50 }, (_, i) => ZOOM_MIN + (i / 49) * (ZOOM_MAX - ZOOM_MIN));
    const scales = samples.map(motionTimeScale);
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeLessThanOrEqual(scales[i - 1] as number);
    }
  });

  it('has no visible snap at the slowdown start boundary', () => {
    const just_below = motionTimeScale(MOTION_SLOWDOWN_ZOOM_START - 0.001);
    const just_above = motionTimeScale(MOTION_SLOWDOWN_ZOOM_START + 0.001);
    expect(Math.abs(just_below - just_above)).toBeLessThan(0.01);
  });
});
