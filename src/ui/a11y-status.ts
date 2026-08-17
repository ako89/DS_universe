/**
 * Screen-reader support for the canvas scene, which is `aria-hidden` (see index.html — the
 * canvas is a picture, not content; the real content lives in body labels and the card). Two
 * pieces:
 *
 * `populateSummary` writes a one-time text description of the whole map into `#a11y-summary`, so
 * a screen reader user landing on the page gets an overview instead of silence — the canvas
 * itself has nothing to announce.
 *
 * `createStatusAnnouncer` owns `#a11y-status`, an `aria-live="polite"` region that speaks
 * whatever's currently hovered or keyboard-focused. This matters most for moons: unlike bodies
 * (real focusable labels, see render/labels.ts), a moon has no DOM element of its own — without
 * this, a keyboard user cycling through them with Left/Right (engine/input.ts) would have no way
 * to know what they've landed on. Reuses ui/tooltip.ts's `describe()` so the two don't drift.
 */

import type { SceneBody } from '../engine/scene.ts';
import { bodies as contentBodies } from '../data/registry.ts';
import { describe } from './tooltip.ts';

export function populateSummary(container: HTMLElement, bodies: SceneBody[]): void {
  const stars = bodies.filter((b) => b.type === 'star');

  const intro = document.createElement('p');
  intro.textContent =
    `An explorable map of the data science algorithm universe, rendered as two star systems, ` +
    `${stars.map((s) => s.name).join(' and ')}, each with orbiting bodies — a family of related ` +
    `algorithms — that in turn have their own orbiting moons, the individual algorithms. Press ` +
    `Tab to move between bodies, Enter to open one, Left and Right arrows to move between its ` +
    `moons, and Escape to go back a level.`;
  container.appendChild(intro);

  const list = document.createElement('ul');
  for (const star of stars) {
    for (const body of bodies) {
      if (body.type === 'star' || body.litBy !== star.id) continue;
      const written = body.moons.filter((m) => m.id !== undefined).length;
      const content = contentBodies.get(body.id);
      const item = document.createElement('li');
      const hook = content ? ` — ${content.hook}` : '';
      item.textContent = `${body.name}, orbiting ${star.name}: ${body.segment ?? ''}${hook} (${written} algorithm${written === 1 ? '' : 's'}).`;
      list.appendChild(item);
    }
  }
  container.appendChild(list);
}

export interface StatusAnnouncer {
  update(bodyId: string | null, entryId: string | undefined): void;
  /** A one-off message unrelated to any body/entry — e.g. main.ts's deep-link restoration
   *  reporting that a shared link's id didn't resolve. There's no dedicated toast UI for that
   *  case, so it's read out here instead of failing silently. */
  announce(message: string): void;
}

export function createStatusAnnouncer(container: HTMLElement): StatusAnnouncer {
  function update(bodyId: string | null, entryId: string | undefined): void {
    if (!bodyId) {
      container.textContent = '';
      return;
    }
    const content = describe(bodyId, entryId);
    container.textContent = content ? [content.title, content.hook, content.meta].filter(Boolean).join('. ') : '';
  }

  function announce(message: string): void {
    container.textContent = message;
  }

  return { update, announce };
}
