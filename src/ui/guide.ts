/**
 * The `?` Guide: how to navigate the map, what Sol and Nova each contain, how bodies and moons
 * are ordered, a key for what tier/year mean on a card, every region's algorithm family in an
 * expand/collapse accordion, and the keyboard shortcut table last. A focus-trapped, Esc-closable
 * dialog rendered into the existing `#guide` element from index.html — this file is the shell
 * (open/close/focus trap); every section's content lives in ui/guide-sections.ts, split out to
 * keep this file under PLAN.md §0's 300-line cap.
 *
 * Formerly the plain keyboard-shortcut overlay (ui/help.ts) — grown per docs/UX_PASS_PLAN.md
 * Task 4 into the direct answer to "I'm just guessing what body is what algorithm family."
 */

import { trapFocus } from './focus-trap.ts';
import {
  buildFamilyAccordion,
  buildHowToExplore,
  buildOrdering,
  buildReadingKey,
  buildShortcuts,
  buildTheTwoStars,
  type GuideHandlers,
} from './guide-sections.ts';

export interface GuideLayer {
  toggle(): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

export function createGuide(container: HTMLElement, handlers: GuideHandlers): GuideLayer {
  container.className = 'help-scrim';
  container.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'help-panel guide-panel';
  panel.setAttribute('role', 'document');
  container.appendChild(panel);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'help-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  panel.appendChild(closeBtn);

  panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Guide' }));

  let open_ = false;

  // Closing the Guide is part of navigating from it (a "go there" click), not just an
  // Esc/backdrop dismissal — wrap the handlers so every accordion row's navigation closes the
  // panel first, the way search/advisor's onSelect already does for their own results.
  const navigatingHandlers: GuideHandlers = {
    onGoToBody: (bodyId) => {
      close();
      handlers.onGoToBody(bodyId);
    },
    onGoToEntry: (entryId) => {
      close();
      handlers.onGoToEntry(entryId);
    },
  };

  panel.appendChild(buildHowToExplore());
  panel.appendChild(buildTheTwoStars());
  panel.appendChild(buildOrdering());
  panel.appendChild(buildReadingKey());
  panel.appendChild(buildFamilyAccordion(navigatingHandlers));
  panel.appendChild(buildShortcuts());

  let lastFocused: Element | null = null;
  const untrap = trapFocus(panel, () => open_);

  function open(): void {
    if (open_) return;
    lastFocused = document.activeElement;
    open_ = true;
    container.hidden = false;
    closeBtn.focus();
  }

  function close(): void {
    if (!open_) return;
    open_ = false;
    container.hidden = true;
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
    lastFocused = null;
  }

  closeBtn.addEventListener('click', close);
  container.addEventListener('click', (e) => {
    if (e.target === container) close();
  });

  function destroy(): void {
    untrap();
    container.replaceChildren();
  }

  return { toggle: () => (open_ ? close() : open()), close, isOpen: () => open_, destroy };
}
