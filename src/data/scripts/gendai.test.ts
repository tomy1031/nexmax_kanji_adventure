import { describe, it, expect } from 'vitest';
import { GENDAI_CAST, GENDAI_SCRIPTS } from './gendai';
import { GENDAI_STAGES } from '../gendaiStages';
import { MUKASHI_STAGES } from '../stages';
import { getKanjiByChar, kanjiOfLevel } from '../../lib/kanjiDb';
import { stripRuby, unreadKanji } from '../../lib/ruby';
import { SCENES, fxNamesOf } from '../../features/picturebook/scenes';

describe('現代編', () => {
  it('has a script for every stage', () => {
    const scripted = new Set(GENDAI_SCRIPTS.map((s) => s.stageId));
    expect(GENDAI_STAGES.map((s) => s.id).filter((id) => !scripted.has(id))).toEqual([]);
  });

  it('teaches only N4 characters, none of them already taught in むかし編', () => {
    const mukashi = new Set(MUKASHI_STAGES.flatMap((s) => s.kanji));
    const wrong = GENDAI_STAGES.flatMap((s) =>
      s.kanji.filter((c) => getKanjiByChar(c)?.level !== 'N4' || mukashi.has(c)).map((c) => `${s.id}: ${c}`),
    );
    expect(wrong).toEqual([]);
  });

  it('runs 1..10 and teaches every N4 character of the original list exactly once', () => {
    expect(GENDAI_STAGES.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const taught = GENDAI_STAGES.flatMap((s) => s.kanji);
    expect(new Set(taught).size).toBe(taught.length);
    // Kanji tagged `minna` were added for 文字が 消えた 町 (08 §4.2), not for this arc.
    const uncovered = kanjiOfLevel('N4')
      .filter((k) => !k.tags.includes('minna'))
      .map((k) => k.char)
      .filter((c) => !taught.includes(c));
    expect(uncovered).toEqual([]);
  });

  it('gets harder as it goes', () => {
    const hp = GENDAI_STAGES.map((s) => s.boss.hp);
    expect(hp).toEqual([...hp].sort((a, b) => a - b));
  });

  it('uses the original team, not invented names', () => {
    const ids = GENDAI_CAST.map((c) => c.id);
    for (const id of ['sone', 'nara', 'iguchi']) expect(ids).toContain(id);
    const text = GENDAI_SCRIPTS.flatMap((s) => s.lines.map((l) => stripRuby(l.text))).join('');
    for (const name of ['ミドリ', 'キイ']) expect(text).not.toContain(name);
  });

  it('carries furigana on every kanji', () => {
    const bare: string[] = [];
    for (const s of GENDAI_SCRIPTS) {
      for (const l of s.lines) {
        for (const t of [l.text, ...(l.choices ?? []).map((c) => c.label)]) {
          for (const c of unreadKanji(t)) bare.push(`${s.stageId}: ${c} in "${t}"`);
        }
      }
    }
    for (const st of GENDAI_STAGES) {
      for (const t of [st.title, st.summary, st.boss.name]) for (const c of unreadKanji(t)) bare.push(`${st.id}: ${c}`);
    }
    expect(bare).toEqual([]);
  });

  it('only uses scenes, effects, cast and labels that exist', () => {
    const cast = new Set(GENDAI_CAST.map((c) => c.id));
    const problems: string[] = [];
    for (const s of GENDAI_SCRIPTS) {
      const labels = new Set(s.lines.map((l) => l.label).filter(Boolean));
      let scene = '';
      for (const l of s.lines) {
        if (l.bg) {
          scene = l.bg;
          if (!SCENES[scene]) problems.push(`${s.stageId}: scene ${scene}`);
        }
        for (const fx of l.fx ?? []) if (!fxNamesOf(scene).includes(fx)) problems.push(`${s.stageId}: ${scene} has no fx ${fx}`);
        if (l.speaker && !cast.has(l.speaker)) problems.push(`${s.stageId}: speaker ${l.speaker}`);
        for (const c of l.choices ?? []) if (!labels.has(c.next)) problems.push(`${s.stageId}: choice -> ${c.next}`);
        if (l.goto && !labels.has(l.goto)) problems.push(`${s.stageId}: goto -> ${l.goto}`);
      }
    }
    for (const st of GENDAI_STAGES) if (!SCENES[st.bg]) problems.push(`${st.id}: stage scene ${st.bg}`);
    expect(problems).toEqual([]);
  });

  it('shows no one being struck (2026-09-23)', () => {
    const text = GENDAI_SCRIPTS.flatMap((s) => s.lines.map((l) => stripRuby(l.text))).join('');
    for (const word of ['たたく', 'たたか', '殴', 'なぐ', '腕立て', '竹刀', '正座', 'バケツ', '樹海', '行方不明', '死']) {
      expect(text).not.toContain(word);
    }
  });
});
