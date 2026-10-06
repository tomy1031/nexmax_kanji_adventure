import { SkillKind } from '../lib/companionSkill';

/**
 * なかまの ひとこと — what a companion says in a fight (docs/design/11 §3.1).
 *
 * Short, in みんなの日本語 1冊目 grammar and words (no 〜こう, no
 * imperative, no potential form — 2026-10-07「みんなの日本語の レベルに
 * 準拠」), in the voice of its tagline (data/individuals.ts). Said in a
 * bubble beside it at the start, when it uses its わざ, and at the win; the
 * hurt line is by わざ, so a healer offers help and a guard steadies.
 */

export interface CompanionLines {
  start: string;
  skill: string;
  win: string;
}

export const COMPANION_LINES: Record<string, CompanionLines> = {
  ISTJ: { start: 'さいごまで いっしょに 書(か)きます。', skill: 'まもります。あわてないで ください。', win: 'やりました。つぎも がんばりましょう。' },
  ISFJ: { start: 'そばに います。', skill: 'だいじょうぶ。げんきに なって ください。', win: 'よく がんばりました。' },
  ESTP: { start: 'さあ、いきましょう！', skill: 'いまです！ つぎの 字(じ)で ドーン！', win: 'やったね！ つぎも いきましょう！' },
  ESTJ: { start: 'じゅんばんに 書(か)きましょう。', skill: 'みんなを まもります！', win: 'よく できました。' },
  ESFJ: { start: 'みんなで がんばりましょうね。', skill: 'はい、くすりです！ げんきを 出(だ)して ください。', win: 'おつかれさま！' },
  INTP: { start: 'あいてを よく 見(み)ます。', skill: 'ゆっくり 書(か)いて ください。あいては まだ うごきません。', win: 'なるほど。おもしろいですね。' },
  ENTP: { start: 'いい アイデアが あります！', skill: 'これです！ つぎの 字(じ)は すごいですよ！', win: 'やりました！ いい アイデアでした！' },
  INFJ: { start: 'あなたの 字(じ)が すきです。', skill: 'いたいですか？ もう だいじょうぶです。', win: 'あなたは できると おもって いました。' },
  INFP: { start: 'すきな 字(じ)を 書(か)きましょう。', skill: 'ゆっくりで いいですよ。しずかに……', win: 'うれしいです！' },
  ENFP: { start: 'わくわく しますね！', skill: 'コンボ、もっと！ がんばりましょう！', win: 'たのしかったです！ もう 一回(いっかい)！' },
  ISTP: { start: 'どうぐは あります。', skill: 'たてを 出(だ)します。だいじょうぶです。', win: 'できました。……あ、勝(か)ちました。' },
  ISFP: { start: 'きれいな 字(じ)を 見(み)せて ください。', skill: 'ふう……。ゆっくり、きれいに。', win: 'きれいな 勝(か)ちですね！' },
  ESFP: { start: 'たのしく いきましょう！', skill: 'ここで ドーン！', win: 'さいこうの ショーでした！' },
  INTJ: { start: 'つぎの 字(じ)は わかります。', skill: '書(か)きじゅんを 見(み)ても いいですよ。', win: 'はい、わかって いました。' },
  ENTJ: { start: 'ゴールまで いっしょに いきましょう。', skill: '書(か)きじゅんを 見(み)て ください！', win: 'ゴール！ つぎの ゴールへ いきましょう。' },
  ENFJ: { start: 'がんばって！ がんばって！', skill: 'フレー！ フレー！ コンボを まもります！', win: 'みんなで できましたね！' },
  // 町の なかま
  rin: { start: 'いっしょに 字(じ)を 書(か)きましょう！', skill: 'どんどん 書(か)きましょう！', win: '本(ほん)の 字(じ)が もどりましたね！' },
  yamada: { start: 'わたしも ここに います。がんばって！', skill: 'はい、あたたかい お茶(ちゃ)です。', win: 'ありがとう、ネクマックス。' },
  teacher: { start: 'では、はじめましょう。', skill: '書(か)きじゅんを 見(み)て、ゆっくり 書(か)いて ください。', win: 'よく できました！ はなまるです。' },
  doctor: { start: 'いたい ときは すぐ 言(い)って ください。', skill: 'だいじょうぶ。すぐ よく なりますよ。', win: 'げんきが いちばんですね。' },
  baker: { start: 'パンの ちからで がんばりましょう！', skill: 'パンを 食(た)べて、げんき いっぱい！', win: 'パーティーの パンを 作(つく)りましょう！' },
  keeper: { start: 'ゆっくり いきましょう。', skill: '時間(じかん)は まだ あります。ゆっくり。', win: 'ちょうど いい 時間(じかん)です。' },
  // 2章 ミナトタウン
  sora: { start: 'マルも いっしょです！ いきましょう！', skill: 'マル、おねがい！ ワン！', win: 'やったね！ 写(しゃ)真(しん)を とりましょう！' },
  usher: { start: 'ショーの はじまりです！', skill: 'つぎの 字(じ)が スターです！', win: 'ブラボー！ すばらしい ショーでした！' },
  photographer: { start: 'はい、こちらを 見(み)て ください。', skill: '書(か)きじゅんの 写(しゃ)真(しん)です。どうぞ。', win: 'いい 写(しゃ)真(しん)ですね。' },
  // 3章 マンプクタウン
  hana: { start: 'おなかが すきましたか？ いっしょに がんばりましょう！', skill: 'あたたかい ラーメンです！ どうぞ！', win: 'やったね！ ラーメンを 作(つく)りましょう！' },
};

