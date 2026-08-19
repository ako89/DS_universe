/**
 * Section builders for ui/card.ts — split out purely to keep card.ts (the state machine: open,
 * close, crossfade, focus trap) under PLAN.md §0's 300-line file cap. See card.ts's header for
 * the section list and the schema-vs-spec note about the supervised/unsupervised chip.
 */

import type { Entry, Task } from '../types/content.ts';
import { system } from '../content/system.ts';
import { entries as contentEntries, entryBody } from '../data/registry.ts';
import { renderMath } from './math.ts';

const SUPERVISED: ReadonlySet<Task> = new Set(['regression', 'classification', 'forecasting']);
const UNSUPERVISED: ReadonlySet<Task> = new Set(['clustering', 'dimensionality-reduction', 'anomaly-detection']);

const placements = [...system.stars, ...system.bodies];

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function paradigmChip(entry: Entry): string | null {
  const tasks = entry.facets.task;
  if (tasks.some((t) => SUPERVISED.has(t)) && !tasks.some((t) => UNSUPERVISED.has(t))) return 'supervised';
  if (tasks.some((t) => UNSUPERVISED.has(t)) && !tasks.some((t) => SUPERVISED.has(t))) return 'unsupervised';
  return null;
}

export function buildHeader(entry: Entry): HTMLElement {
  const header = el('header', 'card-header');
  const body = entryBody(entry.id);
  if (body) header.appendChild(el('div', 'card-eyebrow', body.segment));

  header.appendChild(el('h2', 'card-title', entry.name));
  if (entry.aliases?.length) header.appendChild(el('div', 'card-aliases', `aka ${entry.aliases.join(', ')}`));
  header.appendChild(el('p', 'card-hook', entry.hook));

  const chips = el('div', 'card-chips');
  for (const task of entry.facets.task) chips.appendChild(el('span', 'chip', task));
  const paradigm = paradigmChip(entry);
  if (paradigm) chips.appendChild(el('span', 'chip', paradigm));
  chips.appendChild(el('span', 'chip', String(entry.year)));
  chips.appendChild(el('span', 'chip chip-tier', `Tier ${entry.tier}`));
  header.appendChild(chips);

  return header;
}

export function buildIntuition(entry: Entry): HTMLElement {
  const section = el('section', 'card-section');
  section.appendChild(el('h3', undefined, 'Intuition'));
  section.appendChild(el('p', 'card-prose', entry.intuition));
  return section;
}

export function buildHowItWorks(entry: Entry): HTMLElement {
  const section = el('section', 'card-section');
  section.appendChild(el('h3', undefined, 'How it works'));
  section.appendChild(el('p', 'card-prose', entry.howItWorks.summary));

  const ol = el('ol', 'card-steps');
  for (const step of entry.howItWorks.steps) ol.appendChild(el('li', undefined, step));
  section.appendChild(ol);

  if (entry.hyperparameters?.length) {
    const table = el('table', 'card-hyperparams');
    const head = el('tr');
    head.appendChild(el('th', undefined, 'Hyperparameter'));
    head.appendChild(el('th', undefined, 'What'));
    head.appendChild(el('th', undefined, 'How to tune'));
    table.appendChild(head);
    for (const hp of entry.hyperparameters) {
      const row = el('tr');
      row.appendChild(el('td', 'card-hp-name', hp.name));
      row.appendChild(el('td', undefined, hp.what));
      row.appendChild(el('td', undefined, hp.tuning));
      table.appendChild(row);
    }
    section.appendChild(table);
  }

  return section;
}

export function buildWhenTo(entry: Entry): HTMLElement {
  const section = el('section', 'card-section');
  section.appendChild(el('h3', undefined, 'When to use / when it fails'));

  const cols = el('div', 'card-cols');
  const use = el('div');
  use.appendChild(el('h4', 'card-col-good', 'Use it when'));
  const useList = el('ul');
  for (const item of entry.whenToUse) useList.appendChild(el('li', undefined, item));
  use.appendChild(useList);

  const avoid = el('div');
  avoid.appendChild(el('h4', 'card-col-bad', 'It fails when'));
  const avoidList = el('ul');
  for (const item of entry.whenNotToUse) avoidList.appendChild(el('li', undefined, item));
  avoid.appendChild(avoidList);

  cols.appendChild(use);
  cols.appendChild(avoid);
  section.appendChild(cols);
  return section;
}

export function buildMath(entry: Entry): HTMLElement | null {
  if (!entry.math) return null;
  const details = el('details', 'card-section');
  details.appendChild(el('summary', undefined, 'The math'));
  const body = el('div', 'card-math-body');
  const mathContainer = el('div', 'card-math');
  body.appendChild(mathContainer);
  if (entry.math.notes) body.appendChild(el('p', 'card-prose card-math-notes', entry.math.notes));
  details.appendChild(body);

  let rendered = false;
  details.addEventListener('toggle', () => {
    if (details.open && !rendered && entry.math) {
      rendered = true;
      void renderMath(mathContainer, entry.math.latex);
    }
  });

  return details;
}

export function buildCode(entry: Entry): HTMLElement | null {
  if (!entry.code) return null;
  const details = el('details', 'card-section');
  details.appendChild(el('summary', undefined, 'In code'));
  const pre = el('pre', 'card-code');
  pre.appendChild(el('code', undefined, entry.code));
  details.appendChild(pre);
  return details;
}

export function buildReferences(entry: Entry): HTMLElement {
  const section = el('section', 'card-section');
  section.appendChild(el('h3', undefined, 'Go deeper'));

  const groups: { label: string; items: { title: string; url?: string }[] }[] = [
    { label: '🌐 Free', items: entry.references.free ?? [] },
    { label: '📄 Papers', items: entry.references.papers ?? [] },
    { label: '📖 Books', items: entry.references.books ?? [] },
    { label: '🎥 Video', items: entry.references.video ?? [] },
  ];

  for (const group of groups) {
    if (group.items.length === 0) continue;
    section.appendChild(el('h4', 'card-ref-group', group.label));
    const ul = el('ul', 'card-refs');
    for (const item of group.items) {
      const li = el('li');
      if (item.url) {
        const a = el('a', undefined, item.title);
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        li.appendChild(a);
      } else {
        li.textContent = item.title;
      }
      ul.appendChild(li);
    }
    section.appendChild(ul);
  }

  return section;
}

export function buildRelated(entry: Entry, onRelated: (id: string) => void): HTMLElement {
  const section = el('section', 'card-section');
  section.appendChild(el('h3', undefined, 'Related'));
  const chips = el('div', 'card-related');
  for (const relatedId of entry.related) {
    const target = contentEntries.get(relatedId);
    if (!target) continue;
    const button = el('button', 'chip chip-link', target.name);
    button.type = 'button';
    button.addEventListener('click', () => onRelated(relatedId));
    chips.appendChild(button);
  }
  section.appendChild(chips);
  return section;
}

export function accentHue(entryId: string): number | undefined {
  const body = entryBody(entryId);
  if (!body) return undefined;
  return placements.find((p) => p.id === body.id)?.hue;
}
