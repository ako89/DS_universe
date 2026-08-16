/**
 * Top-left breadcrumb reflecting the current ViewState (engine/picking.ts): "Universe" always
 * present, then the focused body's name, then the open entry's name. Every segment except the
 * current page is a real button. See docs/ENGINE_SPEC.md §3.
 */

import type { ViewState } from '../engine/picking.ts';
import { system } from '../content/system.ts';
import { entries as contentEntries } from '../data/registry.ts';

export interface BreadcrumbHandlers {
  onRoot(): void;
  onBody(bodyId: string): void;
}

export interface BreadcrumbLayer {
  update(view: ViewState): void;
  destroy(): void;
}

const placements = [...system.stars, ...system.bodies];

function bodyName(bodyId: string): string {
  return placements.find((p) => p.id === bodyId)?.name ?? bodyId;
}

export function createBreadcrumb(handlers: BreadcrumbHandlers): BreadcrumbLayer {
  const el = document.createElement('nav');
  el.className = 'breadcrumb';
  el.setAttribute('aria-label', 'Breadcrumb');
  document.body.appendChild(el);

  function segment(label: string, isCurrent: boolean, onClick?: () => void): HTMLElement {
    if (isCurrent) {
      const span = document.createElement('span');
      span.className = 'breadcrumb-item';
      span.textContent = label;
      span.setAttribute('aria-current', 'page');
      return span;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'breadcrumb-item';
    button.textContent = label;
    button.addEventListener('click', () => onClick?.());
    return button;
  }

  function separator(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'breadcrumb-sep';
    span.textContent = '›';
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  function update(view: ViewState): void {
    el.replaceChildren();
    el.appendChild(segment('Universe', view.level === 'universe', handlers.onRoot));

    if (view.level === 'body' || view.level === 'detail') {
      el.appendChild(separator());
      el.appendChild(segment(bodyName(view.bodyId), view.level === 'body', () => handlers.onBody(view.bodyId)));
    }

    if (view.level === 'detail') {
      const entry = contentEntries.get(view.entryId);
      el.appendChild(separator());
      el.appendChild(segment(entry?.name ?? view.entryId, true));
    }
  }

  function destroy(): void {
    el.remove();
  }

  update({ level: 'universe' });

  return { update, destroy };
}
