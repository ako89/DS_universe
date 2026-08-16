/**
 * Canvas setup: DPR-correct sizing and the single RAF loop. DPR handling lives only here — see
 * docs/ENGINE_SPEC.md §8. Render code must never call ctx.setTransform; it would clobber the
 * DPR scale set up below. If a renderer needs a transform, save() -> translate/rotate/scale ->
 * restore(), matched on every path including early returns.
 */

import { DPR_CAP, DT_CLAMP } from './constants.ts';

/** Narrowing a nullable `getContext` result inside an outer function doesn't carry into a
 *  nested function declaration's body (TS doesn't propagate control-flow narrowing across
 *  function boundaries), so the non-null check is isolated here where `ctx`'s declared type is
 *  the return type, not a narrowed one. */
function must2dContext(el: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = el.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable in this browser');
  return ctx;
}

export function createCanvas(el: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  vw: number;
  vh: number;
  onResize(cb: (vw: number, vh: number) => void): void;
} {
  const ctx = must2dContext(el);

  const callbacks: ((vw: number, vh: number) => void)[] = [];

  function resize(): { vw: number; vh: number } {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    el.width = Math.round(vw * dpr);
    el.height = Math.round(vh * dpr);
    // All render code from here on draws in CSS pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { vw, vh };
  }

  const initial = resize();

  const observer = new ResizeObserver(() => {
    const { vw, vh } = resize();
    for (const cb of callbacks) cb(vw, vh);
  });
  observer.observe(el);

  return {
    ctx,
    vw: initial.vw,
    vh: initial.vh,
    onResize(cb: (vw: number, vh: number) => void): void {
      callbacks.push(cb);
    },
  };
}

/** Starts a single requestAnimationFrame loop, calling `fn(dt, t)` in seconds every frame.
 *  `dt` is clamped to DT_CLAMP so a backgrounded tab doesn't hand back a multi-second jump.
 *  Returns a disposer that stops the loop. */
export function startLoop(fn: (dt: number, t: number) => void): () => void {
  let raf = 0;
  let last: number | null = null;
  let stopped = false;

  function tick(now: number): void {
    if (stopped) return;
    const dt = last === null ? 0 : Math.min((now - last) / 1000, DT_CLAMP);
    last = now;
    fn(dt, now / 1000);
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  return function stop(): void {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
