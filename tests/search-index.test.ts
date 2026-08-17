import { describe, expect, it } from 'vitest';
import { buildIndex, search, tokenize } from '../src/data/search-index.ts';
import { entries } from '../src/data/registry.ts';

const idx = buildIndex(entries.values());

describe('search-index', () => {
  it('tokenizes, lowercases and drops stopwords/short tokens', () => {
    expect(tokenize('The Gradient Boosting Machines!')).toEqual(['gradient', 'boosting', 'machines']);
  });

  it('finds an exact name match as the top hit', () => {
    const hits = search(idx, 'DBSCAN');
    expect(hits[0]?.entry.id).toBe('dbscan');
  });

  it('tolerates a small typo in a name', () => {
    const hits = search(idx, 'DBSCN');
    expect(hits[0]?.entry.id).toBe('dbscan');
  });

  it('surfaces relevant entries for a descriptive phrase', () => {
    const hits = search(idx, 'finds clusters of any shape using density');
    expect(hits.slice(0, 5).map((h) => h.entry.id)).toContain('dbscan');
  });

  it('returns nothing for an empty query', () => {
    expect(search(idx, '')).toEqual([]);
    expect(search(idx, '   ')).toEqual([]);
  });

  it('respects the limit parameter', () => {
    const hits = search(idx, 'classification', 3);
    expect(hits.length).toBeLessThanOrEqual(3);
  });
});
