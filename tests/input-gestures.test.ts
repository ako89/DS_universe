import { describe, expect, it } from 'vitest';
import { isDrag, withinRetapRadius, CLICK_DRAG_THRESHOLD_PX, TOUCH_DRAG_THRESHOLD_PX, TOUCH_RETAP_RADIUS_PX } from '../src/engine/input.ts';

// Regression coverage for the two pure decisions behind the mobile tap fix (docs/UX_PASS_PLAN.md
// Task 1b/1c): cumulative-distance drag classification, and the second-tap proximity fallback.
// The rest of attachInput is DOM/event-driven and deliberately not unit-tested here — see that
// file's header.

describe('isDrag', () => {
  it('does not classify a stationary tap as a drag on mouse', () => {
    expect(isDrag(0, 'mouse')).toBe(false);
    expect(isDrag(CLICK_DRAG_THRESHOLD_PX, 'mouse')).toBe(false);
  });

  it('classifies movement past the mouse threshold as a drag', () => {
    expect(isDrag(CLICK_DRAG_THRESHOLD_PX + 0.1, 'mouse')).toBe(true);
  });

  it('tolerates touch jitter under the touch threshold that would fail the mouse threshold', () => {
    // The whole point of a separate, higher touch threshold: a few px of finger jitter during a
    // stationary tap must not register as a drag on touch, even though it would on mouse.
    const jitter = CLICK_DRAG_THRESHOLD_PX + 2;
    expect(isDrag(jitter, 'mouse')).toBe(true);
    expect(isDrag(jitter, 'touch')).toBe(false);
  });

  it('classifies movement past the touch threshold as a drag', () => {
    expect(isDrag(TOUCH_DRAG_THRESHOLD_PX + 0.1, 'touch')).toBe(true);
  });

  it('is driven by cumulative distance, not a per-step delta', () => {
    // Eleven 1px steps sum to 11px travelled — over the touch threshold — even though each
    // individual step is far under it. A per-frame check would have missed this entirely.
    let travelled = 0;
    for (let i = 0; i < 11; i++) travelled += 1;
    expect(isDrag(travelled, 'touch')).toBe(true);
  });
});

describe('withinRetapRadius', () => {
  it('accepts a second tap that lands exactly on the previewed target', () => {
    expect(withinRetapRadius(0)).toBe(true);
  });

  it('accepts a second tap within the forgiveness radius', () => {
    expect(withinRetapRadius(TOUCH_RETAP_RADIUS_PX - 0.1)).toBe(true);
    expect(withinRetapRadius(TOUCH_RETAP_RADIUS_PX)).toBe(true);
  });

  it('rejects a second tap outside the forgiveness radius', () => {
    expect(withinRetapRadius(TOUCH_RETAP_RADIUS_PX + 0.1)).toBe(false);
  });
});
