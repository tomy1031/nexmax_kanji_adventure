import { describe, it, expect } from 'vitest';
import { MOJI_EPISODES, episodesOf, getMojiEpisode, isMojiEpisodeUnlocked } from './mojiEpisodes';
import { MOJI_CHAPTERS } from './mojiRoute';
import { MOJI1_CAST, MOJI1_SCRIPTS } from './scripts/moji1';
import { MOJI2_CAST, MOJI2_SCRIPTS } from './scripts/moji2';
import { MOJI3_CAST, MOJI3_FINALE, MOJI3_SCRIPTS } from './scripts/moji3';
import { MOJI4_CAST, MOJI4_FINALE, MOJI4_SCRIPTS } from './scripts/moji4';
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

describe('3章 scripts (docs/design/14)', () => {
  const scripts = [...Object.values(MOJI3_SCRIPTS).flatMap((s) => [s.intro, s.encounter, s.outro]), MOJI3_FINALE.intro, MOJI3_FINALE.outro];
  const cast = new Map(MOJI3_CAST.map((c) => [c.id, c.sprites]));

  it('exist for every 3章 episode, each opening on a scene', () => {
    expect(Object.keys(MOJI3_SCRIPTS).sort()).toEqual(episodesOf('moji-3').map((e) => e.id).sort());
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
    for (const c of MOJI3_CAST) for (const k of unreadKanji(c.name)) bad.push(`${c.id}: ${k}`);
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
        // 'none' clears the picture: the Mojikui that just ran away is not left standing.
        if (l.sprite && l.sprite !== 'none') {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('rains until 4話 brings back 止 and 雨, and not after', () => {
    const rainy = (id: string) => [MOJI3_SCRIPTS[id].intro, MOJI3_SCRIPTS[id].outro].some((s) => s.lines.some((l) => l.fx?.includes('rain')));
    for (const id of ['moji-3-1', 'moji-3-2', 'moji-3-3', 'moji-3-4']) expect(rainy(id), id).toBe(true);
    expect(rainy('moji-3-5')).toBe(false);
    // The effects carry over: the last one set in 4話's outro is the town after the rain.
    expect(MOJI3_SCRIPTS['moji-3-4'].outro.lines.filter((l) => l.fx).at(-1)?.fx).not.toContain('rain');
  });

  it('stays within lesson 15 (docs/constraints.md 2026-10-04)', () => {
    // 12〜15課 (〜より・〜かったです・〜たい・て形) are open here; passive, potential, ば, なら, かもしれません,
    // 〜ていく and the と-conditional are later lessons.
    const PAST_LEVEL = /(られ|れます|れません|えば|けば|れば|なら、|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、)/;
    const bad = scripts.flatMap((s) => s.lines.filter((l) => PAST_LEVEL.test(l.text.replace(/\([^)]*\)/g, ''))).map((l) => `${s.stageId}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('hides Hana’s name until 花 is written, in 3話', () => {
    expect(MOJI3_CAST.find((c) => c.id === 'hana')?.nameChars).toBe('花(はな)');
    expect(getMojiEpisode('moji-3-3')?.kanji).toContain('花');
  });
});

describe('4章 scripts (docs/design/15)', () => {
  const scripts = [...Object.values(MOJI4_SCRIPTS).flatMap((s) => [s.intro, s.encounter, s.outro]), MOJI4_FINALE.intro, MOJI4_FINALE.outro];
  const cast = new Map(MOJI4_CAST.map((c) => [c.id, c.sprites]));

  it('exist for every 4章 episode, each opening on a scene', () => {
    expect(Object.keys(MOJI4_SCRIPTS).sort()).toEqual(episodesOf('moji-4').map((e) => e.id).sort());
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
    for (const c of MOJI4_CAST) for (const k of unreadKanji(c.name)) bad.push(`${c.id}: ${k}`);
    expect(bad).toEqual([]);
  });

  it('use real scenes, effects, speakers and sprites — Sora and Hana as in 2章 and 3章', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite && l.sprite !== 'none') {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
    expect(cast.get('sora')).toBe(MOJI2_CAST.find((c) => c.id === 'sora')?.sprites);
    expect(cast.get('hana')).toBe(MOJI3_CAST.find((c) => c.id === 'hana')?.sprites);
  });

  it('stays within lesson 20 (docs/constraints.md 2026-10-04)', () => {
    // 16〜20課 (て形・ない形・辞書形・た形・ふつうの 言い方) are open here; passive, potential, ば, なら, たら,
    // the volitional (行こう), かもしれません, 〜ていく and the と-conditional are later lessons.
    // 〜なければ なりません (17課) is in; other ば-forms are not.
    const PAST_LEVEL = /(られ|れます|れません|えば|けば|(?<!なけ)れば|なら、|たら、|だら、|かもしれ|ていきます|ていく|[くすつぬむるうぐぶ]と、|(こう|ろう|よう|ぼう)[！!。])/;
    const bad = scripts.flatMap((s) => s.lines.filter((l) => PAST_LEVEL.test(l.text.replace(/\([^)]*\)/g, ''))).map((l) => `${s.stageId}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('names the town with 京 from the start, so it reads みやこ until 5話 brings 京 back', () => {
    expect(MOJI4_SCRIPTS['moji-4-1'].intro.lines.some((l) => l.text.includes('京(みやこ)タウン'))).toBe(true);
    expect(getMojiEpisode('moji-4-5')?.kanji).toContain('京');
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
