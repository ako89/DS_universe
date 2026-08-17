import { describe, expect, it } from 'vitest';
import { expand, LEXICON } from '../src/data/lexicon.ts';

describe('lexicon', () => {
  it('has at least 150 terms', () => {
    expect(Object.keys(LEXICON).length).toBeGreaterThanOrEqual(150);
  });

  it('expands a single-word term', () => {
    expect(expand('churn')).toEqual(expect.arrayContaining(['classification', 'imbalanced', 'tabular', 'interpretable']));
  });

  it('expands a multi-word phrase', () => {
    expect(expand('I need to explain to my boss why')).toEqual(expect.arrayContaining(['interpretable']));
  });

  it('does not match a term as a substring of another word', () => {
    expect(expand('imagine a scenario')).not.toContain('vision');
  });

  it('dedupes tokens contributed by multiple matching keys', () => {
    const tokens = expand('churn prediction for tabular customer data, explain to my boss');
    expect(tokens.filter((t) => t === 'tabular').length).toBe(1);
  });

  it('returns an empty array for a query matching nothing', () => {
    expect(expand('xyzzy plugh')).toEqual([]);
  });
});
