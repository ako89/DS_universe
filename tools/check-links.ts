/**
 * Checks every reference URL across all content modules actually resolves. Complements
 * `validate-content.ts`, which checks structure (ids, tiers, `related` resolution) but has no
 * idea whether a URL is alive — that gap is what this tool closes, per PLAN.md's Phase 3 checklist.
 *
 * Runs under plain `node` (Node 24 strips TS types natively — no tsx/ts-node), matching
 * `validate-content.ts`'s own approach, including the same Windows `pathToFileURL` fix for
 * dynamic `import()` of a bare `C:\...` path.
 *
 * A non-2xx/3xx result is not automatically "this link is dead": CONTENT_GUIDE §3 documents that
 * ACM, Springer, IEEE and Wiley (and, empirically, O'Reilly and SourceForge) routinely 403
 * automated fetches on pages that work fine in a real browser, and a busy host can 429 a request
 * that would succeed seconds later — confirmed directly while building this tool, when several
 * DOIs and a SourceForge doc page that had returned 200 to a manual check minutes earlier came
 * back 403/429 here, purely from this tool's own request volume. This tool reports every 403 and
 * 429 separately as a WARNING — it does not fail the run — because that status code alone is not
 * evidence the citation is bad. Everything else non-2xx (404, 5xx, timeouts, DNS failures, other
 * 4xx) is a hard FAILURE and fails the run: those are the ones "fix or drop every dead URL" is
 * actually asking about.
 *
 * Requests use a real browser User-Agent — several publisher and doc sites (bare curl, and by
 * extension a generic Node fetch UA) reject requests that don't look like a browser, which is a
 * bot-detection false positive, not a broken link. Concurrency is capped and requests are GET
 * (not HEAD) because some hosts respond differently — sometimes worse — to HEAD than to a real
 * browser-style GET; this was empirically the more reliable check during Phase 3 batch reviews.
 */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { Body, BookRef, Entry, Ref } from '../src/types/content.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const bodiesDir = path.join(repoRoot, 'src/content/bodies');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const TIMEOUT_MS = 25_000;
const CONCURRENCY = 6;

interface Citation {
  url: string;
  file: string;
  entryId: string;
  category: 'free' | 'papers' | 'books' | 'video';
}

function collectCitations(file: string, entry: Entry): Citation[] {
  const out: Citation[] = [];
  const push = (category: Citation['category'], refs: (Ref | BookRef)[] | undefined) => {
    for (const ref of refs ?? []) {
      if (ref.url) out.push({ url: ref.url, file, entryId: entry.id, category });
    }
  };
  push('free', entry.references.free);
  push('papers', entry.references.papers);
  push('books', entry.references.books);
  push('video', entry.references.video);
  return out;
}

async function checkUrl(url: string): Promise<{ status: number } | { error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
    });
    return { status: res.status };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function runNext(): Promise<void> {
    const i = next++;
    if (i >= items.length) return;
    results[i] = await worker(items[i]!);
    await runNext();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runNext()));
  return results;
}

async function main(): Promise<void> {
  let filenames: string[];
  try {
    filenames = (await readdir(bodiesDir)).filter((f) => f.endsWith('.ts'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    filenames = [];
  }

  const allCitations: Citation[] = [];
  for (const filename of filenames) {
    const file = `src/content/bodies/${filename}`;
    const mod = (await import(pathToFileURL(path.join(bodiesDir, filename)).href)) as { body?: Body };
    if (!mod.body) continue;
    for (const entry of mod.body.moons) {
      allCitations.push(...collectCitations(file, entry));
    }
  }

  const byUrl = new Map<string, Citation[]>();
  for (const citation of allCitations) {
    const list = byUrl.get(citation.url) ?? [];
    list.push(citation);
    byUrl.set(citation.url, list);
  }
  const uniqueUrls = [...byUrl.keys()];

  console.log(`Checking ${uniqueUrls.length} unique URL(s) across ${allCitations.length} citation(s)...`);

  const results = await runPool(uniqueUrls, CONCURRENCY, async (url) => ({ url, result: await checkUrl(url) }));

  const failures: { url: string; detail: string; citations: Citation[] }[] = [];
  const warnings: { url: string; citations: Citation[] }[] = [];
  let okCount = 0;

  for (const { url, result } of results) {
    const citations = byUrl.get(url) ?? [];
    if ('error' in result) {
      failures.push({ url, detail: result.error, citations });
    } else if (result.status === 403 || result.status === 429) {
      warnings.push({ url, citations });
    } else if (result.status >= 200 && result.status < 400) {
      okCount++;
    } else {
      failures.push({ url, detail: `HTTP ${result.status}`, citations });
    }
  }

  console.log(`OK: ${okCount}`);

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} WARNING(s) — HTTP 403/429, likely bot-detection or rate-limiting, not a dead link.`);
    console.log('CONTENT_GUIDE §3: verify these manually before dropping the citation.');
    for (const { url, citations } of warnings) {
      console.log(`  403  ${url}`);
      for (const c of citations) console.log(`       ${c.file} :: ${c.entryId} (${c.category})`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} FAILURE(s):`);
    for (const { url, detail, citations } of failures) {
      console.error(`  ${detail}  ${url}`);
      for (const c of citations) console.error(`       ${c.file} :: ${c.entryId} (${c.category})`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('\ncheck-links: OK (no hard failures; see warnings above, if any, for manual review)');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
