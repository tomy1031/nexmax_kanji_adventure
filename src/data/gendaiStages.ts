import { Arc } from '../types/kanji';
import { Element } from '../lib/forge/elements';
import type { StageDef } from './stages';

/**
 * 現代編 (N4) — 「夢を信じたネクマックス 〜暗黒の社会人デビュー編〜」#1.
 *
 * Stages 1–6 follow episode #1 of the original manga, scene by scene
 * (docs/design/現代編の構成メモ.md §3). Stages 7–10 wait until #2–#5 have been
 * read; their N4 characters are not assigned yet.
 *
 * The opponents are feelings, not people (docs/design/07 §4): the story's
 * seniors are frightening, but the game never has the learner fight a
 * person, and never shows anyone struck.
 *
 * Each stage's characters are the ones its scene needs, so the words the
 * learner writes are the words on the page: 会社・仕事・社員 at the ceremony,
 * 送る・通る・運ぶ on the road, 研究・館 at the centre.
 */
export const GENDAI_STAGES: StageDef[] = [
  {
    id: 'gendai-1',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 1,
    title: '入社式(にゅうしゃしき)の 日(ひ)',
    summary:
      '春(はる)。ネクマックスは 会社(かいしゃ)に 入(はい)りました。\n今日(きょう)から 社員(しゃいん)です。',
    bg: 'gendai_hall',
    kanji: ['会', '社', '仕', '事', '員', '者', '私', '同', '自', '始'],
    boss: { name: 'きんちょう', element: Element.MU, hp: 90, attack: 9, icon: 'GiHeartBeats' },
    reward: 40,
  },
  {
    id: 'gendai-2',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 2,
    title: '九十日(きゅうじゅうにち)の 研修(けんしゅう)へ',
    summary:
      '五十人(ごじゅうにん)の 新人(しんじん)を のせて、バスが 出(で)ました。\n行(い)き先(さき)は 富士山(ふじさん)の ふもと。',
    bg: 'gendai_bus',
    kanji: ['送', '通', '運', '発', '急', '旅', '道', '走', '近', '地'],
    boss: { name: 'ながい 道(みち)のり', element: Element.DO, hp: 110, attack: 11, icon: 'GiBus' },
    reward: 40,
  },
  {
    id: 'gendai-3',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 3,
    title: '森(もり)の 中(なか)の 研修所(けんしゅうじょ)',
    summary:
      '着(つ)いたのは、深(ふか)い 森(もり)に かこまれた 研修所(けんしゅうじょ)。\n宿(やど)の 人(ひと)たちは、なぜか 暗(くら)い 顔(かお)を して います。',
    bg: 'gendai_forest',
    kanji: ['研', '究', '館', '場', '屋', '室', '野', '空', '風', '黒'],
    boss: { name: '暗(くら)い 森(もり)の しずけさ', element: Element.MOKU, hp: 130, attack: 13, icon: 'GiFog' },
    reward: 50,
  },
  {
    id: 'gendai-4',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 4,
    title: '五分(ごふん)いない',
    summary:
      '「五分(ごふん)いないに 着(き)がえて 集(あつ)まれ！」\n時間(じかん)が ない。走(はし)る しか ない。',
    bg: 'gendai_dining',
    kanji: ['早', '着', '服', '待', '動', '止', '立', '足', '歩', '持'],
    boss: { name: 'せまる 時計(とけい)', element: Element.KOU, hp: 150, attack: 15, icon: 'GiAlarmClock' },
    reward: 50,
  },
  {
    id: 'gendai-5',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 5,
    title: '分(わ)からない まま',
    summary:
      '食堂(しょくどう)に ひびく 大(おお)きな 声(こえ)。\n何(なに)が 起(お)きて いるのか、だれにも 分(わ)かりません。',
    bg: 'gendai_dining',
    kanji: ['言', '知', '考', '心', '音', '悪', '問', '答', '意', '真'],
    boss: { name: 'こわい 声(こえ)', element: Element.AN, hp: 170, attack: 17, icon: 'GiMegaphone' },
    reward: 60,
  },
  {
    id: 'gendai-6',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 6,
    title: '自己紹介(じこしょうかい)',
    summary:
      '部屋(へや)に もどって、チームの なかまと 話(はな)します。\n「おれたちも 一緒(いっしょ)だよ」',
    bg: 'gendai_room',
    kanji: ['親', '兄', '弟', '姉', '妹', '族', '京', '町', '村', '楽'],
    boss: { name: 'ひとりぼっちの きもち', element: Element.AN, hp: 190, attack: 18, icon: 'GiBrokenHeart' },
    reward: 80,
  },
];
