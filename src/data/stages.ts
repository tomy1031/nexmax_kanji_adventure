import { Arc, type JlptLevel } from '../types/kanji';
import { Element } from '../lib/forge/elements';

/**
 * Stage table.
 *
 * The order is "when the ground is ready", not "when it was written". Each
 * stage teaches a small set of kanji that the story is about to need — 山 and
 * 川 before the mountain is crossed, 学 and 書 before Nexmax carves letters
 * into the trunk to climb it.
 *
 * Kanji are listed by character and checked against the dataset by
 * stages.test.ts, which also proves the ten stages cover all 85 N5 characters
 * exactly once.
 */

export interface StageDef {
  id: string;
  arc: Arc;
  level: JlptLevel;
  /** Position in the arc, 1-based. */
  order: number;
  /** Title in furigana notation. */
  title: string;
  /** Setup shown on the map, furigana notation. */
  summary: string;
  /** Background id used by the novel scene and the map tile. */
  bg: string;
  /** Kanji taught here. */
  kanji: string[];
  /** The stage's opponent. */
  boss: {
    /** Name in furigana notation. */
    name: string;
    element: Element;
    hp: number;
    attack: number;
    /** Game Icons component name. */
    icon: string;
  };
  /** Gems awarded for the first clear. */
  reward: number;
  /** Individual granted on first clear, if any. */
  grants?: string;
}

/**
 * むかし編 (N5) — the picture book, and what happens after it.
 *
 * Stages 1–6 follow the six spreads that exist. Stages 7–10 continue past the
 * cliffhanger the book ends on: a small robot at the foot of a tree with no
 * branches. He climbs it with the only thing he brought from the village —
 * the characters he learned to write there.
 */
