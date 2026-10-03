import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { BGM_FILES, JINGLE_FILE } from './bgm';

describe('BGM', () => {
  it('has a file in public for every track and the jingle, small enough for a phone', () => {
    const files = [...Object.values(BGM_FILES), JINGLE_FILE];
    expect(files).toHaveLength(9);
    const bad = files.filter((f) => !existsSync(`public/${f}`) || statSync(`public/${f}`).size > 2.5 * 1024 * 1024);
    expect(bad).toEqual([]);
  });
});
