/**
 * キャラの 字 — each companion's own character (docs/design/17 §1), and since
 * docs/design/18 §1 their name too: the card name is its reading (正 タダシ,
 * 朝日 アサヒ). One or two characters, each one the game teaches (N5〜N3, with
 * stroke data); no two companions share one.
 *
 * When a card is pulled the character is written stroke by stroke before the
 * companion steps out of the light, and the words around it use it. A ★4 or
 * ★5 card has its character's.
 */

export interface CharKanji {
  /** One or two characters, bare: `reading` goes with them. */
  kanji: string;
  /** How they are read as the companion's name, in hiragana. */
  reading: string;
  /** Three everyday words that use them (one of them at least), in furigana notation. */
  words: readonly [string, string, string];
}

export const CHAR_KANJI: Readonly<Record<string, CharKanji>> = {
  // --- ネクマックスの なかま: せいかくから。名前は 字の 読み ----------------------
  ISTJ: { kanji: '正', reading: 'ただし', words: ['正(ただ)しい', '正(しょう)月(がつ)', '正(しょう)午(ご)'] },
  ISFJ: { kanji: '守', reading: 'まもる', words: ['守(まも)る', 'お守(まも)り', '留(る)守(す)'] },
  ESTP: { kanji: '進', reading: 'すすむ', words: ['進(すす)む', '前(ぜん)進(しん)', '進(しん)学(がく)'] },
  ESTJ: { kanji: '要', reading: 'かなめ', words: ['重(じゅう)要(よう)', '必(ひつ)要(よう)', '要(い)る'] },
  ESFJ: { kanji: '友', reading: 'ゆう', words: ['友(とも)だち', '友(ゆう)人(じん)', '親(しん)友(ゆう)'] },
  INTP: { kanji: '考', reading: 'こう', words: ['考(かんが)える', '考(かんが)え', '参(さん)考(こう)'] },
  ENTP: { kanji: '新', reading: 'あらた', words: ['新(あたら)しい', '新(しん)聞(ぶん)', '新(しん)年(ねん)'] },
  INFJ: { kanji: '心', reading: 'こころ', words: ['安(あん)心(しん)', '心(しん)配(ぱい)', '中(ちゅう)心(しん)'] },
  INFP: { kanji: '夢', reading: 'ゆめ', words: ['夢(ゆめ)', '夢(ゆめ)を 見(み)る', '夢(む)中(ちゅう)'] },
  ENFP: { kanji: '旅', reading: 'たび', words: ['旅(りょ)行(こう)', '旅(りょ)館(かん)', '旅(たび)人(びと)'] },
  ISTP: { kanji: '工', reading: 'たくみ', words: ['工(こう)場(じょう)', '大(だい)工(く)', '工(こう)作(さく)'] },
  ISFP: { kanji: '色葉', reading: 'いろは', words: ['言(こと)葉(ば)', '景(け)色(しき)', '金(きん)色(いろ)'] },
  ESFP: { kanji: '歌', reading: 'うた', words: ['歌(うた)う', '歌(か)手(しゅ)', '校(こう)歌(か)'] },
  INTJ: { kanji: '先', reading: 'さき', words: ['先(せん)週(しゅう)', '先(せん)月(げつ)', '行(い)き先(さき)'] },
  ENTJ: { kanji: '道', reading: 'みち', words: ['山(やま)道(みち)', '水(すい)道(どう)', '歩(ほ)道(どう)'] },
  ENFJ: { kanji: '光', reading: 'ひかり', words: ['光(ひか)る', '光(ひかり)', '日(にっ)光(こう)'] },

  // --- 町の なかま: 名前・しごとから（リンは 外国から 来た 子で 名前は その まま）------
  rin: { kanji: '本', reading: 'ほん', words: ['日(に)本(ほん)', '本(ほん)当(とう)', '本(ほん)屋(や)'] },
  yamada: { kanji: '山田', reading: 'やまだ', words: ['火(か)山(ざん)', '山(やま)道(みち)', '田(た)んぼ'] },
  teacher: { kanji: '学美', reading: 'まなみ', words: ['学(がっ)校(こう)', '大(だい)学(がく)', '美(うつく)しい'] },
  doctor: { kanji: '治', reading: 'なお', words: ['治(なお)る', '治(なお)す', '政(せい)治(じ)'] },
  baker: { kanji: '朝日', reading: 'あさひ', words: ['毎(まい)朝(あさ)', '朝(あさ)ごはん', '毎(まい)日(にち)'] },
  keeper: { kanji: '時', reading: 'とき', words: ['時(じ)間(かん)', '時(と)計(けい)', '何(なん)時(じ)'] },
  sora: { kanji: '空', reading: 'そら', words: ['青(あお)空(ぞら)', '空(くう)港(こう)', '空(くう)気(き)'] },
  usher: { kanji: '星良', reading: 'せいら', words: ['星(ほし)空(ぞら)', '流(なが)れ星(ぼし)', '火(か)星(せい)'] },
  photographer: { kanji: '真', reading: 'まこと', words: ['写(しゃ)真(しん)', '真(ま)ん中(なか)', '真(ま)っ白(しろ)'] },
  hana: { kanji: '花', reading: 'はな', words: ['花(はな)火(び)', '花(はな)見(み)', '花(はな)屋(や)'] },
};

/** The character of a card's character (its `char`). */
export const kanjiOf = (char: string): CharKanji => CHAR_KANJI[char];
