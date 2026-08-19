/**
 * Hover tooltip: name (with its algorithm family in parentheses), hook, and a meta line (moon
 * count / era range for a body, tier / year for an entry) near the cursor, with viewport-edge
 * flipping so it never runs off screen. See docs/ENGINE_SPEC.md §3 — HOVER_IN_MS before showing,
 * HOVER_OUT_MS before hiding, debounced so sweeping the cursor across a cluster of small bodies
 * doesn't flicker.
 *
 * Takes ids, not pre-resolved content — it looks up content/system.ts placement and, where
 * written, data/registry.ts content itself, so callers (main.ts) stay thin. A body or moon
 * without content yet still gets a tooltip (name + moon count, or nothing at all for an
 * unwritten moon slot — main.ts never calls show() for those, since picking.ts never reports
 * their id in the first place).
 *
 * `describe()` is exported for ui/a11y-status.ts to reuse: the same id -> {title, family, hook,
 * meta} resolution, read out to screen reader users via a live region instead of shown near a
 * cursor.
 */

import { HOVER_IN_MS, HOVER_OUT_MS } from '../engine/constants.ts';
import { system } from '../content/system.ts';
import { bodies as contentBodies, entries as contentEntries, entryBody } from '../data/registry.ts';

export interface TooltipLayer {
  /** `source` distinguishes a real mouse hover from a touch first-tap preview — the meta line's
   *  "how to open this" hint and the tooltip's on-screen position both read differently for a
   *  finger than a cursor. Defaults to 'mouse' for every existing call site (keyboard focus,
   *  label focus) that isn't touch-originated. */
  show(bodyId: string, entryId: string | undefined, clientX: number, clientY: number, source?: 'mouse' | 'touch'): void;
  hide(): void;
  destroy(): void;
}

export interface TooltipContent {
  title: string;
  /** The thing's algorithm family, shown as "Title (family)" — a body's `segment`, or a star's
   *  `systemName` (what the *whole system* orbiting it studies, not the star's own 6 moons —
   *  see content/system.ts's StarPlacement comment). Absent for an entry, which is a single
   *  algorithm rather than a family of them. */
  family?: string;
  hook?: string;
  /** One sentence explaining that a star's own moons are foundations/building blocks rather than
   *  algorithms — set only when this entry belongs to a star, where "why isn't this just a
   *  planet?" is otherwise a fair question. See content/system.ts's StarPlacement.moonNote. */
  starMoonNote?: string;
  meta: string;
}

const CURSOR_OFFSET_PX = 16;
const EDGE_MARGIN_PX = 4;
// On touch the "cursor" is a fingertip, which would otherwise sit directly under the tooltip —
// offset upward instead of to the lower-right so the previewed target (and the space for a
// second tap) stays visible.
const TOUCH_OFFSET_PX = 20;

const placements = [...system.stars, ...system.bodies];
const starIds = new Set<string>(system.stars.map((s) => s.id));

export function describe(bodyId: string, entryId: string | undefined): TooltipContent | null {
  if (entryId) {
    const entry = contentEntries.get(entryId);
    if (!entry) return null;
    const parent = entryBody(entryId);
    const starMoonNote = parent && starIds.has(parent.id) ? system.stars.find((s) => s.id === parent.id)?.moonNote : undefined;
    return {
      title: entry.name,
      hook: entry.hook,
      ...(starMoonNote !== undefined ? { starMoonNote } : {}),
      meta: `Tier ${entry.tier} · ${entry.year}`,
    };
  }

  const placement = placements.find((p) => p.id === bodyId);
  if (!placement) return null;
  const content = contentBodies.get(bodyId);
  const meta = content
    ? `${placement.moonCount} moons · ${content.eraRange[0]}–${content.eraRange[1]}`
    : `${placement.moonCount} moons`;
  // Stars show `systemName` (what the whole system studies); planets/the belt show `segment`
  // (their own family) — both fields already carry the right value per-placement, so this reads
  // the same field name either way rather than branching on `type`.
  const family = 'systemName' in placement ? placement.systemName : placement.segment;

  return content
    ? { title: placement.name, family, hook: content.hook, meta }
    : { title: placement.name, family, meta };
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

  function position(clientX: number, clientY: number, source: 'mouse' | 'touch'): void {
    const rect = el.getBoundingClientRect();
    const offset = source === 'touch' ? TOUCH_OFFSET_PX : CURSOR_OFFSET_PX;

    let x = clientX + offset;
    let y = source === 'touch' ? clientY - offset - rect.height : clientY + offset;

    if (x + rect.width > window.innerWidth - EDGE_MARGIN_PX) x = clientX - offset - rect.width;
    if (source === 'touch') {
      // Prefer above the finger; only drop below if there truly isn't room above.
      if (y < EDGE_MARGIN_PX) y = clientY + offset;
    } else if (y + rect.height > window.innerHeight - EDGE_MARGIN_PX) {
      y = clientY - offset - rect.height;
    }
    x = Math.max(EDGE_MARGIN_PX, x);
    y = Math.max(EDGE_MARGIN_PX, y);

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function render(content: TooltipContent, clientX: number, clientY: number, source: 'mouse' | 'touch'): void {
    el.replaceChildren();

    const title = document.createElement('div');
    title.className = 'tooltip-title';
    title.appendChild(document.createTextNode(content.title));
    if (content.family) {
      const family = document.createElement('span');
      family.className = 'tooltip-family';
      family.textContent = ` (${content.family})`;
      title.appendChild(family);
    }
    el.appendChild(title);

    if (content.hook) {
      const hook = document.createElement('div');
      hook.className = 'tooltip-hook';
      hook.textContent = content.hook;
      el.appendChild(hook);
    }

    if (content.starMoonNote) {
      const note = document.createElement('div');
      note.className = 'tooltip-star-note';
      note.textContent = content.starMoonNote;
      el.appendChild(note);
    }

    const meta = document.createElement('div');
    meta.className = 'tooltip-meta';
    meta.textContent = `${content.meta} · ${source === 'touch' ? 'tap again to open' : '↵ enter'}`;
    el.appendChild(meta);

    el.hidden = false;
    position(clientX, clientY, source);
  }

  function show(bodyId: string, entryId: string | undefined, clientX: number, clientY: number, source: 'mouse' | 'touch' = 'mouse'): void {
    const content = describe(bodyId, entryId);
    if (!content) return;

    window.clearTimeout(hideTimer);

    if (visible) {
      render(content, clientX, clientY, source);
      return;
    }

    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      visible = true;
      render(content, clientX, clientY, source);
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
