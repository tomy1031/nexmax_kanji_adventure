import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { episodeArt } from '../data/episodeArt';
import { CLASS_STEPS, STAR4_STAGE, charmSlots, classOf, wornAt } from './nexmaxClass';
import { MOJI_FINALES, getMojiFinale } from '../data/mojiFinale';
import { MOJI_CHAPTERS } from '../data/mojiRoute';
import { MOJI_EPISODES } from '../data/mojiEpisodes';
import { MOJI5_FINALE } from '../data/scripts/moji5';

const chapterOrder = (id: string) => MOJI_CHAPTERS.find((c) => c.id === id)!.order;

describe('ネクマックスの クラス (docs/design/21)', () => {
  it('starts at ★3 and becomes ★4 with 5章’s まとめの ボス, and no other', () => {
    expect(classOf([])).toBe(3);
    const others = MOJI_FINALES.filter((f) => f.id !== STAR4_STAGE).map((f) => f.id);
    expect(classOf(others)).toBe(3);
    expect(classOf([STAR4_STAGE])).toBe(4);
    expect(classOf([...others, STAR4_STAGE, 'moji-5-1'])).toBe(4);
  });

  it('is the finale whose story makes him ★4, in his class-up picture', () => {
    const boss = getMojiFinale(STAR4_STAGE)!;
    expect(chapterOrder(boss.chapter)).toBe(5);
    expect(MOJI5_FINALE.outro.stageId).toBe(STAR4_STAGE);
    const line = MOJI5_FINALE.outro.lines.find((l) => l.sprite === 'nexmax:star4' && l.text.includes('★4'));
    expect(line).toBeDefined();
  });

  it('comes once the route has taught as many kanji as the story says were written', () => {
    // 「あなたが 書いた 220字の ちからで」: every episode's kanji to ★1 before its fight, chapters 1〜5.
    const said = Number(MOJI5_FINALE.outro.lines.find((l) => l.sprite === 'nexmax:star4' && l.text.includes('★4'))!.text.match(/(\d+)字/)![1]);
    const taught = new Set(MOJI_EPISODES.filter((e) => chapterOrder(e.chapter) <= 5).flatMap((e) => e.kanji));
    expect(taught.size).toBe(said);
  });

  it('lists each class at the chapter whose まとめの ボス brings it', () => {
    expect(CLASS_STEPS.map((s) => s.star)).toEqual([3, 4, 5]);
    for (const s of CLASS_STEPS.filter((s) => s.stage)) {
      expect(s.stage, `★${s.star}`).toBe(`moji-${s.chapter}-boss`);
      const ch = MOJI_CHAPTERS.find((c) => c.order === s.chapter)!;
      expect(ch.summary, `★${s.star}`).toContain(`★${s.star}`);
    }
  });

  it('opens a second accessory at ★4, and counts it only from there', () => {
    expect(charmSlots(3)).toBe(1);
    expect(charmSlots(4)).toBe(2);
    const worn = { shield: null, body: null, charm: 'charm-tsuki', charm2: 'charm-yama' };
    expect(wornAt(worn, 3)).toEqual({ ...worn, charm2: null });
    expect(wornAt(worn, 4)).toBe(worn);
    const one = { shield: null, body: null, charm: 'charm-tsuki', charm2: null };
    expect(wornAt(one, 3)).toBe(one);
  });
});

describe('ネクマックスの ★4 の 絵 (docs/design/21 §3.1)', () => {
  const PAIRS: [string, string][] = [
    ['img/stageselect/nexmax_travel.webp', 'img/stageselect/nexmax_travel_star4.webp'],
    ['img/battle/nexmax_brush.webp', 'img/battle/nexmax_brush_star4.webp'],
  ];

  it('has each picture on the same canvas as the one it stands in for, so the gear sits on it as before', async () => {
    for (const [was, star4] of PAIRS) {
      expect(existsSync(`public/${star4}`), star4).toBe(true);
      const [a, b] = await Promise.all([sharp(`public/${was}`).metadata(), sharp(`public/${star4}`).metadata()]);
      expect([b.width, b.height], star4).toEqual([a.width, a.height]);
    }
    expect(existsSync('public/img/chara/naniwa/nexmax_star4.webp')).toBe(true);
  });

  it('fetches the ★4 fighter ahead of a fight at ★4, and the usual one before', () => {
    expect(episodeArt('moji-1-1')).toContain('img/battle/nexmax_brush.webp');
    const at4 = episodeArt('moji-1-1', { star4: true });
    expect(at4).toContain('img/battle/nexmax_brush_star4.webp');
    expect(at4).not.toContain('img/battle/nexmax_brush.webp');
  });
});
