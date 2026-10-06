import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * みんなの日本語 1冊目 on the screens (2026-10-07「もう少し 文章を みんなの
 * 日本語の レベルに 準拠した 文法や 単語レベルに」): the plain volitional
 * (書こう・えらぼう, 31課) and the potential form (書ける・見られます, 27課)
 * are past 1冊目, so buttons and hints ask with 〜ましょう / 〜て ください.
 * The old routes (むかし・現代) and the dev screen are left as they are.
 */

const ROOT = 'src/features';
const SKIP = /\.test\.|\/dev\/|ArcSelect|StageSelect|BladeForge|EncounterScreen|StagePlayer|\/novel\/|\/prologue\//;
const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

/** A verb in the plain volitional, or a potential form, read with the furigana taken out. */
const PAST_LEVEL: [RegExp, string][] = [
  [/[一-龠々](?:こう|そう|とう|のう|もう|ろう|ごう|ぼう|おう|よう)(?=[！!。、」…？?\s　<'"`)]|$)/, 'volitional'],
  [/(?:しよう|いこう|かこう|よもう|えらぼう|よぼう|あそぼう|つくろう|もどそう|ふやそう|なぞろう|たたかおう|がんばろう|はじめよう|すすもう|やろう|いれよう|みよう)(?=[！!。、」…？?\s　<'"`)]|$)/, 'volitional'],
  [/(?:書ける|読める|勝てる|見られ|おぼえられ|食べられ|書けるように)/, 'potential'],
];

describe('screens speak 1冊目 Japanese', () => {
  it('asks with 〜ましょう / 〜て ください, not 〜こう, and uses no potential form', () => {
    const bad: string[] = [];
    for (const f of walk(ROOT).filter((p) => /\.tsx?$/.test(p) && !SKIP.test(p))) {
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) return;
          const plain = line.replace(/\(([ぁ-んァ-ン]*)\)/g, '');
          for (const [re, why] of PAST_LEVEL) if (re.test(plain)) bad.push(`${f}:${i + 1} ${why}: ${line.trim().slice(0, 80)}`);
        });
    }
    expect(bad).toEqual([]);
  });
});
