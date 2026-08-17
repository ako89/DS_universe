/**
 * `A` problem -> algorithm advisor (docs/ENGINE_SPEC.md §5): free text in, 3-5 ranked algorithms
 * out, each with its authored pros (`whenToUse`) and cons (`whenNotToUse`) and a "why this
 * matched" line. Phase 4 pipeline, lexical only (§5's Phase 7 semantic rerank is a later, opt-in
 * upgrade layered on top of this, never a dependency of it):
 *
 *   1. Tokenize/normalize the query and pull a coarse data-size hint out of it (e.g. "50k rows").
 *   2. Expand it via data/lexicon.ts into extra search terms.
 *   3. Run data/search-index.ts's BM25 + fuzzy search over query + expansion terms.
 *   4. Re-rank that pool by facet agreement between the expansion terms/size hint and each
 *      candidate's own `facets` — this is what lets "churn" (which expands to a task, a data
 *      type and "interpretable") separate a plausible tabular classifier from the specific ones
 *      whose authored facets actually match the problem.
 *   5. Keep the top N, each carrying its whenToUse/whenNotToUse and a matched-facet summary.
 *
 * The pipeline itself (steps 1-5) lives in ui/advisor-rank.ts, split out to keep this file (the
 * modal state machine + DOM building) under the 300-line cap — this file only wires it into the
 * shared `#modal` element ui/search.ts also uses; see that file's header for why the two can
 * safely take turns on it.
 */

import type { SearchIndex } from '../data/search-index.ts';
import type { AdvisorResult } from './advisor-rank.ts';
import { recommend } from './advisor-rank.ts';
import { entryBody } from '../data/registry.ts';
import { trapFocus } from './focus-trap.ts';

export interface AdvisorHandlers {
  onSelect(entryId: string): void;
}

export interface AdvisorLayer {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  destroy(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildResultCard(result: AdvisorResult, onSelect: (id: string) => void): HTMLElement {
  const card = el('div', 'advisor-result');

  const body = entryBody(result.entry.id);
  if (body) card.appendChild(el('div', 'advisor-result-eyebrow', body.segment));

  const nameBtn = el('button', 'advisor-result-name', result.entry.name);
  nameBtn.type = 'button';
  nameBtn.addEventListener('click', () => onSelect(result.entry.id));
  card.appendChild(nameBtn);

  card.appendChild(el('p', 'advisor-result-hook', result.entry.hook));

  if (result.why.length > 0) {
    card.appendChild(el('p', 'advisor-result-why', `Matched: ${result.why.join(', ')}`));
  }

  const cols = el('div', 'advisor-result-cols');

  const pros = el('div');
  pros.appendChild(el('h4', 'card-col-good', 'Use it when'));
  const prosList = el('ul');
  for (const item of result.entry.whenToUse) prosList.appendChild(el('li', undefined, item));
  pros.appendChild(prosList);
  cols.appendChild(pros);

  const cons = el('div');
  cons.appendChild(el('h4', 'card-col-bad', 'Cons'));
  const consList = el('ul');
  for (const item of result.entry.whenNotToUse) consList.appendChild(el('li', undefined, item));
  cons.appendChild(consList);
  cols.appendChild(cons);

  card.appendChild(cols);
  return card;
}

export function createAdvisor(container: HTMLElement, idx: SearchIndex, handlers: AdvisorHandlers): AdvisorLayer {
  let open_ = false;
  let lastFocused: Element | null = null;
  let untrap: (() => void) | null = null;

  let textarea: HTMLTextAreaElement | null = null;
  let resultsEl: HTMLElement | null = null;

  function select(entryId: string): void {
    // Same ordering as ui/search.ts's select(): close first so it restores pre-open focus before
    // onSelect (main.ts's focusEntry) moves focus again, to the card it opens.
    close();
    handlers.onSelect(entryId);
  }

  function runQuery(query: string): void {
    if (!resultsEl) return;
    resultsEl.replaceChildren();

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      resultsEl.appendChild(el('p', 'search-hint', 'Describe your data and what you need to predict or discover.'));
      return;
    }

    const results = recommend(idx, trimmed);
    if (results.length === 0) {
      resultsEl.appendChild(el('p', 'search-hint', 'No good match yet — try adding the kind of data and what you need from the answer.'));
      return;
    }

    for (const result of results) resultsEl.appendChild(buildResultCard(result, select));
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }

  function build(): void {
    container.replaceChildren();
    container.setAttribute('aria-label', 'Problem to algorithm advisor');

    const panel = el('div', 'modal-panel advisor-panel');
    panel.setAttribute('role', 'document');
    container.appendChild(panel);

    panel.appendChild(el('h2', 'advisor-title', 'What are you trying to do?'));
    panel.appendChild(el('p', 'advisor-disclaimer', 'A starting point, not a substitute for validating on your own data.'));

    textarea = el('textarea', 'advisor-input');
    textarea.rows = 3;
    textarea.placeholder = 'e.g. "50k rows of tabular customer data, need to predict churn and explain it to my boss"';
    textarea.setAttribute('aria-label', 'Describe your problem');
    textarea.addEventListener('input', () => runQuery(textarea?.value ?? ''));
    panel.appendChild(textarea);

    resultsEl = el('div', 'advisor-results');
    panel.appendChild(resultsEl);

    container.addEventListener('keydown', onKeydown);
    container.addEventListener('click', (e) => {
      if (e.target === container) close();
    });

    runQuery('');
  }

  function open(): void {
    if (open_) return;
    lastFocused = document.activeElement;
    open_ = true;
    build();
    container.hidden = false;
    untrap = trapFocus(container, () => open_);
    textarea?.focus();
  }

  function close(): void {
    if (!open_) return;
    open_ = false;
    container.hidden = true;
    untrap?.();
    untrap = null;
    container.replaceChildren();
    textarea = null;
    resultsEl = null;
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    lastFocused = null;
  }

  function destroy(): void {
    close();
  }

  return { open, close, toggle: () => (open_ ? close() : open()), isOpen: () => open_, destroy };
}
