import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { episodeArt } from './episodeArt';
import { KANA_EPISODES } from './kana';
import { MOJI_EPISODES } from './mojiEpisodes';

describe('episodeArt — what the stage select fetches ahead', () => {
  const ids = [...KANA_EPISODES.map((e) => e.id), ...MOJI_EPISODES.filter((e) => e.kanji.length).map((e) => e.id)];

  it('lists only pictures that exist', () => {
    const missing = ids.flatMap((id) => episodeArt(id).filter((p) => !existsSync(`public/${p}`)).map((p) => `${id}: ${p}`));
    expect(missing).toEqual([]);
  });

  it('includes the opening scene and the portraits of every written episode', () => {
    expect(episodeArt('kana-1')).toContain('img/stageselect/bg_tall.webp');
    expect(episodeArt('kana-1')).toContain('img/chara/naniwa/nexmax_think.webp');
    expect(episodeArt('moji-1-2')).toContain('img/chara/naniwa/folk_yamada_sad.webp');
    expect(episodeArt('moji-1-1')).toContain('img/battle/frame_top.webp');
  });
});
