import { describe, it, expect } from 'vitest';
import { MUKASHI_SCRIPTS, MUKASHI_CAST } from './mukashi';
import { MUKASHI_STAGES } from '../stages';
import { unreadKanji, stripRuby } from '../../lib/ruby';

const castIds = new Set(MUKASHI_CAST.map((c) => c.id));

describe('script coverage', () => {
  it('has a script for every stage in the arc', () => {
    const scripted = new Set(MUKASHI_SCRIPTS.map((s) => s.stageId));
    const missing = MUKASHI_STAGES.map((s) => s.id).filter((id) => !scripted.has(id));
    expect(missing).toEqual([]);
  });

  it('has no script for a stage that does not exist', () => {
    const stageIds = new Set(MUKASHI_STAGES.map((s) => s.id));
    const orphans = MUKASHI_SCRIPTS.map((s) => s.stageId).filter((id) => !stageIds.has(id));
    expect(orphans).toEqual([]);
  });
});

describe('furigana', () => {
  it('leaves no kanji without a reading', () => {
    // A learner one year into Japanese cannot read a bare kanji. Every one
    // that reaches the screen must carry its reading, with no exceptions —
    // this is the check that keeps that true as the script is edited.
    const bare: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        for (const c of unreadKanji(line.text)) bare.push(`${script.stageId}: ${c} in "${line.text}"`);
        for (const choice of line.choices ?? []) {
          for (const c of unreadKanji(choice.label)) {
            bare.push(`${script.stageId} choice: ${c} in "${choice.label}"`);
          }
        }
      }
    }
    expect(bare).toEqual([]);
  });

  it('leaves no kanji without a reading in the stage titles and summaries', () => {
    const bare: string[] = [];
    for (const stage of MUKASHI_STAGES) {
      for (const c of unreadKanji(stage.title)) bare.push(`${stage.id} title: ${c}`);
      for (const c of unreadKanji(stage.summary)) bare.push(`${stage.id} summary: ${c}`);
      for (const c of unreadKanji(stage.boss.name)) bare.push(`${stage.id} boss: ${c}`);
    }
    expect(bare).toEqual([]);
  });
});

describe('branching', () => {
  it('resolves every choice to a label that exists in the same script', () => {
    const broken: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      const labels = new Set(script.lines.map((l) => l.label).filter(Boolean));
      for (const line of script.lines) {
        for (const choice of line.choices ?? []) {
          if (!labels.has(choice.next)) broken.push(`${script.stageId}: choice -> ${choice.next}`);
        }
        if (line.goto && !labels.has(line.goto)) broken.push(`${script.stageId}: goto -> ${line.goto}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('gives every branch a way back to the main line', () => {
    // A branch that runs off the end of the script silently truncates the
    // scene, which is invisible in review and obvious to a player.
    const dangling: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        if (!line.choices) continue;
        // Each branch must either rejoin via goto or fall through to a shared
        // label further down.
        const targets = line.choices.map((c) => c.next);
        const indices = targets.map((t) => script.lines.findIndex((l) => l.label === t));
        if (indices.some((i) => i === -1)) dangling.push(`${script.stageId}: unresolved branch`);
      }
    }
    expect(dangling).toEqual([]);
  });
});

describe('cast and art', () => {
  it('only names speakers that are in the cast', () => {
    const unknown: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        if (line.speaker && !castIds.has(line.speaker)) {
          unknown.push(`${script.stageId}: ${line.speaker}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it('only references sprites the cast actually has', () => {
    const unknown: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        if (!line.sprite || line.sprite === 'none') continue;
        const [id, expression] = line.sprite.split(':');
        const member = MUKASHI_CAST.find((c) => c.id === id);
        if (!member) unknown.push(`${script.stageId}: unknown character ${id}`);
        else if (expression && !(expression in member.sprites)) {
          unknown.push(`${script.stageId}: ${id} has no sprite "${expression}"`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it('only uses backgrounds the stage table declares', () => {
    const known = new Set(MUKASHI_STAGES.map((s) => s.bg));
    const unknown: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        if (line.bg && !known.has(line.bg)) unknown.push(`${script.stageId}: ${line.bg}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('opens every scene with a background', () => {
    for (const script of MUKASHI_SCRIPTS) {
      expect(script.lines[0].bg, `${script.stageId} first line`).toBeTruthy();
    }
  });
});

describe('readability', () => {
  it('keeps lines short enough to fit the dialogue box', () => {
    // Roughly three lines at phone width once furigana is on. Longer than
    // this and the box scrolls, which breaks the reading rhythm.
    const tooLong: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        const len = stripRuby(line.text).length;
        if (len > 90) tooLong.push(`${script.stageId}: ${len} chars — "${stripRuby(line.text).slice(0, 30)}…"`);
      }
    }
    expect(tooLong).toEqual([]);
  });

  it('keeps choice labels short enough to read at a glance', () => {
    const tooLong: string[] = [];
    for (const script of MUKASHI_SCRIPTS) {
      for (const line of script.lines) {
        for (const choice of line.choices ?? []) {
          const len = stripRuby(choice.label).length;
          if (len > 34) tooLong.push(`${script.stageId}: ${len} — ${stripRuby(choice.label)}`);
        }
      }
    }
    expect(tooLong).toEqual([]);
  });
});
