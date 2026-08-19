/**
 * Section builders for ui/guide.ts — split out purely to keep guide.ts (the dialog shell: open,
 * close, focus trap) under PLAN.md §0's 300-line file cap, mirroring ui/card.ts / card-sections.ts.
 *
 * Everything here is either a static explanation of the map's own rules (grounded in PLAN.md §2/
 * §3 and the content modules — no invented pedagogical claims, per PLAN.md §0 rule 14) or built
 * at runtime from content/system.ts + data/registry.ts, never hand-written, so it cannot drift
 * from the actual content.
 */

import { system } from '../content/system.ts';
import type { BodyPlacement, StarPlacement } from '../content/system.ts';
import { bodies as contentBodies } from '../data/registry.ts';

export interface GuideHandlers {
  /** Closes the Guide and flies to `bodyId` — reuses main.ts's goToBody. */
  onGoToBody(bodyId: string): void;
  /** Closes the Guide and opens `entryId`'s card — reuses main.ts's focusEntry. */
  onGoToEntry(entryId: string): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function section(heading: string): HTMLElement {
  const sec = el('section', 'guide-section');
  sec.appendChild(el('h3', undefined, heading));
  return sec;
}

export function buildHowToExplore(): HTMLElement {
  const sec = section('How to explore');
  const p1 = el(
    'p',
    'guide-prose',
    'Click a body to fly in — its algorithms appear as moons. Click a moon for the full card. ' +
      'Esc, or the breadcrumb in the top-left, goes back a level.',
  );
  const p2 = el(
    'p',
    'guide-prose',
    'Drag to pan; scroll or pinch to zoom. On touch, the first tap previews a body or moon — ' +
      'showing its name and a one-line description — and a second tap opens it.',
  );
  sec.append(p1, p2);
  return sec;
}

export function buildTheTwoStars(): HTMLElement {
  const sec = section('The two stars');
  const [sol, nova] = system.stars as [StarPlacement, StarPlacement];
  sec.appendChild(
    el(
      'p',
      'guide-prose',
      `Two gravitational centres: ${sol.name} (${sol.systemName.toLowerCase()}) at the origin, ` +
        `${nova.name} (${nova.systemName.toLowerCase()}) far out. Deep-learning bodies sit in the ` +
        'transit between them, and bodies past the midpoint render lit from Nova rather than Sol.',
    ),
  );
  sec.appendChild(
    el(
      'p',
      'guide-prose',
      `A star has its own six moons too — but they aren't algorithms. ${sol.name}'s (${sol.segment}) ` +
        `are the ideas every algorithm on every planet is built from: pick a model, define a loss, ` +
        `minimize it over data. ${nova.name}'s (${nova.segment}) are the architectural primitives ` +
        `every body in the Nova system is assembled from. Hovering one explains this on the spot.`,
    ),
  );
  return sec;
}

export function buildOrdering(): HTMLElement {
  const sec = section('How things are ordered');
  const ul = el('ul', 'guide-list');
  ul.appendChild(
    el(
      'li',
      undefined,
      'Bodies orbit outward roughly by increasing complexity and recency — the inner Sol system ' +
        'is classical and foundational, the Belt is the craft of evaluation, the mid system is ' +
        'structure and uncertainty, the transit is deep learning, the Nova system is transformers ' +
        'and LLMs.',
    ),
  );
  ul.appendChild(
    el(
      'li',
      undefined,
      "A body's moons are ordered outward in the order they were written — foundational methods " +
        'first, then variants and successors.',
    ),
  );
  sec.appendChild(ul);
  return sec;
}

export function buildReadingKey(): HTMLElement {
  const sec = section('Reading a card');
  const ul = el('ul', 'guide-list');
  ul.appendChild(
    el(
      'li',
      undefined,
      'Tier 1 is a full card. Tier 2 is short, not partial — the same bar on its intuition and ' +
        'when-to-use, just without the maths/code sections. Tier 2 moons render smaller and ' +
        'dimmer on purpose, so the hierarchy is visible at a glance.',
    ),
  );
  ul.appendChild(
    el(
      'li',
      undefined,
      'The year is the single most load-bearing, independently verified originating publication ' +
        '— not when a method became popular. Where that choice was a judgement call, the entry ' +
        'says so.',
    ),
  );
  sec.appendChild(ul);
  return sec;
}

/** The transit — bodies that are neither purely "Sol system" nor purely "Nova system" in feel,
 *  even though every body past the midpoint is `litBy: 'nova'` in scene-rendering terms — is
 *  derived from content/system.ts's own declaration order (the contiguous run from 'prometheus'
 *  through 'odyssey', bracketed by that file's own "--- The transit ---" / "--- Nova system
 *  ---" comments) rather than hand-listed, so it cannot silently drift if system.ts is reordered. */
function sectionsOf(bodies: readonly BodyPlacement[]): { sol: BodyPlacement[]; transit: BodyPlacement[]; nova: BodyPlacement[] } {
  const transitStart = bodies.findIndex((b) => b.id === 'prometheus');
  const transitEnd = bodies.findIndex((b) => b.id === 'odyssey');
  return {
    sol: bodies.slice(0, transitStart),
    transit: bodies.slice(transitStart, transitEnd + 1),
    nova: bodies.slice(transitEnd + 1),
  };
}

function accordionRow(
  id: string,
  name: string,
  family: string,
  handlers: GuideHandlers,
  onNavigate: () => void,
): HTMLElement {
  const moons = contentBodies.get(id)?.moons ?? [];

  const details = el('details', 'guide-row');
  const summary = el('summary', 'guide-row-summary');

  const label = el('span', 'guide-row-label');
  label.appendChild(el('span', 'guide-row-name', name));
  label.appendChild(el('span', undefined, ` — ${family}`));
  summary.appendChild(label);
  summary.appendChild(el('span', 'guide-row-count', String(moons.length)));
  details.appendChild(summary);

  // Clicking the family name flies straight to the body without needing to expand first — the
  // caret (native <summary> click target) still expands/collapses; this is a second, smaller
  // affordance layered on top, not a replacement for it.
  const goto = el('button', 'guide-row-goto', 'Go there');
  goto.type = 'button';
  goto.addEventListener('click', (e) => {
    e.preventDefault(); // don't also toggle <details>
    onNavigate();
  });
  summary.appendChild(goto);

  const list = el('ul', 'guide-row-moons');
  for (const moon of moons) {
    const li = el('li');
    const btn = el('button', 'guide-moon-link', moon.name);
    btn.type = 'button';
    btn.addEventListener('click', () => handlers.onGoToEntry(moon.id));
    li.appendChild(btn);
    if (moon.tier === 2) li.appendChild(el('span', 'guide-moon-tier', 'Tier 2'));
    list.appendChild(li);
  }
  details.appendChild(list);

  return details;
}

export function buildFamilyAccordion(handlers: GuideHandlers): HTMLElement {
  const sec = section('Every region and its family');
  sec.appendChild(
    el(
      'p',
      'guide-prose',
      "The direct answer to “what algorithm family is this?” — expand a region to see what's inside it.",
    ),
  );

  const { sol, transit, nova } = sectionsOf(system.bodies);
  const solStar = system.stars.find((s) => s.id === 'sol');
  const novaStar = system.stars.find((s) => s.id === 'nova');

  const groups: { label: string; rows: { id: string; name: string; family: string }[] }[] = [
    {
      label: 'The Sol system',
      rows: [
        ...(solStar ? [{ id: solStar.id, name: solStar.name, family: solStar.segment }] : []),
        ...sol.map((b) => ({ id: b.id, name: b.name, family: b.segment })),
      ],
    },
    { label: 'The transit', rows: transit.map((b) => ({ id: b.id, name: b.name, family: b.segment })) },
    {
      label: 'The Nova system',
      rows: [
        ...(novaStar ? [{ id: novaStar.id, name: novaStar.name, family: novaStar.segment }] : []),
        ...nova.map((b) => ({ id: b.id, name: b.name, family: b.segment })),
      ],
    },
  ];

  for (const group of groups) {
    sec.appendChild(el('h4', 'guide-group-label', group.label));
    for (const row of group.rows) {
      sec.appendChild(accordionRow(row.id, row.name, row.family, handlers, () => handlers.onGoToBody(row.id)));
    }
  }

  return sec;
}

export const SHORTCUTS: [string, string][] = [
  ['/', 'Search'],
  ['A', 'Problem → algorithm advisor'],
  ['?', 'This guide'],
  ['Esc', 'Back one level'],
  ['Tab / Shift+Tab', 'Cycle bodies in orbital order'],
  ['↵ Enter', 'Enter the hovered body or moon'],
  ['← / →', 'Previous / next moon, once its body is focused'],
  ['D', 'Toggle the dev FPS overlay'],
  ['Drag', 'Pan'],
  ['Scroll / pinch', 'Zoom, anchored at the cursor'],
];

export function buildShortcuts(): HTMLElement {
  const sec = section('Keyboard shortcuts');
  const dl = el('dl', 'guide-shortcuts');
  for (const [key, description] of SHORTCUTS) {
    dl.appendChild(el('dt', undefined, key));
    dl.appendChild(el('dd', undefined, description));
  }
  sec.appendChild(dl);
  return sec;
}
