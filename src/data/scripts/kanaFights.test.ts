import { describe, expect, it } from 'vitest';
import { KANA_EPISODES } from '../kana';
import { KANA_BOSSES } from '../kanaBattle';
import { KANA_BOSS_SCRIPTS, KANA_ENCOUNTERS } from './kanaFights';
import { kanaBossCast, kanaCast } from './kana';
import { NANIWA_NEXMAX_STAR1, NANIWA_NEXMAX_STAR2 } from './naniwaCast';
import { SCENES } from '../../features/picturebook/scenes';

/** 0章の たたかいの お話 keep 0章's rules (kana.test.ts): kana and pictures from Nexmax, English thoughts with kana Japanese. */
describe('0章の たたかいの お話 (kanaFights)', () => {
  const scripts = [
    ...Object.values(KANA_ENCOUNTERS),
    ...Object.values(KANA_BOSS_SCRIPTS).flatMap((s) => [s.intro, s.outro]),
  ];

  it('has a meeting for every episode and a story for every boss', () => {
    expect(Object.keys(KANA_ENCOUNTERS).sort()).toEqual(KANA_EPISODES.map((e) => e.id).sort());
    expect(Object.keys(KANA_BOSS_SCRIPTS).sort()).toEqual(KANA_BOSSES.map((b) => b.id).sort());
  });

  it('lets Nexmax speak only kana and pictures, and tells the rest in English with kana Japanese', () => {
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) {
        if (/[一-龯]/.test(l.text)) bad.push(`${s.stageId}: kanji in "${l.text}"`);
        if (l.speaker === 'nexmax' && /[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: English from Nexmax "${l.text}"`);
        if (!l.speaker) {
          if (!/[A-Za-z]/.test(l.text)) bad.push(`${s.stageId}: narration not in English "${l.text}"`);
          if (!l.ja || /[一-龯A-Za-z]/.test(l.ja)) bad.push(`${s.stageId}: no kana Japanese for "${l.text}"`);
        }
      }
    }
    for (const line of Object.values(KANA_BOSS_SCRIPTS).flatMap((s) => s.evolve ?? [])) {
      if (/[一-龯A-Za-z]/.test(line.text)) bad.push(`evolve: not kana "${line.text}"`);
    }
    expect(bad).toEqual([]);
  });

  it('uses real scenes and speakers the cast knows', () => {
    const sprites = new Map([...kanaCast('hiragana'), ...kanaCast('katakana')].map((c) => [c.id, c.sprites]));
    const bad: string[] = [];
    for (const s of scripts) {
      for (const l of s.lines) {
        if (l.bg && !SCENES[l.bg]) bad.push(`${s.stageId}: scene ${l.bg}`);
        if (l.speaker && !sprites.has(l.speaker)) bad.push(`${s.stageId}: speaker ${l.speaker}`);
        if (l.sprite) {
          const [who, expr] = l.sprite.split(':');
          if (!sprites.get(who)?.[expr ?? 'normal']) bad.push(`${s.stageId}: sprite ${l.sprite}`);
        }
      }
    }
    for (const b of Object.values(KANA_BOSS_SCRIPTS)) if (!b.intro.lines[0].bg || !b.outro.lines[0].bg) bad.push('a boss story opens without a scene');
    expect(bad).toEqual([]);
  });

  it('shows Nexmax at ★2 after the hiragana boss: he grew when it fell (docs/design/22 §4.2)', () => {
    const nexmax = (script: 'hiragana' | 'katakana', part: 'intro' | 'outro') => kanaBossCast(script, part).find((c) => c.id === 'nexmax')?.sprites;
    expect(nexmax('hiragana', 'intro')).toEqual(NANIWA_NEXMAX_STAR1.sprites);
    expect(nexmax('hiragana', 'outro')).toEqual(NANIWA_NEXMAX_STAR2.sprites);
    expect(nexmax('katakana', 'intro')).toEqual(NANIWA_NEXMAX_STAR2.sprites);
    expect(nexmax('katakana', 'outro')).toEqual(NANIWA_NEXMAX_STAR2.sprites);
  });
});
