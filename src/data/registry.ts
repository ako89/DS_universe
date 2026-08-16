/**
 * Content discovery: gathers every `content/bodies/*.ts` module into flat lookups. See
 * docs/ENGINE_SPEC.md §6 (file layout) and §9 (module contract).
 *
 * `import.meta.glob(..., { eager: true })` is a Vite build-time macro — it only works inside
 * code Vite processes (the app bundle), not under plain `node`. `tools/validate-content.ts`
 * therefore does its own filesystem discovery rather than importing this module; see that
 * file's header comment.
 *
 * Each body module exports `export const body = {...} satisfies Body;` — that's the contract
 * content authors follow, not enforced by a type here beyond the glob's generic.
 */

import type { Body, Entry } from '../types/content.ts';

const modules = import.meta.glob<{ body: Body }>('../content/bodies/*.ts', { eager: true });

const bodyMap = new Map<string, Body>();
const entryMap = new Map<string, Entry>();
const entryBodyId = new Map<string, string>();

for (const [path, mod] of Object.entries(modules)) {
  const body = mod.body;

  const existingBody = bodyMap.get(body.id);
  if (existingBody) {
    throw new Error(`data/registry.ts: duplicate body id "${body.id}" in ${path} (already defined elsewhere)`);
  }
  bodyMap.set(body.id, body);

  for (const entry of body.moons) {
    const existingOwner = entryBodyId.get(entry.id);
    if (existingOwner) {
      throw new Error(
        `data/registry.ts: duplicate entry id "${entry.id}" in ${path} (already defined under body "${existingOwner}")`,
      );
    }
    entryMap.set(entry.id, entry);
    entryBodyId.set(entry.id, body.id);
  }
}

export const bodies: ReadonlyMap<string, Body> = bodyMap;
export const entries: ReadonlyMap<string, Entry> = entryMap;

export function entryBody(entryId: string): Body | undefined {
  const bodyId = entryBodyId.get(entryId);
  return bodyId === undefined ? undefined : bodyMap.get(bodyId);
}