export const MUKASHI_STAGES: StageDef[] = [
  {
    id: 'mukashi-1',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 1,
    title: '田(た)んぼの 村(むら)',
    summary:
      'むかし むかし、農業(のうぎょう)が さかんな 村(むら)が ありました。\nネクマックスは、その 村(むら)で しずかに くらして います。',
    bg: 'mukashi_village',
    kanji: ['一', '二', '三', '人', '日', '大', '小', '上', '下'],
    boss: { name: '田(た)んぼの かかし', element: Element.MOKU, hp: 60, attack: 6, icon: 'GiScarecrow' },
    reward: 30,
    grants: 'ISTJ',
  },
  {
    id: 'mukashi-2',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 2,
    title: '村(むら)の やまい',
    summary:
      '村(むら)の 人(ひと)が つぎつぎ たおれます。\n「生命草(せいめいそう)さえ あれば」と 村長(そんちょう)が 言(い)いました。',
    bg: 'mukashi_village',
    kanji: ['四', '五', '六', '七', '八', '九', '十', '口', '目'],
    boss: { name: '見(み)えない やまい', element: Element.AN, hp: 80, attack: 8, icon: 'GiVirus' },
    reward: 30,
  },
  {
    id: 'mukashi-3',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 3,
    title: '山(やま)へ 行(い)く',
    summary:
      'ネクマックスは 村(むら)を 出(で)ました。\n山(やま)の むこうに、高(たか)い 高(たか)い 木(き)が あります。',
    bg: 'mukashi_mountain',
    kanji: ['山', '川', '木', '土', '水', '火', '天', '入', '出'],
    boss: { name: '川(かわ)の ぬし', element: Element.SUI, hp: 100, attack: 10, icon: 'GiSeaSerpent' },
    reward: 40,
  },
  {
    id: 'mukashi-4',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 4,
    title: 'イノシシと 大(おお)きな ハチ',
    summary:
      '道(みち)は とても けわしい。\nイノシシが つっこみ、見(み)た ことも ない ハチが さします。',
    bg: 'mukashi_wildpath',
    kanji: ['虫', '中', '体', '気', '白', '見', '来', '行'],
    boss: { name: '巨大(きょだい)バチ', element: Element.KA, hp: 130, attack: 13, icon: 'GiWaspSting' },
    reward: 40,
    grants: 'ESTP',
  },
  {
    id: 'mukashi-5',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 5,
    title: '光(ひかり)の 入(い)り口(ぐち)',
    summary:
      'ボロボロに なった とき、胸(むね)の マークが 光(ひか)ります。\n何(なに)も ない 空間(くうかん)に、入(い)り口(ぐち)が できました。',
    bg: 'mukashi_portal',
    kanji: ['月', '夕', '円', '千', '万', '百', '名', '先'],
    boss: { name: '異空間(いくうかん)の かげ', element: Element.AN, hp: 150, attack: 15, icon: 'GiShadowGrasp' },
    reward: 50,
  },
  {
    id: 'mukashi-6',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 6,
    title: 'また 歩(ある)き出(だ)す',
    summary:
      '光(ひかり)の あなから 出(で)た ネクマックスは 元気(げんき)いっぱい。\n傷(きず)も すっかり 治(なお)って います。',
    bg: 'mukashi_forest',
    kanji: ['年', '時', '分', '午', '今', '半', '毎', '間'],
    boss: { name: '森(もり)の ぬし', element: Element.MOKU, hp: 170, attack: 17, icon: 'GiTreeFace' },
    reward: 50,
    grants: 'ISFJ',
  },
  {
    id: 'mukashi-7',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 7,
    title: '登(のぼ)れない 木(き)',
    summary:
      'ついに 大木(たいぼく)の ふもとへ。\nでも、つかまる 枝(えだ)が 一(ひと)つも ありません。',
    bg: 'mukashi_greattree',
    kanji: ['右', '左', '前', '後', '北', '南', '東', '西', '外', '高'],
    boss: { name: 'つるつるの みき', element: Element.DO, hp: 190, attack: 18, icon: 'GiSeaCliff' },
    reward: 60,
  },
  {
    id: 'mukashi-8',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 8,
    title: '字(じ)を きざむ',
    summary:
      '村(むら)で おぼえた 字(じ)を、みきに きざんで みました。\nきざんだ ところが、足(あし)を かける ところに なります。',
    bg: 'mukashi_greattree',
    kanji: ['学', '校', '書', '読', '話', '語', '聞', '本', '電'],
    boss: { name: 'きざみを けす 風(かぜ)', element: Element.KOU, hp: 210, attack: 20, icon: 'GiWhirlwind' },
    reward: 60,
  },
  {
    id: 'mukashi-9',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 9,
    title: '雲(くも)の 上(うえ)',
    summary:
      '雲(くも)を ぬけると、朝(あさ)の 光(ひかり)が ありました。\n生命草(せいめいそう)は、もう すぐ 上(うえ)です。',
    bg: 'mukashi_portal',
    kanji: ['雨', '車', '国', '金', '食', '休', '長'],
    boss: { name: '空(そら)の まもりて', element: Element.KOU, hp: 240, attack: 22, icon: 'GiSpikedDragonHead' },
    reward: 80,
  },
  {
    id: 'mukashi-10',
    arc: Arc.MUKASHI,
    level: 'N5',
    order: 10,
    title: '生命草(せいめいそう)',
    summary:
      'てっぺんの 葉(は)っぱに 手(て)が とどきます。\n村(むら)へ 帰(かえ)る 道(みち)は、まだ 長(なが)い。',
    bg: 'mukashi_greattree',
    kanji: ['生', '父', '母', '友', '男', '女', '子', '何'],
    boss: { name: '生命草(せいめいそう)の ぬし', element: Element.MOKU, hp: 300, attack: 26, icon: 'GiVineFlower' },
    reward: 120,
  },
];

export const ALL_STAGES: StageDef[] = [...MUKASHI_STAGES];

const byId = new Map(ALL_STAGES.map((s) => [s.id, s]));
export const getStage = (id: string): StageDef | undefined => byId.get(id);

export const stagesOfArc = (arc: Arc): StageDef[] =>
  ALL_STAGES.filter((s) => s.arc === arc).sort((a, b) => a.order - b.order);

/** A stage opens once the previous one in its arc is cleared. */
export const isStageUnlocked = (stage: StageDef, cleared: string[]): boolean => {
  if (stage.order === 1) return true;
  const prev = stagesOfArc(stage.arc).find((s) => s.order === stage.order - 1);
  return prev ? cleared.includes(prev.id) : false;
};
