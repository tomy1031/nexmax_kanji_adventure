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
 *
 * 物語の すじ（08 §3.4.1）: モジクイが ネクマックスの ことばと 名前を たべて、
 * 漢字の たくさん ある 町へ 向かって いる。じは だれかが 書くと 戻るが、
 * ネクマックスは じの 形を 忘れた — だから 書くのは あなた。
 * 各話の 問題は、その 話で 書く かなで とける。ひらがなは 駅までの 道（自然）、
 * カタカナは 駅と 電車（町の ことば）。名前は 9話で 戻るまで「ロボット」。
 */

export const KANA_CAST: CastMember[] = MUKASHI_CAST.filter((c) => c.id === 'nexmax');

/** Before his name comes back (kana-9), the name plate can only say what he is. */
export const KANA_CAST_NAMELESS: CastMember[] = KANA_CAST.map((c) => ({ ...c, name: 'ロボット' }));

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
      { bg: 'mukashi_meadow', text: 'ドーン！ そらから、なにかが おちて きた。', en: 'Boom! Something fell from the sky.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……あ…… ……う……', en: '...a... ...u...' },
      { text: 'ロボットだ。でも、うまく しゃべれない ようだ。', en: "It's a robot. But it can't seem to talk properly." },
      { text: 'ロボットは じめんを ゆびさした。「かいて」と いう ように。', en: 'The robot pointed at the ground, as if to say "write".' },
      { text: 'じめんに、うすい じの あとが のこって いる。', en: 'Faint traces of letters are left on the ground.' },
    ],
    [
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あ、い、う、え、お！ こえが でた！', en: 'a, i, u, e, o! My voice is back!' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ありがとう。ぼくは…… なまえが おもいだせない。', en: "Thank you. I'm... I can't remember my name." },
      { speaker: 'nexmax', text: 'モジクイが、ぼくの ことばと なまえを たべた。', en: 'The Mojikui ate my words and my name.' },
      { speaker: 'nexmax', text: 'いまは、まちへ むかって いる。まちには、じが たくさん ある。', en: 'Now it is heading for the town. The town is full of letters.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'じは、だれかが かくと もどる。でも ぼくは、じの かたちを わすれた。', en: 'Letters come back when someone writes them. But I have forgotten their shapes.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'だから、あなたが かいて。いっしょに まちへ いこう。みちは、あの おかの うえ！', en: "So you write them. Let's go to the town together. The way is over that hill!" },
    ],
  ),
  script(
    'kana-2',
    [
      { bg: 'mukashi_forest', fx: ['morning'], text: 'おかを こえると、ふかい もり。みちが みっつに わかれて いる。', en: 'Over the hill lies a deep forest. The path splits three ways.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'モジクイは、どの みちを いった？', en: 'Which path did the Mojikui take?' },
      { text: 'おおきな きが ある。でも、きの かおが たべられて いる。', en: "There's a big tree. But its face has been eaten." },
      { speaker: 'nexmax', text: 'この きは、もりの ことを なんでも しって いる。かおが あれば、おしえて くれる。', en: 'This tree knows everything about the forest. With a face, it could tell us.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'か き く け こ、さ し す せ そ。きに かおを かえそう。', en: "ka–ko, sa–so. Let's give the tree its face back." },
    ],
    [
      { text: 'きに、かおが もどった。', en: "The tree's face came back." },
      { text: '「ありがとう。くろい かげが、えきの ほうへ いった。じを たべながら、ゆっくりと。」', en: '"Thank you. A black shadow went toward the station, slowly, eating letters as it went."' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'えき……！ でんしゃで まちへ いく きだ。', en: 'The station...! It means to take the train to the town.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'でんしゃは、あしたの あさ。まだ まにあう！', en: "The train leaves tomorrow morning. We can still make it!" },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'mukashi_village', fx: ['gloom'], text: 'えきへの みちに、ちいさな むら。でも、しずかすぎる。', en: 'On the way to the station, a small village. But it is far too quiet.' },
      { text: 'モジクイが とおった あとだ。みんなの なまえが たべられて、だれも よびあえない。', en: "The Mojikui has passed through. Everyone's names were eaten, so no one can call anyone." },
      { text: 'こどもが ないて いる。「いぬが にげたの。なまえが よべないから、かえって こない。」', en: '"My dog ran away. I can\'t call its name, so it won\'t come back."' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'いぬの はななら、モジクイの においも わかる。', en: "A dog's nose could smell the Mojikui too." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'た ち つ て と、な に ぬ ね の。なまえを かえそう。', en: "ta–to, na–no. Let's give the names back." },
    ],
    [
      { fx: ['sparkle'], text: '「なな！」 こどもが よぶと、いぬが はしって きた。', en: '"Nana!" the child called, and the dog came running.' },
      { text: 'むらの ひとも、つぎつぎに なまえを よびあって いる。', en: "The villagers are calling each other's names again, one after another." },
      { text: 'ななが、やまの ほうを むいて ほえた。「わん！」', en: 'Nana turned toward the mountain and barked. "Woof!"' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'モジクイは、やまを こえた。ななが おしえて くれた。', en: 'The Mojikui crossed the mountain. Nana told us.' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'mukashi_mountain', fx: ['darkclouds'], text: 'やまみちに、くろい くもが おりて きた。', en: 'Black clouds came down over the mountain path.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'モジクイの けむりだ。みちの しるしが、たべられて いく。', en: "It's the Mojikui's smoke. The trail markers are being eaten." },
      { text: 'まえも うしろも みえない。このままでは、まよって しまう。', en: "We can't see ahead or behind. At this rate we'll get lost." },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'は ひ ふ へ ほ、ま み む め も。しるしを かきなおそう！', en: "ha–ho, ma–mo. Let's rewrite the markers!" },
    ],
    [
      { fx: [], text: 'しるしが もどると、くもは にげて いった。', en: 'As the markers came back, the clouds fled.' },
      { text: 'やまの うえから、うみと まちが みえる。ふもとには、えきの ひかり。', en: 'From the top you can see the sea and the town. At the foot of the mountain, the lights of the station.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あの まちで、ひとが まって いる。', en: 'People are waiting in that town.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'でも、もう ひが くれる。', en: 'But the sun is already setting.' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'mukashi_greattree', fx: ['dusk'], text: 'よるに なった。えきへ おりる みちは、まっくら。', en: 'Night fell. The path down to the station is pitch dark.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。モジクイが、そらの じまで たべた。', en: 'There are no stars. The Mojikui ate even the letters of the sky.' },
      { speaker: 'nexmax', text: 'ほしが ないと、みちが わからない。', en: "Without stars, we can't find the way." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'や ゆ よ、ら り る れ ろ、わ を ん。ひらがなは、これで さいご。', en: 'ya yu yo, ra–ro, wa wo n. These are the last hiragana.' },
    ],
    [
      { fx: [], text: 'よぞらに ほしが もどり、みちを てらした。', en: 'The stars returned to the night sky and lit the path.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ひらがなが、ぜんぶ よめる！ すごい！', en: 'You can read all the hiragana! Amazing!' },
      { speaker: 'nexmax', text: '「が」は「か」に てんてん。「きゃ」は「き」と ちいさい「や」。', en: '"ga" is "ka" with two dots. "kya" is "ki" and a small "ya".' },
      { text: 'あさ はやく、えきに ついた。でも、えきの じは、ちがう かたちを して いる。', en: 'Early in the morning we reached the station. But the letters here have a different shape.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'カタカナだ。まちの ことばには、カタカナが たくさん ある。', en: "It's katakana. The town's words use a lot of katakana." },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'gendai_city', text: 'えきは、カタカナの かんばんで いっぱい。でも、どれも あなだらけ。', en: 'The station is full of katakana signs — all of them full of holes.' },
      { speaker: 'nexmax', text: 'モジクイは、まだ きて いない。でんしゃも、もう すこし あと。', en: "The Mojikui isn't here yet. The train comes a little later too." },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……あれ？ ぼくの むねの なまえも、カタカナだった きが する。', en: 'Huh? I think the name on my chest was in katakana too.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'ア イ ウ エ オ、カ キ ク ケ コ。かたちが すこし ちがうよ。', en: 'a–o, ka–ko. The shapes are a little different.' },
    ],
    [
      { text: 'ばいてんの かんばんに、「ココア」が もどった。', en: '"Cocoa" came back on the kiosk sign.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あたたかい ココア、ふたつ ください！', en: 'Two hot cocoas, please!' },
      { text: 'ロボットの むねの なまえに、「ク」が ふたつ もどった。', en: 'Two "ク" came back in the name on the robot\'s chest.' },
      { speaker: 'nexmax', text: 'あと すこしで、ぼくの なまえが わかる！', en: "Soon I'll know my name!" },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'gendai_city', text: 'きっぷを かう きかいが ある。でも、がめんの じが きえて いる。', en: 'There is a ticket machine, but the letters on its screen have vanished.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'どこを おせば いいか、わからない。', en: "I don't know where to press." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'サ シ ス セ ソ、タ チ ツ テ ト。', en: 'sa shi su se so, ta chi tsu te to.' },
    ],
    [
      { text: 'がめんに「スタート」と でた。', en: '"START" appeared on the screen.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'おして！ ……うごいた！', en: 'Press it! ...It works!' },
      { text: 'つぎの がめんには「キップ」。でも、さいごの じが まだ うすい。', en: 'The next screen says "KIPPU" (ticket). But the last letter is still faint.' },
      { speaker: 'nexmax', text: 'ちいさい「ッ」は、つまる おと。ぼくの なまえにも「ッ」が あった きが する。', en: 'A small "ッ" is a short pause. I think my name had a "ッ" in it too.' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'gendai_city', text: 'ホームに、でんしゃの おとが ちかづいて くる。', en: 'The sound of the train is coming closer to the platform.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いそいで！ キップが ないと、のれない。', en: "Hurry! We can't board without a ticket." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'ナ ニ ヌ ネ ノ、ハ ヒ フ ヘ ホ。「プ」は「フ」に まる。', en: 'na–no, ha–ho. "プ" is "フ" with a small circle.' },
    ],
    [
      { text: '「キップ」の ボタンが ひかって、キップが でて きた。', en: 'The "ticket" button lit up and a ticket came out.' },
      { text: 'その とき、くろい かげが でんしゃに すべりこんだ。', en: 'Just then, a black shadow slipped onto the train.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイだ！ のろう！', en: "It's the Mojikui! Get on!" },
    ],
  ),
  script(
    'kana-9',
    [
      { bg: 'gendai_bus', text: 'でんしゃは、まちへ はしる。モジクイは、いちばん うしろの しゃりょうに いる。', en: 'The train runs toward the town. The Mojikui is in the last car.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'なまえが ないと、ちからが でない。モジクイに かてない。', en: "Without my name I have no strength. I can't beat the Mojikui." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'マ ミ ム メ モ、ヤ ユ ヨ。これで、ぼくの なまえが よめる はず。', en: 'ma–mo, ya yu yo. With these, you should be able to read my name.' },
    ],
    [
      { glyph: 'ネクマックス', text: 'むねの なまえが、ぜんぶ もどった。', en: 'The whole name on his chest came back: "Nekumakkusu" — Nexmax.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックス！ ぼくの なまえ、よめた？', en: "I'm Nexmax! Could you read my name?" },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ありがとう。なまえが あると、ちからが でる。', en: 'Thank you. With my name, my strength is back.' },
      { text: 'いちばん うしろの ドアに、「モジクイ」の じ。', en: 'On the door of the last car: the letters "MOJIKUI".' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'mukashi_portal', fx: ['portal'], text: 'ドアを あけると、なかは くろい うず だった。', en: 'When we opened the door, inside was a black whirlpool.' },
      { text: 'モジクイが、ラーメンの ように じを すすって いる。', en: 'The Mojikui is slurping letters like ramen.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ラ リ ル レ ロ、ワ ヲ ン。さいごの カタカナ！ ぜんぶ かえして もらう！', en: "ra–ro, wa wo n. The last katakana! We'll take them all back!" },
    ],
    [
      { fx: ['heal'], text: 'モジクイは、かなを ぜんぶ はきだした。', en: 'The Mojikui spat out all the kana.' },
      { text: 'でも、まどから とびだして、まちへ にげた。', en: 'But it leapt out of the window and fled into the town.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'まちでは、かんじが きえはじめて いる……。', en: 'In the town, the kanji are starting to vanish...' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'でも だいじょうぶ。あなたは もう、ひらがなも カタカナも よめる。', en: 'But it will be all right. You can already read hiragana and katakana.' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは、かんじを とりもどそう。', en: "Thank you. Next, let's get the kanji back." },
    ],
  ),
]);
