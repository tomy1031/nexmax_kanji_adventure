import { SkillKind } from '../lib/companionSkill';

/**
 * なかまの ひとこと — what a companion says in a fight (docs/design/11 §3.1).
 *
 * Short, N5, in the voice of its tagline (data/individuals.ts). Said in a
 * bubble beside it at the start, when it uses its わざ, and at the win; the
 * hurt line is by わざ, so a healer offers help and a guard steadies.
 */

export interface CompanionLines {
  start: string;
  skill: string;
  win: string;
}

export const COMPANION_LINES: Record<string, CompanionLines> = {
  ISTJ: { start: 'さいごまで いっしょに 書(か)きます。', skill: 'まもります。あわてないで。', win: 'やりました。つぎも まじめに。' },
  ISFJ: { start: 'そばで 見(み)て います。', skill: 'だいじょうぶ。げんきに なって。', win: 'よく がんばりました。' },
  ESTP: { start: 'さあ、いこう！', skill: 'いまだ！ つぎの 字(じ)で ドーン！', win: 'やったね！ つぎ いこう！' },
  ESTJ: { start: 'じゅんばんに いきましょう。', skill: 'まもりを かためます！', win: 'けいかく どおりです。' },
  ESFJ: { start: 'みんなで がんばろうね。', skill: 'はい、おくすり！ げんき 出(だ)して。', win: 'おつかれさま！' },
  INTP: { start: 'あいての しくみを しらべます。', skill: 'おちついて。あいては まだ うごきません。', win: 'なるほど、こう 勝(か)つのか。' },
  ENTP: { start: 'おもしろい やり方(かた)が あるよ！', skill: 'ひらめいた！ つぎは すごいよ！', win: 'アイデア だいせいこう！' },
  INFJ: { start: 'あなたの 字(じ)、すきです。', skill: 'いたいの、とんで いけ。', win: 'できると しって いました。' },
  INFP: { start: 'すきな 字(じ)を 書(か)こう。', skill: 'ゆっくりで いいよ。しずかに……', win: 'ゆめみたい！' },
  ENFP: { start: 'わくわく するね！', skill: 'もっと もっと つなげよう！', win: 'たのしかった！ もう一回(いっかい)！' },
  ISTP: { start: 'どうぐは そろって いる。', skill: 'たてを 出(だ)す。まかせて。', win: 'なおった。……いや、勝(か)った。' },
  ISFP: { start: 'きれいな 字(じ)を 見(み)せて。', skill: 'ふう……。きれいに いこう。', win: 'きれいな 勝(か)ちかた！' },
  ESFP: { start: 'もりあがって いこう！', skill: 'ここで いっぱつ、ドーン！', win: 'さいこうの ショーだった！' },
  INTJ: { start: 'つぎに 出(で)る 字(じ)は よそう できます。', skill: '書(か)きじゅんを 見(み)て いいですよ。', win: 'よそう どおり。' },
  ENTJ: { start: 'ゴールまで あんない します。', skill: 'みちを しめします。書(か)きじゅんを 見(み)て！', win: 'ゴール！ つぎの ゴールへ。' },
  ENFJ: { start: 'がんばれ！ がんばれ！', skill: 'フレー！ フレー！ コンボを まもるよ！', win: 'みんなの おかげだね！' },
  // 町の なかま
  rin: { start: 'いっしょに 字(じ)を 書(か)こう！', skill: 'リズムよく、どんどん いこう！', win: '本(ほん)が また 読(よ)めるね！' },
  yamada: { start: 'わたしも おうえん します。', skill: 'はい、あたたかい お茶(ちゃ)ですよ。', win: 'ありがとう、ネクマックス。' },
  teacher: { start: 'では、はじめましょう。', skill: '書(か)きじゅんを 見(み)て、ゆっくり 書(か)いて。', win: 'よく できました！ はなまるです。' },
  doctor: { start: 'けがを したら すぐ 言(い)ってね。', skill: 'だいじょうぶ、すぐ なおりますよ。', win: 'げんきが 一(いち)ばんですね。' },
  baker: { start: 'やきたての 元気(げんき)を どうぞ！', skill: 'パンを 食(た)べて、ちから いっぱい！', win: 'おいわいの パンを やきましょう！' },
  keeper: { start: 'あわてない、あわてない。', skill: '時間(じかん)は まだ あります。おちついて。', win: 'ちょうど いい 時間(じかん)ですな。' },
};

/** When Nexmax is struck: by わざ, so the line points at what it can do. */
export const HURT_LINE: Record<SkillKind, string> = {
  heal: 'いたい？ わざで なおすよ！',
  guard: 'つぎは まもるよ！',
  calm: 'おちついて。ゆっくり 書(か)こう。',
  hint: '書(か)きじゅんを 見(み)ても いいよ。',
  power: 'まけない！ かえして いこう！',
  combo: 'だいじょうぶ、また つなげよう！',
};

/** A line for any companion without its own (a town companion before it gets one). */
export const DEFAULT_LINES: CompanionLines = { start: 'いっしょに がんばろう！', skill: 'いくよ！', win: 'やったね！' };

export const linesOf = (id: string): CompanionLines => COMPANION_LINES[id] ?? DEFAULT_LINES;

/**
 * ★5 cards speak in their own costume's voice (docs/design/11 §4.1): the
 * samurai is formal, the captain gives orders. Other cards use their
 * character's lines.
 */
export const CARD_LINES: Record<string, CompanionLines> = {
  'ISTJ-5': { start: 'いざ、まいる。字(じ)の 道(みち)を すすみます。', skill: 'この たて、くずれず！', win: 'みごと。よく 書(か)きました。' },
  'ESTP-5': { start: '3・2・1、はっしゃ！', skill: 'ブースター ぜんかい！ つぎで きめろ！', win: 'ゴールまで いっしゅん！' },
  'ENFP-5': { start: 'わっしょい！ おまつりだ！', skill: 'みんなで つなげよう、わっしょい！', win: 'さいこうの おまつりだったね！' },
  'INTJ-5': { start: 'じけんの 字(じ)は、もう 見(み)えて います。', skill: '書(か)きじゅんの てがかりを どうぞ。', win: 'なぞは すべて とけました。' },
  'ENTJ-5': { start: 'しゅっこう！ ゴールは あの 字(じ)だ！', skill: 'かじを とる。書(か)きじゅんを 見(み)よ！', win: 'ぶじ 着(つ)いた！ よく やった！' },
  'ENFJ-5': { start: 'ネオン ぜんかいで おうえん するよ！', skill: 'ひかれ！ コンボを まもるよ！', win: 'きみが いちばん かがやいてた！' },
  'rin-5': { start: 'おまつりの 字(じ)、いっしょに 書(か)こう！', skill: 'ちょうちんの ひかりで、どんどん いこう！', win: 'こんな おまつり、はじめて！' },
  'keeper-5': { start: 'じかんよ、ゆっくり すすめ……。', skill: 'とけいを もどそう。おちついて。', win: 'ちょうど いい 時間(じかん)に、勝(か)ちましたな。' },
};

/** A card's lines: its own (★5), else its character's. */
export const linesFor = (card: { id: string; char: string }): CompanionLines => CARD_LINES[card.id] ?? linesOf(card.char);
