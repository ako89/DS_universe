/**
 * Content integrity checks that `tsc` cannot express: duplicate ids, `related` ids that don't
 * resolve, tier completeness (array-length minimums the type system can't enforce), and every
 * content module's id having a real placement in content/system.ts. See docs/ENGINE_SPEC.md §7
 * ("what tsc cannot catch") and §6.
 *
 * Runs under plain `node` (Node 24 strips TS types natively — no tsx/ts-node). Because of that,
 * it does its own filesystem discovery of `src/content/bodies/*.ts` rather than importing
 * `src/data/registry.ts`, which relies on Vite's `import.meta.glob` build-time macro and only
 * works inside code Vite processes.
 *
 * System<->content parity is checked in one direction only: every discovered content module's
 * id must resolve to a real star or body in system.ts (catches a typo'd filename or stale
 * module). The reverse — every system.ts placement having a content module — is NOT required
 * here, because Phase 3 content lands incrementally, body by body; PLAN.md's Phase 2 acceptance
 * criterion is `npm run validate` passing with only a handful of bodies written. Placements
 * still missing a module are printed as an informational summary, not a failure.
 */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { system } from '../src/content/system.ts';
import type { Body, Entry } from '../src/types/content.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const bodiesDir = path.join(repoRoot, 'src/content/bodies');

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface Problem {
  file: string;
  message: string;
}

const errors: Problem[] = [];

function fail(file: string, message: string): void {
  errors.push({ file, message });
}

function countRefs(refs: Entry['references']): number {
  return (refs.free?.length ?? 0) + (refs.papers?.length ?? 0) + (refs.books?.length ?? 0) + (refs.video?.length ?? 0);
}

function checkEntry(file: string, entry: Entry): void {
  if (!KEBAB_CASE.test(entry.id)) {
    fail(file, `entry "${entry.id}": id is not kebab-case`);
  }
  if (entry.hook.length > 120) {
    fail(file, `entry "${entry.id}": hook is ${entry.hook.length} chars, over the 120 limit`);
  }
  if (entry.hook.trim().length === 0) {
    fail(file, `entry "${entry.id}": hook is empty`);
  }
  if (entry.intuition.trim().length === 0) {
    fail(file, `entry "${entry.id}": intuition is empty`);
  }

  if (entry.tier === 1) {
    if (entry.howItWorks.steps.length < 3) {
      fail(file, `entry "${entry.id}" (tier 1): howItWorks.steps has ${entry.howItWorks.steps.length}, needs >= 3`);
    }
    if (entry.whenToUse.length < 2) {
      fail(file, `entry "${entry.id}" (tier 1): whenToUse has ${entry.whenToUse.length}, needs >= 2`);
    }
    if (entry.whenNotToUse.length < 2) {
      fail(file, `entry "${entry.id}" (tier 1): whenNotToUse has ${entry.whenNotToUse.length}, needs >= 2`);
    }
    if (entry.related.length < 2) {
      fail(file, `entry "${entry.id}" (tier 1): related has ${entry.related.length}, needs >= 2`);
    }
    for (const category of ['free', 'papers', 'books', 'video'] as const) {
      if (!entry.references[category] || entry.references[category].length < 1) {
        fail(file, `entry "${entry.id}" (tier 1): references.${category} needs >= 1 entry`);
      }
    }
  } else {
    if (entry.related.length < 1) {
      fail(file, `entry "${entry.id}" (tier 2): related has ${entry.related.length}, needs >= 1`);
    }
    if (countRefs(entry.references) < 2) {
      fail(file, `entry "${entry.id}" (tier 2): references total is ${countRefs(entry.references)}, needs >= 2`);
    }
  }
}

async function main(): Promise<void> {
  const placementIds = new Set<string>([...system.stars.map((s) => s.id), ...system.bodies.map((b) => b.id)]);

  let filenames: string[];
  try {
    filenames = (await readdir(bodiesDir)).filter((f) => f.endsWith('.ts'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    filenames = []; // no body written yet at all — expected in early Phase 3
  }

  const bodiesById = new Map<string, { file: string; body: Body }>();
  const entriesById = new Map<string, { file: string; entry: Entry }>();

  for (const filename of filenames) {
    const file = `src/content/bodies/${filename}`;
    // pathToFileURL, not the bare path: on Windows a "C:\..." absolute path is rejected by the
    // ESM loader as an unsupported "c:" URL scheme.
    const mod = (await import(pathToFileURL(path.join(bodiesDir, filename)).href)) as { body?: Body };
    if (!mod.body) {
      fail(file, 'does not export `body`');
      continue;
    }
    const body = mod.body;

    if (!placementIds.has(body.id)) {
      fail(file, `body id "${body.id}" has no star or body placement in content/system.ts`);
    }

    const existingBody = bodiesById.get(body.id);
    if (existingBody) {
      fail(file, `duplicate body id "${body.id}" (also declared in ${existingBody.file})`);
    } else {
      bodiesById.set(body.id, { file, body });
    }

    for (const entry of body.moons) {
      checkEntry(file, entry);
      const existingEntry = entriesById.get(entry.id);
      if (existingEntry) {
        fail(file, `duplicate entry id "${entry.id}" (also declared in ${existingEntry.file})`);
      } else {
        entriesById.set(entry.id, { file, entry });
      }
    }
  }

  for (const { file, entry } of entriesById.values()) {
    for (const relatedId of entry.related) {
      if (!entriesById.has(relatedId)) {
        fail(file, `entry "${entry.id}": related id "${relatedId}" does not resolve to any known entry`);
      }
    }
  }

  const writtenPlacementIds = new Set(bodiesById.keys());
  const unwritten = [...placementIds].filter((id) => !writtenPlacementIds.has(id));

  console.log(`Discovered ${bodiesById.size} content module(s), ${entriesById.size} entr(y/ies).`);
  if (unwritten.length > 0) {
    console.log(`Not yet written (expected during Phase 3): ${unwritten.join(', ')}`);
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s):`);
    for (const { file, message } of errors) {
      console.error(`  ${file}: ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('validate-content: OK');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
