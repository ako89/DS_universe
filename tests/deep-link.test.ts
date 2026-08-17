import { describe, expect, it } from 'vitest';
import { hashFor, parseHash } from '../src/engine/deep-link.ts';

describe('parseHash', () => {
  it('parses a body-only hash', () => {
    expect(parseHash('#/jupiter')).toEqual({ bodyId: 'jupiter' });
  });

  it('parses a body/entry hash', () => {
    expect(parseHash('#/jupiter/dbscan')).toEqual({ bodyId: 'jupiter', entryId: 'dbscan' });
  });

  it('returns null for an empty or root hash', () => {
    expect(parseHash('')).toBeNull();
    expect(parseHash('#')).toBeNull();
    expect(parseHash('#/')).toBeNull();
  });

  it('tolerates a missing leading slash', () => {
    expect(parseHash('#jupiter/dbscan')).toEqual({ bodyId: 'jupiter', entryId: 'dbscan' });
  });

  it('ignores extra trailing segments', () => {
    expect(parseHash('#/jupiter/dbscan/extra')).toEqual({ bodyId: 'jupiter', entryId: 'dbscan' });
  });
});

describe('hashFor', () => {
  it('renders the universe level as the root hash', () => {
    expect(hashFor({ level: 'universe' })).toBe('#/');
  });

  it('renders the body level', () => {
    expect(hashFor({ level: 'body', bodyId: 'jupiter' })).toBe('#/jupiter');
  });

  it('renders the detail level', () => {
    expect(hashFor({ level: 'detail', bodyId: 'jupiter', entryId: 'dbscan' })).toBe('#/jupiter/dbscan');
  });

  it('round-trips through parseHash', () => {
    const view = { level: 'detail' as const, bodyId: 'jupiter', entryId: 'dbscan' };
    expect(parseHash(hashFor(view))).toEqual({ bodyId: view.bodyId, entryId: view.entryId });
  });
});
