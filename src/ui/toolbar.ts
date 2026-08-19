/**
 * The always-visible top-right control cluster (docs/UX_PASS_PLAN.md Task 5): a real search
 * input on desktop, a magnifier button on mobile, plus icon buttons for the advisor and the
 * guide. Search and the advisor were previously reachable only via the `/` and `A` keyboard
 * shortcuts (ui/search.ts, ui/advisor.ts) — this module adds the visible affordance neither had.
 *
 * The desktop input is a pure *launcher*, not a second search implementation: focusing it opens
 * ui/search.ts's palette (empty) and hands DOM focus straight to the palette's own input, all
 * synchronously within the same focus event — so by the time a user's first keystroke lands, it
 * is already going into the one real search input, not this one. That also means this input
 * never itself displays typed text to keep in sync with the palette — there is nothing to clear
 * when the palette closes, because nothing was ever typed here.
 */

export interface ToolbarHandlers {
  onSearch(): void;
  onAdvisor(): void;
  onGuide(): void;
}

export interface ToolbarLayer {
  destroy(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function magnifierIcon(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');

  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('cx', '8.5');
  circle.setAttribute('cy', '8.5');
  circle.setAttribute('r', '6');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', 'currentColor');
  circle.setAttribute('stroke-width', '1.8');
  svg.appendChild(circle);

  const line = document.createElementNS(NS, 'line');
  line.setAttribute('x1', '13.2');
  line.setAttribute('y1', '13.2');
  line.setAttribute('x2', '18');
  line.setAttribute('y2', '18');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '1.8');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  return svg;
}

export function createToolbar(handlers: ToolbarHandlers): ToolbarLayer {
  // Its own root appended straight to <body>, the same pattern ui/breadcrumb.ts uses — no
  // index.html placeholder to keep in sync, and pointer-events re-enabled only on the bar itself
  // (`.toolbar-layer` is pointer-events:none) so the fixed, full-width positioning wrapper never
  // steals a canvas drag that happens to pass under it.
  const container = document.createElement('div');
  container.className = 'toolbar-layer';
  document.body.appendChild(container);

  const bar = el('div', 'toolbar');
  container.appendChild(bar);

  const searchWrap = el('div', 'toolbar-search');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'toolbar-search-input';
  input.placeholder = 'Search algorithms…';
  input.setAttribute('aria-label', 'Search algorithms');
  input.addEventListener('focus', () => {
    // Blur *before* opening: ui/search.ts's open() captures `document.activeElement` as the
    // element focus returns to when the palette closes. Calling handlers.onSearch() first would
    // capture this input itself — and closing would refocus it, re-firing this very handler and
    // reopening the palette in an infinite loop (found by an end-to-end check: Escape silently
    // failed to close a toolbar-launched palette). Blurring first means nothing is focused (or
    // focus reverts to a neutral default) at capture time, so closing is a real close.
    input.blur();
    handlers.onSearch();
  });
  searchWrap.appendChild(input);

  const searchIconBtn = el('button', 'toolbar-search-icon-btn');
  searchIconBtn.type = 'button';
  searchIconBtn.setAttribute('aria-label', 'Search');
  searchIconBtn.title = 'Search (/)';
  searchIconBtn.appendChild(magnifierIcon());
  searchIconBtn.addEventListener('click', () => handlers.onSearch());
  searchWrap.appendChild(searchIconBtn);

  bar.appendChild(searchWrap);

  const advisorBtn = el('button', 'toolbar-btn');
  advisorBtn.type = 'button';
  advisorBtn.setAttribute('aria-label', 'Problem to algorithm advisor');
  advisorBtn.title = 'Advisor (A)';
  advisorBtn.textContent = '◈';
  advisorBtn.addEventListener('click', () => handlers.onAdvisor());
  bar.appendChild(advisorBtn);

  const guideBtn = el('button', 'toolbar-btn');
  guideBtn.type = 'button';
  guideBtn.setAttribute('aria-label', 'Guide');
  guideBtn.title = 'Guide (?)';
  guideBtn.textContent = '?';
  guideBtn.addEventListener('click', () => handlers.onGuide());
  bar.appendChild(guideBtn);

  function destroy(): void {
    container.remove();
  }

  return { destroy };
}
