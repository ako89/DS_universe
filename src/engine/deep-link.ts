/**
 * URL hash deep links: `#/bodyId` or `#/bodyId/entryId` mirrors the current ViewState
 * (engine/picking.ts), so a link is shareable and the browser's back/forward buttons work.
 * Pure parsing/serialization only — main.ts owns deciding when to read/write the hash and what
 * to do with a hash that doesn't resolve to real content.
 */

import type { ViewState } from './picking.ts';

export interface DeepLink {
  bodyId: string;
  entryId?: string;
}

/** Parses `location.hash` (e.g. `"#/jupiter/dbscan"`). Null for an empty/root hash. */
export function parseHash(hash: string): DeepLink | null {
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const bodyId = segments[0];
  if (!bodyId) return null;
  const entryId = segments[1];
  return entryId !== undefined ? { bodyId, entryId } : { bodyId };
}

/** The hash a given ViewState should be reflected as. */
export function hashFor(view: ViewState): string {
  if (view.level === 'universe') return '#/';
  if (view.level === 'body') return `#/${view.bodyId}`;
  return `#/${view.bodyId}/${view.entryId}`;
}
