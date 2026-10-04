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
  // 2章 ミナトタウン
  sora: { start: 'マルも いっしょです！ いきましょう！', skill: 'マル、まもって！ ワン！', win: 'やったね！ 写(しゃ)真(しん)を とりましょう！' },
  usher: { start: 'ショーの はじまりです！', skill: 'スポットライト！ つぎの 字(じ)が しゅやくです！', win: 'ブラボー！ だいせいこう！' },
  photographer: { start: 'はい、こちらを 見(み)て ください。', skill: '書(か)きじゅんの 写(しゃ)真(しん)です。どうぞ。', win: 'いい 写(しゃ)真(しん)ですね。' },
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
 * Dressed-up cards (★4・★5) speak in their own costume's voice (docs/design/11
 * §4.1): the station master calls the departure, the samurai is formal, the
 * captain gives orders. The わざ line still says what the わざ does. A
 * character's first card uses the character's lines.
 */
export const CARD_LINES: Record<string, CompanionLines> = {
  // ★4
  'ISTJ-4': { start: 'しゅっぱつ しんこう！ 字(じ)の 電車(でんしゃ)、まいります。', skill: 'あんぜん だいいち！ ここで まもります。', win: 'じこく どおり、とうちゃく です。' },
  'ISFJ-4': { start: 'けんこう チェック、ばっちりです。', skill: 'てあて します。すぐ よく なりますよ。', win: 'げんきで 勝(か)てましたね。' },
  'ESTP-4': { start: 'よーい、ドン！', skill: 'ラストスパート！ つぎの 字(じ)で きめるぞ！', win: 'いちばんで ゴール！' },
  'ESTJ-4': { start: 'では、かいぎを はじめます。', skill: 'みんなを まもるのが せいとかいです！', win: 'ぎだい、ぶじ かいけつ です。' },
  'ESFJ-4': { start: 'いらっしゃいませ！ きょうも がんばろうね。', skill: 'あたたかい ココア、どうぞ。ほっと するよ。', win: 'おいわいに ケーキを やこうかな。' },
  'INTP-4': { start: 'じっけん かいし。あいてを かんさつ します。', skill: 'データでは、あいては まだ うごきません。', win: 'じっけん せいこう！ ノートに 書(か)こう。' },
  'ENTP-4': { start: 'あたらしい はつめい、ためして みよう！', skill: 'スイッチ オン！ つぎの 字(じ)が パワーアップ！', win: 'はつめい だいせいこう！' },
  'INFJ-4': { start: 'しずかに……でも、おうえん して います。', skill: '本(ほん)の ことばで、げんきを わけます。', win: 'この 勝(か)ちは、本(ほん)に のこしましょう。' },
  'INFP-4': { start: 'きょうの 字(じ)は どんな 色(いろ)かな。', skill: 'ふでを おいて、ひと いき。ゆっくりで いいよ。', win: 'すてきな 絵(え)に なったね。' },
  'ENFP-4': { start: 'たんけん しゅっぱつ！ どんな 字(じ)に あえるかな。', skill: 'このまま すすもう！ コンボを つなげて！', win: 'たから 見(み)つけた！ つぎの たんけんへ！' },
  'ISTP-4': { start: 'せいび かんりょう。いつでも いける。', skill: 'シールド そうち、オン。', win: 'ちょうし いい。ねじ 一(ひと)つ ゆるんで ない。' },
  'ISFP-4': { start: 'なつの よる、きれいな 字(じ)を 書(か)こう。', skill: 'うちわで ひと あおぎ。すずしく いこう。', win: 'はなびみたいに きれいだったね。' },
  'ESFP-4': { start: 'みんな〜！ きょうも 書(か)いて いくよ〜！', skill: 'アンコール！ つぎの 字(じ)で きめちゃって！', win: 'ステージ だいせいこう！ ありがとう〜！' },
  'rin-4': { start: 'ゆかた、にあう？ なつの 字(じ)を 書(か)こう！', skill: 'たいこの リズムで、どんどん つなげよう！', win: 'なつの 字(じ)、ぜんぶ 読(よ)めたね！' },
  'yamada-4': { start: 'はなびを 見(み)ながら、おうえん しますね。', skill: 'はい、ラムネ どうぞ。げんきが 出(で)ますよ。', win: 'たまや〜！ よく がんばりました。' },
  'teacher-4': { start: 'すみを すって、こころを しずかに。', skill: 'ふでの うごきを 見(み)て。書(か)きじゅんですよ。', win: 'りっぱな 字(じ)です。はなまる！' },
  'doctor-4': { start: 'さくらの きせつも、けんこう だいいち。', skill: 'さくらの かおりで、いたいのが きえますよ。', win: 'まんかいの 勝(か)ちですね。' },
  'baker-4': { start: 'メリー クリスマス！ ケーキの ちからで いこう！', skill: 'とくせい ケーキで、ちから いっぱい！', win: 'おいわいの ケーキを きりましょう！' },
  'keeper-4': { start: 'ほしの 時間(じかん)です。ゆっくり いきましょう。', skill: 'ほしを 見(み)て、ひと いき。あいては まだ ねて います。', win: 'ながれぼしに ねがいが とどきましたな。' },
  'sora-4': { start: 'よーい、アクション！', skill: 'マル、まもって！ カット！', win: 'カット！ さいこうの えいがです！' },
  'photographer-4': { start: 'まず、お茶(ちゃ)を 一(いっ)ぱい どうぞ。', skill: 'おちついて。書(か)きじゅんは この とおりです。', win: 'けっこうな おてまえでした。' },
  // ★5
  'ISTJ-5': { start: 'いざ、まいる。字(じ)の 道(みち)を すすみます。', skill: 'この たて、くずれず！', win: 'みごと。よく 書(か)きました。' },
  'ESTP-5': { start: '3・2・1、はっしゃ！', skill: 'ブースター ぜんかい！ つぎで きめろ！', win: 'ゴールまで いっしゅん！' },
  'ENFP-5': { start: 'わっしょい！ おまつりだ！', skill: 'みんなで つなげよう、わっしょい！', win: 'さいこうの おまつりだったね！' },
  'INTJ-5': { start: 'じけんの 字(じ)は、もう 見(み)えて います。', skill: '書(か)きじゅんの てがかりを どうぞ。', win: 'なぞは すべて とけました。' },
  'ENTJ-5': { start: 'しゅっこう！ ゴールは あの 字(じ)だ！', skill: 'かじを とる。書(か)きじゅんを 見(み)よ！', win: 'ぶじ 着(つ)いた！ よく やった！' },
  'ENFJ-5': { start: 'ネオン ぜんかいで おうえん するよ！', skill: 'ひかれ！ コンボを まもるよ！', win: 'きみが いちばん かがやいてた！' },
  'rin-5': { start: 'おまつりの 字(じ)、いっしょに 書(か)こう！', skill: 'ちょうちんの ひかりで、どんどん いこう！', win: 'こんな おまつり、はじめて！' },
  'sora-5': { start: 'しゅっこう！ マルも のって！', skill: 'みんなは わたしが まもります！ ワン！', win: 'みなとに かえりましょう！' },
  'keeper-5': { start: 'じかんよ、ゆっくり すすめ……。', skill: 'とけいを もどそう。おちついて。', win: 'ちょうど いい 時間(じかん)に、勝(か)ちましたな。' },
};

/** A card's lines: its own (★4・★5), else its character's. */
export const linesFor = (card: { id: string; char: string }): CompanionLines => CARD_LINES[card.id] ?? linesOf(card.char);
