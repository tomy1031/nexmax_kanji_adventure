import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOJI_EPISODES } from './mojiEpisodes';
import { MOJI_UNLOCKED_BY } from './mojiFlow';
import { MOJI1_PRELUDE } from './scripts/moji1';
import { MOJI_CAST, MOJI_SCRIPTS } from './mojiScripts';
import { SCENES, fxNamesOf } from '../features/picturebook/scenes';
import { unreadKanji } from '../lib/ruby';
import { MASTERY_REPS } from '../lib/mastery';
import type { NovelScript } from '../types/novel';

/**
 * 1章 — the story around each fight (08 §3.8, 2026-10-02「いきなり 敵が
 * 出てくるのは ストーリー上 意味不明」). Every opponent is met in the story
 * before the fight, and seen fleeing after it; 漢字やさん is shown before it
 * opens. The intros and outros are checked in mojiEpisodes.test.ts; this
 * checks the parts added on top: the encounters, the prelude, the shop.
 */

const plain = (furigana: string) => furigana.replace(/\(([^)]*)\)/g, '');
const cast = new Map(MOJI_CAST.map((c) => [c.id, c]));
const added: NovelScript[] = [...Object.values(MOJI_SCRIPTS).map((s) => s.encounter), MOJI1_PRELUDE];

describe('1章: the opponent is met before the fight', () => {
  it('has an encounter for every episode, where the opponent itself speaks', () => {
    for (const ep of MOJI_EPISODES) {
      const enc = MOJI_SCRIPTS[ep.id]?.encounter;
      expect(enc, ep.id).toBeDefined();
      const speakers = enc.lines.flatMap((l) => (l.speaker ? [cast.get(l.speaker)] : [])).filter((c) => c != null);
      expect(speakers.some((c) => plain(c.name) === plain(ep.boss.name)), `${ep.id}: ${ep.boss.name} speaks`).toBe(true);
    }
  });

  it('shows it fleeing at the start of the closing scene', () => {
    for (const ep of MOJI_EPISODES) {
      const first = MOJI_SCRIPTS[ep.id].outro.lines[0];
      expect(`${first.text}${first.glyph ?? ''}`, ep.id).toMatch(/にげ|💨/);
    }
  });

  it('draws the opponents it names', () => {
    for (const ep of MOJI_EPISODES) if (ep.boss.img) expect(existsSync(`public/${ep.boss.img}`), ep.boss.img).toBe(true);
    for (const c of MOJI_CAST) for (const src of Object.values(c.sprites)) expect(existsSync(`public/${src}`), src).toBe(true);
  });
});

describe('1章: the added scenes follow the script rules', () => {
  it('open on a page, read every kanji, keep English behind EN, and use pictures', () => {
    const bad: string[] = [];
    for (const s of added) {
      if (!s.lines[0].bg) bad.push(`${s.stageId}: no opening scene`);
      for (const l of s.lines) {
        for (const c of [...unreadKanji(l.text), ...(l.glyph ? unreadKanji(l.glyph) : [])]) bad.push(`${s.stageId}: ${c} unread`);
        if (/[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: English on screen "${l.text}"`);
        if (/🪨|⚔/u.test(`${l.text}${l.glyph ?? ''}`)) bad.push(`${s.stageId}: rock or blade "${l.text}"`);
      }
      if (!s.lines.some((l) => /\p{Extended_Pictographic}/u.test(l.text + (l.glyph ?? '')))) bad.push(`${s.stageId}: no pictures`);
    }
    expect(bad).toEqual([]);
  });

  it('use real scenes, effects, speakers and sprites', () => {
    const bad: string[] = [];
    for (const s of added) {
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) scene = l.bg;
        if (!SCENES[scene]) bad.push(`${s.stageId}: scene ${scene}`);
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) bad.push(`${s.stageId}: fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!cast.get(who)?.sprites[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('1章: 漢字やさん is shown before it opens', () => {
  it('ends the episode that opens it with a visit, and says what it needs', () => {
    const lines = MOJI_SCRIPTS[MOJI_UNLOCKED_BY.forge].outro.lines;
    expect(lines.some((l) => l.bg === 'naniwa_kanjiyasan')).toBe(true);
    // The rule the story states is the rule the forge keeps: ten writes, ★3.
    expect(lines.some((l) => l.text.includes(`${MASTERY_REPS[2]}かい`) && l.text.includes('⭐⭐⭐'))).toBe(true);
  });
});