/** When Nexmax is struck: by わざ, so the line points at what it can do. */
export const HURT_LINE: Record<SkillKind, string> = {
  heal: 'いたいですか？ わざで げんきに します！',
  guard: 'つぎは まもります！',
  calm: 'ゆっくり 書(か)きましょう。',
  hint: '書(か)きじゅんを 見(み)ても いいですよ。',
  power: 'まけません！ がんばりましょう！',
  combo: 'だいじょうぶ。もう 一回(いっかい)！',
};

/** A line for any companion without its own (a town companion before it gets one). */
export const DEFAULT_LINES: CompanionLines = { start: 'いっしょに がんばりましょう！', skill: 'いきます！', win: 'やったね！' };

export const linesOf = (id: string): CompanionLines => COMPANION_LINES[id] ?? DEFAULT_LINES;

/**
 * Dressed-up cards (★4・★5) speak in their own costume's voice (docs/design/11
 * §4.1): the station master calls the departure, the samurai is formal, the
 * captain gives orders. The わざ line still says what the わざ does. A
 * character's first card uses the character's lines.
 */
export const CARD_LINES: Record<string, CompanionLines> = {
  // ★4
  'ISTJ-4': { start: 'しゅっぱつ します！ 字(じ)の 電(でん)車(しゃ)です。', skill: 'あぶないです！ ここで まもります。', win: 'つきました！ おつかれさまでした。' },
  'ISFJ-4': { start: 'げんきですか？ チェック します。', skill: 'だいじょうぶ。すぐ よく なりますよ。', win: 'げんきに 勝(か)ちましたね。' },
  'ESTP-4': { start: 'よーい、ドン！', skill: 'さいごです！ つぎの 字(じ)で ドーン！', win: 'いちばんで ゴール！' },
  'ESTJ-4': { start: 'では、はじめましょう。じゅんばんに。', skill: 'みんなを まもるのが わたしの しごとです！', win: 'みなさん、よく できました。' },
  'ESFJ-4': { start: 'いらっしゃいませ！ きょうも がんばりましょうね。', skill: 'あたたかい ココアです。どうぞ。', win: 'ケーキを 作(つく)りましょうか。' },
  'INTP-4': { start: 'あいてを よく 見(み)ます。ふむふむ。', skill: 'あいては まだ うごきません。ゆっくり。', win: 'おもしろい！ ノートに 書(か)きます。' },
  'ENTP-4': { start: 'あたらしい きかいです！ 見(み)て ください！', skill: 'スイッチ オン！ つぎの 字(じ)が つよく なります！', win: 'きかいも 字(じ)も、すごいでしょう！' },
  'INFJ-4': { start: 'しずかに、ここで 見(み)て います。', skill: '本(ほん)の ことばで、げんきに なって ください。', win: 'きょうの ことを 本(ほん)に 書(か)きましょう。' },
  'INFP-4': { start: 'きょうの 字(じ)は なにいろですか。', skill: 'ゆっくりで いいですよ。ひと やすみ。', win: 'きれいな 絵(え)に なりましたね。' },
  'ENFP-4': { start: 'さあ、しゅっぱつ！ どんな 字(じ)に あいますか。', skill: 'この まま いきましょう！ コンボ、まもります！', win: 'たからものを みつけました！' },
  'ISTP-4': { start: 'じゅんびは できました。', skill: 'たてを 出(だ)します。', win: 'ちょうしが いいです。' },
  'ISFP-4': { start: 'なつの よるです。きれいな 字(じ)を 書(か)きましょう。', skill: 'すずしい かぜです。ゆっくり。', win: 'はなびも 字(じ)も きれいでした！' },
  'ESFP-4': { start: 'みんな〜！ きょうも 書(か)きましょう〜！', skill: 'アンコール！ つぎの 字(じ)で ドーン！', win: 'ありがとう〜！' },
  'rin-4': { start: 'ゆかたです。なつの 字(じ)を 書(か)きましょう！', skill: 'たいこの リズムで どんどん！', win: 'なつの 字(じ)、ぜんぶ もどりましたね！' },
  'yamada-4': { start: 'はなびの 日(ひ)ですね。がんばって！', skill: 'ラムネです。どうぞ。げんきが 出(で)ますよ。', win: 'たまや〜！ よく がんばりました。' },
  'teacher-4': { start: 'しずかに 書(か)きましょう。', skill: 'ふでを 見(み)て ください。書(か)きじゅんですよ。', win: 'りっぱな 字(じ)です。はなまる！' },
  'doctor-4': { start: 'さくらの きせつです。げんきが いちばん。', skill: 'さくらを 見(み)て、げんきに なって ください。', win: 'きれいな 勝(か)ちですね。' },
  'baker-4': { start: 'メリー クリスマス！ ケーキの ちからで いきましょう！', skill: 'とくべつな ケーキです。げんき いっぱい！', win: 'ケーキを 食(た)べましょう！' },
  'keeper-4': { start: 'ほしの 時間(じかん)です。ゆっくり いきましょう。', skill: 'ほしを 見(み)ましょう。あいては まだ ねて います。', win: 'ながれぼしに おねがいを しました。' },
  'sora-4': { start: 'よーい、アクション！', skill: 'マル、おねがい！ カット！', win: 'カット！ いい えいがです！' },
  'photographer-4': { start: 'お茶(ちゃ)を どうぞ。', skill: 'ゆっくり。書(か)きじゅんは これです。', win: 'いい 時間(じかん)でしたね。' },
  'usher-4': { start: 'レッドカーペットへ ようこそ！', skill: 'スターの ひかり！ つぎの 字(じ)で ドーン！', win: 'みんなが スターです！' },
  'hana-4': { start: 'りょうりの チャンピオン、きました！', skill: 'まんぷく ラーメン！ げんき いっぱい！', win: 'ごちそうさまでした！' },
  // ★5
  'ISTJ-5': { start: 'さあ、いきましょう。字(じ)の みちを すすみます。', skill: 'この たては つよいです！', win: 'よく 書(か)きました。' },
  'ESTP-5': { start: '3・2・1、はっしゃ！', skill: 'スピード アップ！ つぎで ドーン！', win: 'もう ゴール！' },
  'ENFP-5': { start: 'わっしょい！ おまつりです！', skill: 'みんなで わっしょい！', win: 'いい おまつりでしたね！' },
  'INTJ-5': { start: 'つぎの 字(じ)は もう わかって います。', skill: '書(か)きじゅんの ヒントです。どうぞ。', win: 'なぞは ぜんぶ わかりました。' },
  'ENTJ-5': { start: 'しゅっぱつ！ ゴールは あの 字(じ)です！', skill: '書(か)きじゅんを 見(み)て ください！', win: 'つきました！ よく できました！' },
  'ENFJ-5': { start: 'ネオンで、がんばって！', skill: 'ひかります！ コンボを まもります！', win: 'あなたが いちばんでした！' },
  'rin-5': { start: 'おまつりの 字(じ)を いっしょに 書(か)きましょう！', skill: 'ちょうちんの ひかりで どんどん！', win: 'こんな おまつりは はじめてです！' },
  'sora-5': { start: 'しゅっぱつ！ マルも いっしょに！', skill: 'みんなを まもります！ ワン！', win: 'みなとへ かえりましょう！' },
  'keeper-5': { start: '時間(じかん)、ゆっくり……。', skill: 'とけいを もどします。ゆっくり。', win: 'ちょうど いい 時間(じかん)に 勝(か)ちました。' },
};

/** A card's lines: its own (★4・★5), else its character's. */
export const linesFor = (card: { id: string; char: string }): CompanionLines => CARD_LINES[card.id] ?? linesOf(card.char);
