import type { CastMember, NovelLine, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * かな編「かなの もり」の 脚本 (08 §3.4).
 *
 * 学習者は まだ かなが 読めない。台詞は はじめから 日本語（かなだけ）で書き、
 * まだ 書いて いない かなには 画面で ローマ字が つく（lib/kanaReveal.ts）。
 * 書いた かなから ローマ字が 消える — 字が 世界に 戻る。
 *
 * `en` は 英語の 助け。ボタンを 押した ときだけ 出る（全部 英語に しない）。
 * 各話は「お話 → その話の かなを 書く → お話」。
 * kana.test.ts が「漢字を 使わない」「英語が ある」を 確かめる。
 */

export const KANA_CAST: CastMember[] = MUKASHI_CAST.filter((c) => c.id === 'nexmax');

type Line = NovelLine & { en: string };

interface KanaScript {
  intro: NovelScript;
  outro: NovelScript;
}

/** The closing scene opens on the same page as the opening one, unless it says otherwise. */
const script = (id: string, intro: Line[], outro: Line[]): [string, KanaScript] => [
  id,
  {
    intro: { stageId: id, lines: intro },
    outro: { stageId: id, lines: [{ ...outro[0], bg: outro[0].bg ?? intro[0].bg }, ...outro.slice(1)] },
  },
];

export const KANA_SCRIPTS: Record<string, KanaScript> = Object.fromEntries([
  script(
    'kana-1',
    [
      { bg: 'mukashi_meadow', text: '……ここは どこ？', en: '...Where am I?' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'こんにちは！ ぼくは ネクマックス。', en: "Hello! I'm Nexmax." },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'たいへん。モジクイが じを たべた。', en: 'Oh no. The Mojikui ate the letters.' },
      { text: 'かんばんにも、はなにも、じが ない。', en: 'No letters on the signs. None on the flowers.' },
      { speaker: 'nexmax', text: 'じを かくと、じは もどる。', en: 'If you write a letter, it comes back.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'いっしょに かこう。さいしょは「あ」。', en: "Let's write together. First, 'a'." },
    ],
    [
      { glyph: 'あ', text: 'あ い う え お。じが もどって きた！', en: 'a i u e o. The letters came back!' },
      { text: 'うえを みて。そらが あおい。', en: 'Look up. The sky is blue.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あお！ よめた？', en: 'Blue! Could you read it?' },
      { speaker: 'nexmax', text: 'かいた じには、もう ローマじが つかない。', en: 'Letters you have written no longer get romaji.' },
      { speaker: 'nexmax', text: 'さあ、もりへ いこう。', en: "Now, let's go into the forest." },
    ],
  ),
  script(
    'kana-2',
    [
      { bg: 'mukashi_forest', fx: ['morning'], text: 'もりの なかに、おおきな きが ありました。', en: 'In the forest there was a big tree.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'この きには かおが あった。でも、きえた。', en: 'This tree had a face. But it vanished.' },
      { speaker: 'nexmax', text: 'か き く け こ、さ し す せ そ。', en: 'ka ki ku ke ko, sa shi su se so.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'かいて みて。', en: 'Try writing them.' },
    ],
    [
      { text: 'きに かおが もどりました。', en: 'The tree got its face back.' },
      { text: '「ありがとう。あきに また おいで。」', en: '"Thank you. Come again in autumn."' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'きが しゃべった！', en: 'The tree talked!' },
      { speaker: 'nexmax', text: 'すこし よめる ように なったね。', en: 'You can read a little now.' },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'mukashi_village', fx: ['gloom'], text: 'むらに つきました。でも、だれも いません。', en: 'We reached a village. But nobody is here.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'いぬ？ ねこ？ なにか いる。', en: 'A dog? A cat? Something is here.' },
      { text: 'いぬと ねこの なまえが、たべられて いました。', en: "The dog's and the cat's names had been eaten." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'た ち つ て と、な に ぬ ね の。かいて、なまえを かえそう。', en: "Write ta–to and na–no, and let's give their names back." },
    ],
    [
      { fx: ['sparkle'], text: 'いぬが「わん」、ねこが「にゃあ」と なきました。', en: 'The dog went "woof", the cat went "meow".' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'なつの ひの、ちいさな むら。', en: 'A little village on a summer day.' },
      { speaker: 'nexmax', text: 'あなたの じで、むらが おきた。', en: 'Your letters woke the village up.' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'mukashi_mountain', fx: ['darkclouds'], text: 'やまの うえに、くろい くもが きました。', en: 'Black clouds came over the mountain.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'モジクイだ！ はなも、うみも、まちも よめない。', en: "It's the Mojikui! Flower, sea, town — I can't read any of them." },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'は ひ ふ へ ほ、ま み む め も。まけないで！', en: "ha–ho and ma–mo. Don't give up!" },
    ],
    [
      { fx: [], text: 'くもが にげて いきました。', en: 'The clouds ran away.' },
      { text: 'やまの むこうに、うみと まちが みえます。', en: 'Beyond the mountain you can see the sea and a town.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あの まちで、ひとが まって いる。', en: 'People are waiting in that town.' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'mukashi_greattree', fx: ['dusk'], text: 'よるに なりました。おおきな きの したで やすみます。', en: 'Night fell. We rest under a big tree.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。ゆめも みえない。', en: "There are no stars. I can't see my dreams either." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'や ゆ よ、ら り る れ ろ、わ を ん。ひらがなは これで さいご。', en: 'ya yu yo, ra–ro, wa wo n. These are the last hiragana.' },
    ],
    [
      { fx: [], text: 'よぞらに、ほしが もどりました。', en: 'The stars came back to the night sky.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ひらがなが ぜんぶ よめる！ すごい！', en: 'You can read all the hiragana! Amazing!' },
      { speaker: 'nexmax', text: '「が」は「か」に てんてん。「きゃ」は「き」と ちいさい「や」。', en: '"ga" is "ka" with two dots. "kya" is "ki" and a small "ya".' },
      { speaker: 'nexmax', text: 'あしたは、カタカナの もりへ いこう。', en: "Tomorrow, let's go to the katakana forest." },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'mukashi_forest', fx: ['morning'], text: 'あさです。もりの いりぐちに、ふしぎな かんばん。', en: 'Morning. A strange sign at the edge of the forest.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'これは カタカナ。そとの くにの ことばに つかう。', en: 'This is katakana. It is used for words from other countries.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'ア イ ウ エ オ、カ キ ク ケ コ。かたちが すこし ちがうよ。', en: 'a i u e o, ka ki ku ke ko. The shapes are a little different.' },
    ],
    [
      { text: 'かんばんに「ココア」と ありました。', en: 'The sign said "cocoa".' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ココア！ あまくて おいしい。', en: 'Cocoa! Sweet and tasty.' },
      { speaker: 'nexmax', text: 'ケーキも ある。「ー」は ながく よむ しるし。', en: 'There is cake too. "ー" means: read it long.' },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'mukashi_wildpath', text: 'みちに、まるい ものが ころがって います。', en: 'Something round is rolling along the path.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'でも、なまえが ない。これは なに？', en: 'But it has no name. What is it?' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'サ シ ス セ ソ、タ チ ツ テ ト。', en: 'sa shi su se so, ta chi tsu te to.' },
    ],
    [
      { text: 'スイカでした。なまえが もどりました。', en: 'It was a watermelon. Its name came back.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'つぎは テスト！ ……うそ。ははは。', en: 'Next is a test! ...Just kidding. Haha.' },
      { speaker: 'nexmax', text: 'ちいさい「ッ」も よめるね。「ネクマックス」の「ッ」。', en: 'You can read the small "ッ" too — the one in "Nekumakkusu".' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'mukashi_treetop', fx: ['leaf'], text: 'きの うえに、ノートが おちて いました。', en: 'A notebook was lying at the top of the tree.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ぼくの ノートだ。でも、じが ない……。', en: "It's my notebook. But the letters are gone..." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'ナ ニ ヌ ネ ノ、ハ ヒ フ ヘ ホ。', en: 'na ni nu ne no, ha hi fu he ho.' },
    ],
    [
      { text: 'ノートに、ハートの えが もどりました。', en: 'A heart drawing came back in the notebook.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ホッと した。', en: 'What a relief.' },
      { speaker: 'nexmax', text: 'ノートの さいごに、ぼくの なまえが ある。まだ よめない？', en: "My name is at the end of the notebook. Still can't read it?" },
    ],
  ),
  script(
    'kana-9',
    [
      { bg: 'mukashi_cloudsea', text: 'くもの うみの うえ。モジクイの すが みえます。', en: "Above a sea of clouds. The Mojikui's nest is in sight." },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'マ ミ ム メ モ、ヤ ユ ヨ。', en: 'ma mi mu me mo, ya yu yo.' },
      { speaker: 'nexmax', text: 'これで ぼくの なまえが よめる はず。', en: 'With these you should be able to read my name.' },
    ],
    [
      { glyph: 'ネクマックス', text: 'ノートに「ネクマックス」と ありました。', en: 'The notebook said "Nekumakkusu" — Nexmax.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくの なまえ、よめた？', en: 'Could you read my name?' },
      { speaker: 'nexmax', text: 'メモも ある。「モジクイは ラーメンが すき」。', en: 'There is a memo too: "The Mojikui likes ramen."' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'mukashi_portal', fx: ['portal'], text: 'モジクイの すに つきました。', en: "We reached the Mojikui's nest." },
      { text: 'モジクイは、ラーメンの ように じを すすって います。', en: 'The Mojikui is slurping letters like ramen.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ラ リ ル レ ロ、ワ ヲ ン。さいごの カタカナ！', en: 'ra–ro, wa wo n. The last katakana!' },
    ],
    [
      { fx: ['heal'], text: 'モジクイは、かなを ぜんぶ はきだして にげました。', en: 'The Mojikui spat out all the kana and ran away.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'やった！ ひらがなも カタカナも、ぜんぶ よめる！', en: 'We did it! You can read all the hiragana and katakana!' },
      { speaker: 'nexmax', text: 'モジクイは まちへ にげた。まちでは、かんじが きえて いる。', en: 'The Mojikui fled to the town. In the town, the kanji are disappearing.' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは、かんじを とりもどそう。', en: "Thank you. Next, let's get the kanji back." },
    ],
  ),
]);
