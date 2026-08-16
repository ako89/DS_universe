/**
 * The `?` help overlay: the keyboard map from docs/ENGINE_SPEC.md §3, in a focus-trapped,
 * Esc-closable dialog rendered into the existing `#help` element from index.html.
 */

import { trapFocus } from './focus-trap.ts';

export interface HelpLayer {
  toggle(): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const SHORTCUTS: [string, string][] = [
  ['/', 'Search'],
  ['A', 'Problem → algorithm advisor'],
  ['?', 'This help overlay'],
  ['Esc', 'Back one level'],
  ['Tab / Shift+Tab', 'Cycle bodies in orbital order'],
  ['↵ Enter', 'Enter the hovered body or moon'],
  ['← / →', 'Previous / next sibling moon, while a card is open'],
  ['D', 'Toggle the dev FPS overlay'],
  ['Drag', 'Pan'],
  ['Scroll / pinch', 'Zoom, anchored at the cursor'],
];

export function createHelp(container: HTMLElement): HelpLayer {
  container.className = 'help-scrim';
  container.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'help-panel';
  panel.setAttribute('role', 'document');
  container.appendChild(panel);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'help-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';
  panel.appendChild(closeBtn);

  panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Keyboard shortcuts' }));

  const dl = document.createElement('dl');
  for (const [key, description] of SHORTCUTS) {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = description;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
  panel.appendChild(dl);

  let open_ = false;
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
