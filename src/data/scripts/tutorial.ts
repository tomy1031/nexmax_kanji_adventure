import type { CastMember, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * 0話「はじめの 一歩(いっぽ)」の 脚本.
 *
 *   お話 → 「一」を 10回 書いて 石を 割る → 一(いち)の 太刀(たち)を 作る →
 *   お話 → いたずらガラスが 来る → はじめての 戦い → お話
 *
 * 2026-09-23 の 指定で、0話は「書くと 力に なる」だけでなく、
 * 「手に 入れた 字は 武器に なる」「書いて 戦う」までを 一続きで 見せる。
 * それぞれの 新しい ことは、**その 場で 1回 やって みせてから** 次へ 進む
 * （説明を 先に 並べない）。
 *
 * 大事なのは ハナが ネクマックスにではなく **学習者に**「書いて みて」と
 * 言う こと。石を 割るのも、カラスを 追いはらうのも 書いた人。
 *
 * 設計: docs/design/06_チュートリアルの理解設計.md §8
 */

export const TUTORIAL_CAST: CastMember[] = MUKASHI_CAST;

export const TUTORIAL_CHAPTER = { label: 'むかし編(へん) 0', title: 'はじめの 一歩(いっぽ)' };

export const TUTORIAL_INTRO: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      fx: ['stones'],
      text: '村(むら)の 入口(いりぐち)に、大(おお)きな 石(いし)が たくさん ありました。',
    },
    {
      speaker: 'nexmax',
      sprite: 'nexmax:think',
      text: 'うーん。おもい。どかせない。',
    },
    {
      speaker: 'hana',
      sprite: 'hana:normal',
      text: 'ネクマックス。字(じ)を 書(か)くと、力(ちから)に なるよ。',
    },
    {
      speaker: 'hana',
      text: '書(か)いた 字(じ)は、刀(かたな)の ように 石(いし)を 切(き)るの。',
    },
    {
      speaker: 'hana',
      text: '石(いし)に、「一(いち)」と 書(か)いて みて。\n10回(かい) 書(か)くと、「一(いち)」は あなたの ものに なる。',
    },
  ],
};

export const TUTORIAL_AFTER_DRILL: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      fx: ['sparkle'],
      text: '石(いし)は ぜんぶ 割(わ)れて、道(みち)が ひらきました。',
    },
    {
      speaker: 'nexmax',
      sprite: 'nexmax:smile',
      text: '書(か)けた！ 道(みち)が できた！',
    },
    {
      speaker: 'hana',
      sprite: 'hana:normal',
      text: '手(て)に 入(い)れた 字(じ)は、武器(ぶき)にも なるよ。',
    },
    {
      speaker: 'hana',
      text: '「一(いち)」で、刀(かたな)を 作(つく)って みて。',
    },
  ],
};

export const TUTORIAL_BEFORE_BATTLE: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      speaker: 'nexmax',
      sprite: 'nexmax:determined',
      text: '一(いち)の 太刀(たち)……！ かるくて、よく 切(き)れそう。',
    },
    {
      speaker: null,
      sprite: 'none',
      fx: ['crow'],
      text: 'そのとき、田(た)んぼの ほうから 黒(くろ)い かげが 来(き)ました。',
    },
    {
      speaker: 'hana',
      sprite: 'hana:normal',
      text: 'いたずらガラスだ！ お米(こめ)を ねらって いる！',
    },
    {
      speaker: 'nexmax',
      sprite: 'nexmax:determined',
      text: 'まかせて！',
    },
    {
      speaker: 'hana',
      text: '「一(いち)」を 書(か)いて。書(か)けた 字(じ)が、そのまま こうげきに なるよ。',
    },
  ],
};

export const TUTORIAL_OUTRO: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      fx: ['sparkle'],
      text: 'いたずらガラスは、空(そら)へ にげて いきました。',
    },
    {
      speaker: 'hana',
      sprite: 'hana:normal',
      text: 'そう。字(じ)が 書(か)ければ、道(みち)は ひらくの。',
    },
    {
      speaker: 'hana',
      text: '書(か)ける 字(じ)が ふえると、もっと 強(つよ)い 武器(ぶき)が 作(つく)れるよ。',
    },
    {
      speaker: 'nexmax',
      sprite: 'nexmax:determined',
      text: 'もっと 書(か)いて みる！',
    },
  ],
};

/** 0話の 敵。たおさない——追いはらう。 */
export const TUTORIAL_FOE = {
  name: 'いたずらガラス',
  hp: 24,
  attack: 5,
  icon: 'GiRaven',
  art: 'crow' as const,
};
