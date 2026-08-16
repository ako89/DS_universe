/**
 * The detail card: docs/ENGINE_SPEC.md §4's 8 sections, in order, rendered into the existing
 * `#card` element from index.html. Intuition / how-it-works / when-to-use are always visible;
 * math and code are `<details>` (native, so collapse state, keyboard toggling and a11y come
 * free) and math renders lazily on first expand via ui/math.ts. Crossfades 180ms between entries
 * (e.g. a related-chip click while already open) and traps Tab focus while open. Section markup
 * lives in ui/card-sections.ts, split out to keep this file under the 300-line cap.
 *
 * Takes ids and resolves them itself (data/registry.ts, content/system.ts), same as
 * ui/tooltip.ts, so main.ts stays a thin bootstrap.
 *
 * One field ENGINE_SPEC §4.0 asks for that the schema has no room for: a "supervised /
 * unsupervised" chip. `Facets.task` doesn't map cleanly onto that binary for every task type
 * (representation, generation, retrieval, ranking, control and inference aren't cleanly either)
 * — guessing would risk a confidently wrong label, which PLAN.md §0 rule 14 rules out. The chip
 * (built in card-sections.ts) is shown only for task values with an unambiguous mapping and
 * omitted otherwise. Flagging this per PLAN.md §0's "design decision seems wrong → say so" rule.
 */

import type { Entry } from '../types/content.ts';
import { entries as contentEntries } from '../data/registry.ts';
import {
  accentHue,
  buildCode,
  buildHeader,
  buildHowItWorks,
  buildIntuition,
  buildMath,
  buildReferences,
  buildRelated,
  buildWhenTo,
  el,
} from './card-sections.ts';
import { trapFocus } from './focus-trap.ts';

export interface CardHandlers {
  onRelated(entryId: string): void;
  onClose(): void;
}

export interface CardLayer {
  open(entryId: string): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const CROSSFADE_MS = 180; // mirrors --dur-base in tokens.css

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createCard(container: HTMLElement, handlers: CardHandlers): CardLayer {
  const inner = el('div', 'card-inner');
  container.appendChild(inner);

  let open_ = false;
  let fadeTimer = 0;
  let lastFocused: Element | null = null;

  const untrap = trapFocus(container, () => open_);

  function renderEntry(entry: Entry): void {
    inner.replaceChildren();

    const closeBtn = el('button', 'card-close', '×');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => handlers.onClose());
    inner.appendChild(closeBtn);

    inner.appendChild(buildHeader(entry));
    inner.appendChild(buildIntuition(entry));
    inner.appendChild(buildHowItWorks(entry));
    inner.appendChild(buildWhenTo(entry));
    const math = buildMath(entry);
    if (math) inner.appendChild(math);
    const code = buildCode(entry);
    if (code) inner.appendChild(code);
    inner.appendChild(buildReferences(entry));
    inner.appendChild(buildRelated(entry, handlers.onRelated));

    const hue = accentHue(entry.id);
    if (hue !== undefined) container.style.setProperty('--card-accent-hue', String(hue));
    container.setAttribute('aria-label', `${entry.name} detail`);
  }

  function open(entryId: string): void {
    const entry = contentEntries.get(entryId);
    if (!entry) return; // picking only ever reports ids that resolve; nothing to show otherwise

    const wasOpen = open_;
    window.clearTimeout(fadeTimer);

    if (wasOpen && !reduceMotion()) {
      inner.classList.add('is-fading');
      fadeTimer = window.setTimeout(() => {
        renderEntry(entry);
        inner.classList.remove('is-fading');
      }, CROSSFADE_MS);
      return;
    }

    renderEntry(entry);
    if (!wasOpen) {
      lastFocused = document.activeElement;
      open_ = true;
      container.classList.add('is-open');
      const closeBtn = inner.querySelector<HTMLElement>('.card-close');
      closeBtn?.focus();
    }
  }

  function close(): void {
    if (!open_) return;
    window.clearTimeout(fadeTimer);
    open_ = false;
    container.classList.remove('is-open');
    inner.replaceChildren();
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    lastFocused = null;
  }

  function destroy(): void {
    window.clearTimeout(fadeTimer);
    untrap();
    inner.remove();
  }

  return { open, close, isOpen: () => open_, destroy };
}
