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
    // 0章: ★1 through the hiragana, ★2 through the katakana (docs/design/22 §2).
    expect(episodeArt('kana-1')).toContain('img/chara/naniwa/nexmax_star1_think.webp');
    expect(episodeArt('kana-6')).toContain('img/chara/naniwa/nexmax_star2_think.webp');
    // The hiragana boss: ★1 before the fight, ★2 in the closing story (§4.2).
    expect(episodeArt('kana-boss-1')).toContain('img/chara/naniwa/nexmax_star1_think.webp');
    expect(episodeArt('kana-boss-1')).toContain('img/chara/naniwa/nexmax_star2_smile.webp');
    expect(episodeArt('moji-1-2')).toContain('img/chara/naniwa/folk_yamada_sad.webp');
    expect(episodeArt('moji-1-1')).toContain('img/battle/frame_top.webp');
  });

  it('fetches the まとめの ボス too: its nest, the big モジクイ and the town with its lights back', () => {
    const art = episodeArt('moji-1-boss');
    expect(art).toContain('img/naniwa/naniwa_nest.webp');
    expect(art).toContain('img/battle/mojikui_boss.webp');
    expect(art).toContain('img/naniwa/naniwa_lights_back.webp');
    expect(art.filter((p) => !existsSync(`public/${p}`))).toEqual([]);
  });
});
