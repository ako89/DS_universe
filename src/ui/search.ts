/**
 * `/` search palette (docs/ENGINE_SPEC.md §5): fuzzy search over every written entry, grouped by
 * body, arrow-key navigable, flies the camera and opens the card on selection. Renders into the
 * existing `#modal` element from index.html, which supplies the scrim/backdrop styling —
 * ui/advisor.ts takes turns with the same element; main.ts closes whichever isn't being opened,
 * since only one is ever shown (see that file's header for why they can share it safely).
 */

import type { SearchHit, SearchIndex } from '../data/search-index.ts';
import { search as runSearch } from '../data/search-index.ts';
import { entryBody } from '../data/registry.ts';
import { trapFocus } from './focus-trap.ts';

export interface SearchHandlers {
  onSelect(entryId: string): void;
}

export interface SearchLayer {
  /** `initialQuery`, when given, seeds the input and immediately shows its results — used by
   *  ui/toolbar.ts's desktop search box, which is a launcher: typing into it opens this palette
   *  and hands off whatever was typed so far, rather than running a second search UI of its own. */
  open(initialQuery?: string): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  destroy(): void;
}

const RESULT_LIMIT = 8;

interface Group {
  label: string;
  hits: SearchHit[];
}

/** Buckets already-ranked hits by body, preserving each body's first-appearance rank order, so
 *  the palette reads as clusters rather than a single flat list. */
function groupByBody(hits: SearchHit[]): Group[] {
  const order: string[] = [];
  const buckets = new Map<string, SearchHit[]>();

  for (const hit of hits) {
    const body = entryBody(hit.entry.id);
    const key = body?.name ?? 'Other';
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)?.push(hit);
  }

  return order.map((label) => ({ label, hits: buckets.get(label) ?? [] }));
}

export function createSearch(container: HTMLElement, idx: SearchIndex, handlers: SearchHandlers): SearchLayer {
  let open_ = false;
  let lastFocused: Element | null = null;
  let untrap: (() => void) | null = null;
  let flatHits: SearchHit[] = [];
  let selected = 0;

  let inputEl: HTMLInputElement | null = null;
  let listEl: HTMLElement | null = null;

  function select(i: number): void {
    const hit = flatHits[i];
    if (!hit) return;
    const entryId = hit.entry.id;
    // Close first: close() restores focus to whatever had it before the palette opened, and
    // onSelect (main.ts's focusEntry) then moves focus again to the card it opens. Closing after
    // onSelect would clobber that second focus move.
    close();
    handlers.onSelect(entryId);
  }

  function updateSelectionClasses(): void {
    if (!listEl) return;
    const items = listEl.querySelectorAll<HTMLElement>('.search-result');
    items.forEach((item, i) => {
      item.classList.toggle('is-selected', i === selected);
      item.setAttribute('aria-selected', String(i === selected));
      if (i === selected) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function renderResults(query: string): void {
    if (!listEl) return;
    listEl.replaceChildren();

    const trimmed = query.trim();
    flatHits = trimmed.length === 0 ? [] : runSearch(idx, trimmed, RESULT_LIMIT);
    selected = 0;

    if (trimmed.length === 0) {
      listEl.appendChild(Object.assign(document.createElement('p'), { className: 'search-hint', textContent: 'Type a name or describe what you\'re looking for.' }));
      return;
    }

    if (flatHits.length === 0) {
      listEl.appendChild(Object.assign(document.createElement('p'), { className: 'search-hint', textContent: 'No matches.' }));
      return;
    }

    let flatIndex = 0;
    for (const group of groupByBody(flatHits)) {
      listEl.appendChild(Object.assign(document.createElement('div'), { className: 'search-group-label', textContent: group.label }));
      for (const hit of group.hits) {
        const i = flatIndex++;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'search-result';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(i === selected));

        const name = document.createElement('span');
        name.className = 'search-result-name';
        name.textContent = hit.entry.name;
        item.appendChild(name);

        const hook = document.createElement('span');
        hook.className = 'search-result-hook';
        hook.textContent = hit.entry.hook;
        item.appendChild(hook);

        item.addEventListener('click', () => select(i));
        item.addEventListener('mousemove', () => {
          if (selected !== i) {
            selected = i;
            updateSelectionClasses();
          }
        });
        listEl.appendChild(item);
      }
    }

    updateSelectionClasses();
  }

  function moveSelection(delta: number): void {
    if (flatHits.length === 0) return;
    selected = (selected + delta + flatHits.length) % flatHits.length;
    updateSelectionClasses();
  }

  function onKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        e.stopPropagation();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        select(selected);
        break;
      default:
        break;
    }
  }

  function build(initialQuery: string): void {
    container.replaceChildren();
    container.setAttribute('aria-label', 'Search');

    const panel = document.createElement('div');
    panel.className = 'modal-panel';
    panel.setAttribute('role', 'document');
    container.appendChild(panel);

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'search-input';
    inputEl.placeholder = 'Search algorithms…';
    inputEl.setAttribute('aria-label', 'Search algorithms');
    inputEl.setAttribute('role', 'combobox');
    inputEl.setAttribute('aria-expanded', 'true');
    inputEl.value = initialQuery;
    inputEl.addEventListener('input', () => renderResults(inputEl?.value ?? ''));
    panel.appendChild(inputEl);

    listEl = document.createElement('div');
    listEl.className = 'search-results';
    listEl.setAttribute('role', 'listbox');
    panel.appendChild(listEl);

    container.addEventListener('keydown', onKeydown);
    container.addEventListener('click', (e) => {
      if (e.target === container) close();
    });

    renderResults(initialQuery);
  }

  function open(initialQuery = ''): void {
    if (open_) return;
    lastFocused = document.activeElement;
    open_ = true;
    build(initialQuery);
    container.hidden = false;
    untrap = trapFocus(container, () => open_);
    inputEl?.focus();
    inputEl?.setSelectionRange(initialQuery.length, initialQuery.length);
  }

  function close(): void {
    if (!open_) return;
    open_ = false;
    container.hidden = true;
    untrap?.();
    untrap = null;
    container.replaceChildren();
    inputEl = null;
    listEl = null;
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    lastFocused = null;
  }

  function destroy(): void {
    close();
  }

  return { open, close, toggle: () => (open_ ? close() : open()), isOpen: () => open_, destroy };
}
