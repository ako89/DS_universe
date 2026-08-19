/**
 * Traps Tab/Shift+Tab focus cycling within `container`'s focusable elements while `isActive()`
 * is true, stopping propagation so a global handler (e.g. engine/input.ts's Tab-cycles-bodies
 * shortcut) doesn't also fire. Shared by ui/card.ts and ui/guide.ts — both open as an overlay the
 * user tabs around inside of and Esc's out of.
 */

const FOCUSABLE_SELECTOR = 'button, a[href], summary, [tabindex]';

export function trapFocus(container: HTMLElement, isActive: () => boolean): () => void {
  function focusable(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (node) => !node.hasAttribute('disabled'),
    );
  }

  function onKeydown(e: KeyboardEvent): void {
    if (!isActive() || e.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      e.stopPropagation();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      e.stopPropagation();
      first.focus();
    } else {
      e.stopPropagation();
    }
  }

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}
