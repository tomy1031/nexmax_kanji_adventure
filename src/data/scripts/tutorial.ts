import type { CastMember, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * 0話「はじめの一歩」の脚本。
 *
 * 4行と3行。短いのは意図。この話で入れる新概念は「書くと 力に なる」の
 * 1つだけで、合成もジェムも 名前すら 出さない。
 *
 * 大事なのは 2行目。ハナは ネクマックスにではなく **学習者に**「ためして
 * みて」と言う。石を割るのは 書いた人。
 *
 * 設計: docs/design/06_チュートリアルの理解設計.md
 */

export const TUTORIAL_CAST: CastMember[] = MUKASHI_CAST;

export const TUTORIAL_INTRO: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      text: '村(むら)の 入口(いりぐち)に、大(おお)きな 石(いし)が ありました。',
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
      text: 'この 石(いし)に、「一(いち)」と 書(か)いて みて。',
    },
  ],
};

export const TUTORIAL_OUTRO: NovelScript = {
  stageId: 'tutorial',
  lines: [
    {
      bg: 'mukashi_village',
      speaker: 'hana',
      sprite: 'hana:normal',
      text: 'そう。字(じ)が 書(か)ければ、道(みち)は ひらくの。',
    },
    {
      speaker: 'hana',
      text: '同(おな)じ 字(じ)を 10回(かい) 書(か)くと、その 字(じ)は じぶんの ものに なる。',
    },
    {
      speaker: 'nexmax',
      sprite: 'nexmax:determined',
      text: 'じぶんの もの……。もっと 書(か)いて みる！',
    },
  ],
};
