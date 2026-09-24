import { Arc } from '../types/kanji';
import { Element } from '../lib/forge/elements';
import type { StageDef } from './stages';

/**
 * 現代編 (N4) — 「夢を信じたネクマックス 〜暗黒の社会人デビュー編①〜」#1〜#5.
 *
 * The original manga, in the order it was published (docs/design/現代編の構成メモ.md §3):
 * stages 1–6 are #1 (the ceremony ends, the bus, the centre in the forest,
 * five minutes, the dining hall, the team's room), 7 is #2's first half (the
 * lake at dawn), 8 is #2's flashback (the job hunt a year before), 9 is #3
 * (hired, the speech, the bus again) and 10 is #4–#5 (the shuttle run).
 *
 * All 166 N4 characters, each taught once: 17 in stages 1–6, 16 in 7–10
 * (tested in gendai.test.ts).
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
    kanji: ['会', '社', '仕', '事', '員', '者', '私', '同', '自', '始', '新', '業', '代', '春', '公', '主', '界'],
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
    kanji: ['送', '通', '運', '発', '急', '旅', '道', '走', '近', '地', '駅', '転', '帰', '広', '海', '洋', '夜'],
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
    kanji: ['研', '究', '館', '場', '屋', '室', '野', '空', '風', '黒', '石', '田', '鳥', '花', '古', '建', '無'],
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
    kanji: ['早', '着', '服', '待', '動', '止', '立', '足', '歩', '持', '週', '曜', '昼', '朝', '終', '開', '用'],
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
    kanji: ['言', '知', '考', '心', '音', '悪', '問', '答', '意', '真', '正', '題', '理', '質', '注', '的', '別'],
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
    kanji: ['親', '兄', '弟', '姉', '妹', '族', '京', '町', '村', '楽', '住', '元', '市', '英', '歌', '魚', '牛'],
    boss: { name: 'ひとりぼっちの きもち', element: Element.AN, hp: 190, attack: 18, icon: 'GiBrokenHeart' },
    reward: 80,
  },
  {
    id: 'gendai-7',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 7,
    title: '湖(みずうみ)に むかって',
    summary:
      '朝(あさ)。湖(みずうみ)に むかって、一人(ひとり)ずつ 大(おお)きな 声(こえ)で 言(い)います。\n「何(なに)を がんばるんだ？ もっと くわしく 言(い)え！」',
    bg: 'gendai_lake',
    kanji: ['力', '強', '手', '身', '重', '集', '多', '少', '度', '青', '切', '文', '冬', '夏', '秋', '赤'],
    boss: { name: 'なかまわれ', element: Element.KA, hp: 210, attack: 19, icon: 'GiDiscussion' },
    reward: 60,
  },
  {
    id: 'gendai-8',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 8,
    title: '一年前(いちねんまえ)の ぼく',
    summary:
      '一年前(いちねんまえ)。ネクマックスは 大学(だいがく)四年生(よねんせい)でした。\n面接(めんせつ)を うけても、けっかは いつも 不採用(ふさいよう)。',
    bg: 'gendai_office',
    kanji: ['不', '試', '験', '使', '茶', '色', '写', '作', '計', '画', '教', '勉', '習', '字', '去', '漢'],
    boss: { name: 'あきらめたい 気持(きも)ち', element: Element.AN, hp: 230, attack: 20, icon: 'GiCrackedGlass' },
    reward: 60,
  },
  {
    id: 'gendai-9',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 9,
    title: '春(はる)が 来(き)た',
    summary:
      '「採用(さいよう)」。そして 入社式(にゅうしゃしき)で、新入社員(しんにゅうしゃいん)の 代表(だいひょう)として 話(はな)す ことに なりました。',
    bg: 'gendai_city',
    kanji: ['世', '台', '堂', '明', '映', '品', '料', '特', '銀', '有', '以', '店', '物', '売', '紙', '局'],
    boss: { name: 'プレッシャー', element: Element.KOU, hp: 250, attack: 21, icon: 'GiMicrophone' },
    reward: 70,
  },
  {
    id: 'gendai-10',
    arc: Arc.GENDAI,
    level: 'N4',
    order: 10,
    title: 'スポーツ大会(たいかい)',
    summary:
      '「今日(きょう)は スポーツ大会(たいかい)だ！」\n五位(ごい)に 入(はい)るまで 終(お)わらない、走(はし)る 「ゲーム」が 始(はじ)まります。',
    bg: 'gendai_ground',
    kanji: ['病', '死', '安', '飲', '飯', '肉', '味', '借', '貸', '買', '図', '院', '工', '可', '犬', '医'],
    boss: { name: 'つきない つかれ', element: Element.DO, hp: 280, attack: 22, icon: 'GiSprint' },
    reward: 100,
  },
];
