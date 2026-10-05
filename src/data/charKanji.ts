/**
 * キャラの 字 — one character for each companion (docs/design/17 §1).
 *
 * When a card is pulled its character is written stroke by stroke before the
 * companion steps out of the light, and the words around it are ones that
 * use it. Every character is one the game teaches (N5〜N3, with stroke data),
 * picked from the companion's name, nature or clothes; no two share one.
 * A ★4 or ★5 card has its character's.
 */

export interface CharKanji {
  /** The character, bare: `reading` goes with it. */
  kanji: string;
  /** How it is read on its own, in kana. */
  reading: string;
  /** Three everyday words that use it, in furigana notation. */
  words: readonly [string, string, string];
}

export const CHAR_KANJI: Readonly<Record<string, CharKanji>> = {
  // --- ネクマックスの なかま: せいかくから -----------------------------------
  ISTJ: { kanji: '正', reading: 'ただしい', words: ['正(ただ)しい', '正(しょう)直(じき)', '正(しょう)月(がつ)'] },
  ISFJ: { kanji: '守', reading: 'まもる', words: ['守(まも)る', 'お守(まも)り', '留(る)守(す)'] },
  ESTP: { kanji: '動', reading: 'うごく', words: ['動(うご)く', '動(どう)物(ぶつ)', '運(うん)動(どう)'] },
  ESTJ: { kanji: '決', reading: 'きめる', words: ['決(き)める', '決(けっ)定(てい)', '決(けっ)心(しん)'] },
  ESFJ: { kanji: '友', reading: 'とも', words: ['友(とも)だち', '友(ゆう)人(じん)', '親(しん)友(ゆう)'] },
  INTP: { kanji: '問', reading: 'もん', words: ['問(もん)題(だい)', '質(しつ)問(もん)', '学(がく)問(もん)'] },
  ENTP: { kanji: '新', reading: 'あたらしい', words: ['新(あたら)しい', '新(しん)聞(ぶん)', '新(しん)年(ねん)'] },
  INFJ: { kanji: '心', reading: 'こころ', words: ['安(あん)心(しん)', '心(しん)配(ぱい)', '中(ちゅう)心(しん)'] },
  INFP: { kanji: '夢', reading: 'ゆめ', words: ['初(はつ)夢(ゆめ)', '夢(む)中(ちゅう)', '夢(ゆめ)見(み)る'] },
  ENFP: { kanji: '旅', reading: 'たび', words: ['旅(りょ)行(こう)', '旅(りょ)館(かん)', '旅(たび)人(びと)'] },
  ISTP: { kanji: '工', reading: 'こう', words: ['工(こう)場(じょう)', '大(だい)工(く)', '工(こう)作(さく)'] },
  ISFP: { kanji: '色', reading: 'いろ', words: ['茶(ちゃ)色(いろ)', '金(きん)色(いろ)', '景(け)色(しき)'] },
  ESFP: { kanji: '楽', reading: 'たのしい', words: ['楽(たの)しい', '音(おん)楽(がく)', '楽(がっ)器(き)'] },
  INTJ: { kanji: '先', reading: 'さき', words: ['先(せん)週(しゅう)', '先(せん)月(げつ)', '行(い)き先(さき)'] },
  ENTJ: { kanji: '道', reading: 'みち', words: ['山(やま)道(みち)', '水(すい)道(どう)', '歩(ほ)道(どう)'] },
  ENFJ: { kanji: '光', reading: 'ひかり', words: ['光(ひか)る', '日(にっ)光(こう)', '月(げっ)光(こう)'] },

  // --- 町の なかま: 名前・しごとから ------------------------------------------
  rin: { kanji: '本', reading: 'ほん', words: ['日(に)本(ほん)', '本(ほん)当(とう)', '本(ほん)屋(や)'] },
  yamada: { kanji: '山', reading: 'やま', words: ['火(か)山(ざん)', '山(やま)道(みち)', '富(ふ)士(じ)山(さん)'] },
  teacher: { kanji: '学', reading: 'がく', words: ['学(がっ)校(こう)', '大(だい)学(がく)', '学(まな)ぶ'] },
  doctor: { kanji: '医', reading: 'い', words: ['医(い)者(しゃ)', '医(い)学(がく)', '歯(は)医(い)者(しゃ)'] },
  baker: { kanji: '朝', reading: 'あさ', words: ['毎(まい)朝(あさ)', '朝(ちょう)食(しょく)', '朝(あさ)ごはん'] },
  keeper: { kanji: '時', reading: 'とき', words: ['時(じ)間(かん)', '時(と)計(けい)', '何(なん)時(じ)'] },
  sora: { kanji: '空', reading: 'そら', words: ['青(あお)空(ぞら)', '空(くう)港(こう)', '空(くう)気(き)'] },
  usher: { kanji: '星', reading: 'ほし', words: ['星(ほし)空(ぞら)', '流(なが)れ星(ぼし)', '火(か)星(せい)'] },
  photographer: { kanji: '写', reading: 'しゃ', words: ['写(しゃ)真(しん)', '写(うつ)す', '写(しゃ)生(せい)'] },
  hana: { kanji: '花', reading: 'はな', words: ['花(はな)火(び)', '花(はな)見(み)', '花(はな)屋(や)'] },
};

/** The character of a card's character (its `char`). */
export const kanjiOf = (char: string): CharKanji => CHAR_KANJI[char];
