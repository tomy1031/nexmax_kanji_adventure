import { describe, it, expect } from 'vitest';
import { buildLabel, isSafeToReload } from './appUpdate';

describe('あたらしい 版に きりかえる', () => {
  it('reloads only where nothing is lost', () => {
    for (const p of ['/', '/map', '/map/moji', '/settings']) expect(isSafeToReload(p), p).toBe(true);
    for (const p of ['/moji/moji-1-4', '/kana/kana-1', '/gacha', '/forge', '/stage/x', '/prologue', '/versus', '/daily']) expect(isSafeToReload(p), p).toBe(false);
  });

  it('labels the build by its local date and time', () => {
    expect(buildLabel(new Date(2026, 9, 6, 18, 5).toISOString())).toBe('10/06 18:05');
    expect(buildLabel('nonsense')).toBe('');
  });
});
