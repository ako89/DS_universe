/**
 * Hover tooltip: name, hook, and a meta line (moon count / era range for a body, tier /
 * difficulty / year for an entry) near the cursor, with viewport-edge flipping so it never runs
 * off screen. See docs/ENGINE_SPEC.md §3 — HOVER_IN_MS before showing, HOVER_OUT_MS before
 * hiding, debounced so sweeping the cursor across a cluster of small bodies doesn't flicker.
 *
 * Takes ids, not pre-resolved content — it looks up content/system.ts placement and, where
 * written, data/registry.ts content itself, so callers (main.ts) stay thin. A body or moon
 * without content yet still gets a tooltip (name + moon count, or nothing at all for an
 * unwritten moon slot — main.ts never calls show() for those, since picking.ts never reports
 * their id in the first place).
 */

import { HOVER_IN_MS, HOVER_OUT_MS } from '../engine/constants.ts';
import { system } from '../content/system.ts';
import { bodies as contentBodies, entries as contentEntries } from '../data/registry.ts';

export interface TooltipLayer {
  show(bodyId: string, entryId: string | undefined, clientX: number, clientY: number): void;
  hide(): void;
  destroy(): void;
}

interface TooltipContent {
  title: string;
  hook?: string;
  meta: string;
}

const CURSOR_OFFSET_PX = 16;
const EDGE_MARGIN_PX = 4;

const placements = [...system.stars, ...system.bodies];

function describe(bodyId: string, entryId: string | undefined): TooltipContent | null {
  if (entryId) {
    const entry = contentEntries.get(entryId);
    if (!entry) return null;
    return {
      title: entry.name,
      hook: entry.hook,
      meta: `Tier ${entry.tier} · difficulty ${entry.difficulty}/5 · ${entry.year}`,
    };
  }

  const placement = placements.find((p) => p.id === bodyId);
  if (!placement) return null;
  const content = contentBodies.get(bodyId);
  const meta = content
    ? `${placement.moonCount} moons · ${content.eraRange[0]}–${content.eraRange[1]}`
    : `${placement.moonCount} moons`;

  return content
    ? { title: placement.name, hook: content.hook, meta }
    : { title: placement.name, meta };
}

export function createTooltip(): TooltipLayer {
  const el = document.createElement('div');
  el.className = 'tooltip';
  el.setAttribute('role', 'tooltip');
  el.hidden = true;
  document.body.appendChild(el);

  let showTimer = 0;
  let hideTimer = 0;
  let visible = false;

  function position(clientX: number, clientY: number): void {
    const rect = el.getBoundingClientRect();
    let x = clientX + CURSOR_OFFSET_PX;
    let y = clientY + CURSOR_OFFSET_PX;

    if (x + rect.width > window.innerWidth - EDGE_MARGIN_PX) x = clientX - CURSOR_OFFSET_PX - rect.width;
    if (y + rect.height > window.innerHeight - EDGE_MARGIN_PX) y = clientY - CURSOR_OFFSET_PX - rect.height;
    x = Math.max(EDGE_MARGIN_PX, x);
    y = Math.max(EDGE_MARGIN_PX, y);

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function render(content: TooltipContent, clientX: number, clientY: number): void {
    el.replaceChildren();

    const title = document.createElement('div');
    title.className = 'tooltip-title';
    title.textContent = content.title;
    el.appendChild(title);

    if (content.hook) {
      const hook = document.createElement('div');
      hook.className = 'tooltip-hook';
      hook.textContent = content.hook;
      el.appendChild(hook);
    }

    const meta = document.createElement('div');
    meta.className = 'tooltip-meta';
    meta.textContent = `${content.meta} · ↵ enter`;
    el.appendChild(meta);

    el.hidden = false;
    position(clientX, clientY);
  }

  function show(bodyId: string, entryId: string | undefined, clientX: number, clientY: number): void {
    const content = describe(bodyId, entryId);
    if (!content) return;

    window.clearTimeout(hideTimer);

    if (visible) {
      render(content, clientX, clientY);
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      visible = true;
      render(content, clientX, clientY);
    }, HOVER_IN_MS);
  }

  function hide(): void {
    window.clearTimeout(showTimer);
    if (!visible) return;
    hideTimer = window.setTimeout(() => {
      visible = false;
      el.hidden = true;
    }, HOVER_OUT_MS);
  }

  function destroy(): void {
    window.clearTimeout(showTimer);
    window.clearTimeout(hideTimer);
    el.remove();
  }

  return { show, hide, destroy };
}
