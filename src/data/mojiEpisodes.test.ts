import { describe, it, expect } from 'vitest';
import { MOJI_EPISODES, episodesOf, isMojiEpisodeUnlocked } from './mojiEpisodes';
import { MOJI_CHAPTERS } from './mojiRoute';
import { MOJI1_CAST, MOJI1_SCRIPTS } from './scripts/moji1';
import { MOJI2_CAST, MOJI2_SCRIPTS } from './scripts/moji2';
import { MOJI_FINALES } from './mojiFinale';
import { getKanjiByChar } from '../lib/kanjiDb';
import { unreadKanji } from '../lib/ruby';
import { SCENES, fxNamesOf } from '../features/picturebook/scenes';
import { computeDamage } from '../lib/battle';
import { masteryMultiplier } from '../lib/mastery';

describe('文字が 消えた 町: episodes', () => {
  it('teach each chapter’s kanji in the book’s order, a handful at a time', () => {
    for (const ch of MOJI_CHAPTERS) {
      const taught = episodesOf(ch.id).flatMap((e) => e.kanji);
      expect(taught, ch.id).toEqual(ch.kanji.slice(0, taught.length));
    }
    for (const ep of MOJI_EPISODES) {
      expect(ep.kanji.length, ep.id).toBeGreaterThanOrEqual(3);
      expect(ep.kanji.length, ep.id).toBeLessThanOrEqual(9);
      for (const k of ep.kanji) expect(getKanjiByChar(k), `${ep.id} ${k}`).toBeDefined();
    }
  });

  it('end in a fight a ★1 hand can win, but only by writing well (08 §4.2.2)', () => {
    const hit = (stars: 0 | 1 | 2 | 3) =>
      computeDamage({
        weapon: null,
        individual: null,
        defenderElement: MOJI_EPISODES[0].boss.element,
        mistakes: 0,
        mastery: masteryMultiplier(stars, true),
      }).damage;
    for (const ep of MOJI_EPISODES) {
      expect(SCENES[ep.bg], ep.id).toBeDefined();
      const writes = (stars: 0 | 1 | 2 | 3) => Math.ceil(ep.boss.hp / hit(stars));
      // About two clean writes per kanji at ★1; ★3 needs half as many.
      expect(writes(1), ep.id).toBeGreaterThanOrEqual(ep.kanji.length * 1.5);
      expect(writes(1), ep.id).toBeLessThanOrEqual(ep.kanji.length * 2.5);
      expect(writes(3), ep.id).toBeLessThanOrEqual(writes(1) / 2);
    }
  });

  it('open one after another', () => {
    const [a, b] = episodesOf('moji-1');
    expect(isMojiEpisodeUnlocked(a, [])).toBe(true);
    expect(isMojiEpisodeUnlocked(b, [])).toBe(false);
    expect(isMojiEpisodeUnlocked(b, [a.id])).toBe(true);
  });
});

describe('1章 scripts', () => {
  const scripts = Object.values(MOJI1_SCRIPTS).flatMap((s) => [s.intro, s.outro]);

  it('exist for every episode of chapter 1', () => {
    expect(Object.keys(MOJI1_SCRIPTS).sort()).toEqual(episodesOf('moji-1').map((e) => e.id).sort());
    for (const s of scripts) expect(s.lines[0].bg, s.stageId).toBeTruthy();
  });

  it('give every kanji a reading — lines, big glyphs, titles and names', () => {
    const bare: string[] = [];
    const check = (where: string, t?: string) => {
      for (const c of t ? unreadKanji(t) : []) bare.push(`${where}: ${c} in "${t}"`);
    };
    for (const s of scripts) {
      for (const l of s.lines) {
        check(s.stageId, l.text);
        check(s.stageId, l.glyph);
      }
    }
    for (const e of MOJI_EPISODES) check(e.id, e.title);
    for (const c of MOJI1_CAST) check(c.id, c.name);
    expect(bare).toEqual([]);
  });

  it('keep English behind the EN button, and use pictures', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) if (/[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: English on screen "${l.text}"`);
      if (!s.lines.some((l) => /\p{Extended_Pictographic}/u.test(l.text + (l.glyph ?? '')))) bad.push(`${s.stageId}: no pictures`);
    }
    expect(bad).toEqual([]);
  });

  it('use real scenes, effects, speakers and sprites', () => {
    const bad: string[] = [];
    const cast = new Map(MOJI1_CAST.map((c) => [c.id, c.sprites]));
    for (const s of scripts) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('2章 scripts (docs/design/12)', () => {
  const scripts = Object.values(MOJI2_SCRIPTS).flatMap((s) => [s.intro, s.encounter, s.outro]);
  const cast = new Map(MOJI2_CAST.map((c) => [c.id, c.sprites]));

  it('exist for every 2章 episode, each opening on a scene', () => {
    expect(Object.keys(MOJI2_SCRIPTS).sort()).toEqual(episodesOf('moji-2').map((e) => e.id).sort());
    for (const s of scripts) expect(s.lines[0].bg, s.stageId).toBeTruthy();
  });

  it('give every kanji a reading, keep English behind EN, and use pictures', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) {
        for (const c of [...unreadKanji(l.text), ...unreadKanji(l.glyph ?? '')]) bad.push(`${s.stageId}: ${c} in "${l.text}"`);
        if (/[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: English on screen "${l.text}"`);
      }
      if (!s.lines.some((l) => /\p{Extended_Pictographic}/u.test(l.text + (l.glyph ?? '')))) bad.push(`${s.stageId}: no pictures`);
    }
    for (const c of MOJI2_CAST) for (const k of unreadKanji(c.name)) bad.push(`${c.id}: ${k}`);
    expect(bad).toEqual([]);
  });

  it('use real scenes, effects, speakers and sprites', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('stays in 1冊目 grammar (docs/constraints.md 2026-10-04)', () => {
    // Passive, potential, ば, なら, かもしれません, 〜ていく, と-conditional, 〜たい, adjective past.
    const PAST_LEVEL = /(られ|れます|れません|えば|けば|れば|なら|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、|たいです|かったです)/;
    const bad = scripts.flatMap((s) => s.lines.filter((l) => PAST_LEVEL.test(l.text.replace(/\([^)]*\)/g, ''))).map((l) => `${s.stageId}: ${l.text}`));
    expect(bad).toEqual([]);
  });
});

describe('なかまを くれる 話 (09 §3 A)', () => {
  it('gives an individual that exists and is one the story hands out', async () => {
    const { INDIVIDUALS, Rank } = await import('./individuals');
    const { MOJI_EPISODES } = await import('./mojiEpisodes');
    for (const ep of MOJI_EPISODES.filter((e) => e.grants)) {
      const who = INDIVIDUALS.find((i) => i.id === ep.grants);
      expect(who, ep.id).toBeDefined();
      expect(who?.rank, ep.id).toBe(Rank.STORY);
    }
  });

  it('brings a なかま on 1章 4話, where the gacha opens', async () => {
    const { getMojiEpisode } = await import('./mojiEpisodes');
    expect(getMojiEpisode('moji-1-4')?.grants).toBe('ISTJ');
  });
});

describe('モジクイの 個性 (docs/design/13)', () => {
  it('gives every opponent its own nature, read, with English', () => {
    const bosses = [...MOJI_EPISODES.map((e) => [e.id, e.boss] as const), ...MOJI_FINALES.map((f) => [f.id, f.boss] as const)];
    for (const [id, b] of bosses) {
      expect(b.trait, id).toBeDefined();
      expect(unreadKanji(b.trait!.ja), id).toEqual([]);
      expect(b.trait!.en, id).toMatch(/[a-z]/);
    }
    // Each kind of Mojikui is someone different; the 大モジクイ is the same one in both chapters.
    const byImg = new Map(bosses.map(([, b]) => [b.img, b.trait!.ja]));
    expect(new Set(byImg.values()).size).toBe(byImg.size);
  });
});
