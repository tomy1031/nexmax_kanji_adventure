import type { CastMember } from '../../types/novel';
import type { EpisodeScript } from './moji1';
import type { FinaleScript } from '../mojiFinale';
import { NANIWA_NEXMAX } from './naniwaCast';

/**
 * 3章「読めない メニュー」の 脚本（docs/design/14）。
 *
 * 2章の まとめの ボスの あと、大モジクイは 海の むこうの たべものの 町 マンプクタウンへ 逃げた。雨の 町。
 * 空の 字まで 食べられて 雨が やまない。4話で 止・雨を 書くと 雨が やむ。決まりは 1章・2章と 同じ:
 *  - 絵が 主役。意味は 絵文字と 大きな 字（glyph）で 見せる。英語は EN ボタンだけ（`en`）。
 *  - 漢字は 1字ずつ ふりがな記法。まだ 書いて いない 漢字は 音（かな）で 出る（KanjiBackText）。
 *  - 文型は 15課まで。1話に 1課: 数え方（11）・どちらが／いちばん／形容詞の 過去（12）・〜たい（13）・
 *    〜て ください／〜て います／〜ましょうか（14）・〜ても いいですか／〜ては いけません（15）。
 *    受け身・可能形・ば・なら・と（条件）・かもしれません・〜ていく は 使わない（docs/constraints.md）。
 *  - 話ごとに: intro（困る・影の 伏線）→ 書く → encounter → たたかい → outro（どこへ 逃げたか・次へ 行く 理由）。
 * 3章の ともだち ハナは 2話で 会い、名前の 札も 食べられて いる。3話で「花」を 書くと 名前が 出る。
 */

const folk = (name: string) => `img/chara/naniwa/folk_${name}.webp`;
const enemy = (id: string, name: string): CastMember => ({ id, name, color: '#5a2d8c', sprites: { normal: `img/battle/${id}.webp` } });
const townsperson = (id: string, name: string, color: string): CastMember => ({
  id,
  name,
  color,
  sprites: { normal: folk(`${id}_trouble`), trouble: folk(`${id}_trouble`), happy: folk(`${id}_happy`) },
});

export const MOJI3_CAST: CastMember[] = [
  NANIWA_NEXMAX,
  enemy('mojikui_post', 'ポストの モジクイ'),
  enemy('mojikui_pot', 'なべの モジクイ'),
  enemy('mojikui_queue', 'わりこみの モジクイ'),
  enemy('mojikui_umbrella', 'かさの モジクイ'),
  enemy('mojikui_chef', 'コックの モジクイ'),
  { id: 'mojikui_boss', name: '大(おお)モジクイ', color: '#3b1a66', sprites: { normal: 'img/battle/mojikui_boss.webp' } },
  {
    // ハナ: 3章の ともだち（docs/design/14 §2）。名前の 札も 食べられた: 花を 書くまで ？？？（3話）。
    id: 'hana',
    name: '花(はな)',
    nameChars: '花(はな)',
    color: '#e8649a',
    sprites: { normal: folk('hana_normal'), trouble: folk('hana_trouble'), happy: folk('hana_happy'), cook: folk('hana_cook') },
  },
  townsperson('clerk', 'ゆうびんきょくの ひと', '#2f7a4f'),
  townsperson('chef', 'りょうりの 先(せん)生(せい)', '#c0612b'),
  townsperson('ramen', 'ラーメンやの ひと', '#3b3b6b'),
  townsperson('delivery', 'でまえの ひと', '#d0402b'),
  townsperson('grocer', 'やおやの ひと', '#7a4fa8'),
];

const WRITE = { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" } as const;
const FIGHT = { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" } as const;

export const MOJI3_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-3-1': {
    intro: {
      stageId: 'moji-3-1',
      lines: [
        { bg: 'food_post', fx: ['rain'], glyph: '⛴️ 🌧️', text: 'ふねが、うみの むこうの たべものの まちに つきました。', en: 'The ferry arrives at the city of food across the sea.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ここは マンプクタウンです。あめの まちです。', en: 'This is Manpuku Town — the town of rain.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '👾 🍜', text: '大(おお)モジクイは、この まちに います。', en: 'The Great Mojikui is somewhere in this town.' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '✉️ 👧', text: 'まず、ソラに 手(て)紙(がみ)を 送(おく)りましょう。', en: "First, let's send Sora a letter." },
        { glyph: '🏤 🪧❓', text: 'でも、ゆうびんきょくの ふだの 字(じ)が ありません。', en: 'But the post office signs have lost their letters.' },
        { speaker: 'clerk', sprite: 'clerk:trouble', text: 'この にもつは どこへ 送(おく)りますか？ 切(き)手(て)は どれですか？ わかりません……😰', en: "Where does this parcel go? Which ones are the stamps? I can't tell…" },
        { glyph: '☂️ 🪧❓', text: 'みせの まえの かさの ふだも ありません。かさを 貸(か)しますか？ 借(か)りますか？', en: 'The umbrella sign under the eaves is gone too. Lend one? Borrow one?' },
        { text: '送(おく)ります、切(き)ります、貸(か)します、借(か)ります……かんじが ありませんから、わかりません。', en: 'okurimasu, kirimasu, kashimasu, karimasu… no kanji, so nobody understands.' },
        { glyph: '📮 👀', text: '……モグモグ。ポストの 中(なか)で、手(て)紙(がみ)を 食(た)べる かげが……。', en: 'Munch, munch. Inside the postbox, a shadow is eating the letters…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-3-1',
      lines: [
        { bg: 'food_post', fx: ['rain'], glyph: '送(おく) 切(き) 貸(か) 借(か)', text: 'ゆうびんきょくの ふだが ひかります。💡', en: 'The post office signs light up.' },
        { fx: ['rain', 'darkclouds'], speaker: 'mojikui_post', sprite: 'mojikui_post:normal', text: '手(て)紙(がみ)？ どこへ 送(おく)りますか？ わすれました！ ぜんぶ 食(た)べます！ 😈', en: "Letters? Where do they go? I forgot! I'll eat them all!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ポストの モジクイです！', en: 'The postbox Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-3-1',
      lines: [
        { bg: 'food_post', fx: ['rain', 'darkclouds'], sprite: 'mojikui_post:normal', glyph: '🍲 💨', text: 'モジクイは いい においの ほうへ にげました。', en: 'The Mojikui fled toward a nice smell.' },
        { fx: ['rain', 'spring'], sprite: 'none', glyph: '送(おく) 切(き) 貸(か) 借(か)', text: 'ふだが もどりました！', en: 'The signs came back!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '✉️ 🏷️🏷️🏷️', text: '80円(えん)の 切(き)手(て)を 3まい ください。', en: 'Three 80-yen stamps, please.' },
        { speaker: 'clerk', sprite: 'clerk:happy', glyph: '💴 240', text: 'はい、240円(えん)です。手(て)紙(がみ)は ミナトタウンへ 送(おく)りますね。', en: "Sure, that's 240 yen. I'll send the letter to Minato Town." },
        { speaker: 'clerk', sprite: 'clerk:happy', glyph: '☂️ ☂️', text: 'あめですから、かさを 2本(ほん) 貸(か)します。どうぞ。', en: "It's raining, so I'll lend you two umbrellas. Here." },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '☂️ 🤖', text: 'かさを 借(か)ります。ありがとう ございます！', en: "We'll borrow them. Thank you!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🍲 👉', text: 'いい においの ほうへ 行(い)きましょう！', en: "Let's follow that nice smell!" },
      ],
    },
  },
  'moji-3-2': {
    intro: {
      stageId: 'moji-3-2',
      lines: [
        { bg: 'food_school', fx: ['rain'], glyph: '🍲 🏫', text: 'いい においの たてものは、りょうりきょうしつでした。', en: 'The building with the nice smell was a cooking school.' },
        { glyph: '📖 ⬜', text: 'レシピの 本(ほん)も、こくばんも、字(じ)が ありません。', en: 'The recipe books and the blackboard have no letters.' },
        { speaker: 'chef', sprite: 'chef:trouble', glyph: '🌏 ✈️', text: 'わたしは せかいを 旅(りょ)行(こう)しました。せかいの りょうりを 教(おし)えます。でも、レシピが ありません……😰', en: 'I travelled the world, and I teach its dishes. But the recipes are gone…' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '👧 📓', text: 'わたしは ここで りょうりを 習(なら)って います。毎(まい)日(にち) 勉(べん)強(きょう)して います。でも……😢', en: 'I learn cooking here. I study every day. But…' },
        { text: '旅(りょ)、教(おし)えます、習(なら)います、勉(べん)、強(きょう)……かんじが ありませんから、わかりません。', en: 'ryo, oshiemasu, naraimasu, ben, kyou… no kanji, so nobody understands.' },
        { glyph: '🍲 👀', text: '……ズズッ。なべの 中(なか)で、スープを 飲(の)む かげが……。', en: 'Slurp. In the pot, a shadow is drinking the soup…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-3-2',
      lines: [
        { bg: 'food_school', fx: ['rain'], glyph: '旅(りょ) 教(きょう) 習(しゅう) 勉(べん) 強(きょう)', text: 'レシピと こくばんが ひかります。💡', en: 'The recipes and the blackboard light up.' },
        { fx: ['rain', 'darkclouds'], speaker: 'mojikui_pot', sprite: 'mojikui_pot:normal', text: 'この スープは まずい！ あの レシピも まずい！ ぜんぶ いりません！ 😈', en: "This soup is awful! That recipe is awful! I don't want any of it!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'なべの モジクイです！', en: 'The pot Mojikui!' },
        { speaker: 'hana', sprite: 'hana:trouble', text: 'わたしの レシピ……！', en: 'My recipes…!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-3-2',
      lines: [
        { bg: 'food_school', fx: ['rain', 'darkclouds'], sprite: 'mojikui_pot:normal', glyph: '🍜 💨', text: 'モジクイは ラーメンの においの ほうへ にげました。', en: 'The Mojikui fled toward the smell of ramen.' },
        { fx: ['rain', 'spring'], sprite: 'none', glyph: '📖 ✨', text: 'レシピが もどりました！', en: 'The recipes came back!' },
        { speaker: 'chef', sprite: 'chef:happy', glyph: '🍛 🍜 ❓', text: 'さあ、勉(べん)強(きょう)しましょう。カレーと ラーメンと、どちらが 好(す)きですか？', en: "Now, let's study. Curry or ramen — which do you like?" },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '🍜 ❤️', text: 'わたしは ラーメンの ほうが 好(す)きです！', en: 'I like ramen better!' },
        { speaker: 'chef', sprite: 'chef:happy', glyph: '🌏 🍜 👑', text: 'せかいで いちばん おいしい りょうりは、この まちの ラーメンです！', en: "The tastiest dish in the world is this town's ramen!" },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🪪 ❓', text: 'あなたの なまえは？', en: "What's your name?" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🪪 ❓❓❓', text: 'わたしの なまえは……あれ？ わかりません！ 😢', en: "My name is… huh? I don't know!" },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '👾 🪪', text: 'モジクイが、なまえの 字(じ)も 食(た)べました。', en: 'The Mojikui ate the letters of your name too.' },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '🌸 🏠 🍜', text: 'わたしの うちは はなやです。ラーメンやの となりです。いっしょに 行(い)きましょう！', en: "My family runs the flower shop, next to the ramen shop. Let's go together!" },
      ],
    },
  },
  'moji-3-3': {
    intro: {
      stageId: 'moji-3-3',
      lines: [
        { bg: 'food_line', fx: ['rain'], glyph: '🌧️ 🍜', text: 'あめの よるの、たべものの とおりです。', en: 'The food street on a rainy night.' },
        { glyph: '🍜 🧍🧍🧍 ❓', text: 'ゆうめいな ラーメンやの まえに、人(ひと)が たくさん います。でも、れつが ばらばらです。', en: 'Lots of people outside a famous ramen shop. But the line is a mess.' },
        { speaker: 'ramen', sprite: 'ramen:trouble', text: 'こちらで 待(ま)って ください！ あれ？ ふだの 字(じ)が ありません！ 😰', en: 'Please wait over here! Huh? The sign has lost its letters!' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🌸 🪧❓', text: 'となりの はなやの ふだも ありません。わたしの うちです……。', en: "The flower shop sign next door is gone too. That's my home…" },
        { text: '花(はな)、歩(ある)きます、待(ま)ちます、立(た)ちます……かんじが ありませんから、わかりません。', en: 'hana, arukimasu, machimasu, tachimasu… no kanji, so nobody understands.' },
        { glyph: '🍜 👀', text: '……スルスル。れつの すきまに、わりこむ かげが……。', en: 'Slip, slip. A shadow is squeezing into the gaps in the line…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-3-3',
      lines: [
        { bg: 'food_line', fx: ['rain'], glyph: '花(はな) 歩(ほ) 待(ま) 立(た)', text: 'ラーメンやと はなやの ふだが ひかります。💡', en: 'The ramen shop and flower shop signs light up.' },
        { fx: ['rain', 'darkclouds'], speaker: 'mojikui_queue', sprite: 'mojikui_queue:normal', text: 'いちばんは わたしです！ ラーメンも 花(はな)も、ぜんぶ わたしの もの！ 😈', en: "I'm first! The ramen and the flowers — all mine!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'わりこみの モジクイです！', en: 'The line-cutter Mojikui!' },
        { speaker: 'ramen', sprite: 'ramen:trouble', text: 'ならんで ください！ 😤', en: 'Get in line!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-3-3',
      lines: [
        { bg: 'food_line', fx: ['rain', 'darkclouds'], sprite: 'mojikui_queue:normal', glyph: '🏬 💨', text: 'モジクイは しょうてんがいの ほうへ にげました。', en: 'The Mojikui fled toward the shopping arcade.' },
        { fx: ['rain', 'spring'], sprite: 'none', glyph: '🌸 ✨', text: 'ふだが もどりました！ はなやの ふだは「花(はな)」です。', en: 'The signs came back! The flower shop sign says "hana" — flower.' },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '🌸 🪪 ✨', text: 'あ！ わたしの なまえです！ わたしは 花(はな)です！', en: "Oh! That's my name! I'm Hana!" },
        { speaker: 'ramen', sprite: 'ramen:happy', glyph: '🧍🧍🧍 ➡️ 🍜', text: 'みなさん、こちらで 待(ま)って ください。', en: 'Everyone, please wait over here.' },
        { speaker: 'ramen', sprite: 'ramen:happy', glyph: '🍜 ❓', text: 'おきゃくさん、なにが 食(た)べたいですか？', en: 'And you two — what would you like to eat?' },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '🍜 🍜', text: 'ラーメンが 食(た)べたいです！ ふたつ ください！', en: 'We want ramen! Two, please!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏬 👉', text: 'しょうてんがいへ 歩(ある)いて 行(い)きましょう！', en: "Let's walk to the shopping arcade!" },
      ],
    },
  },
  'moji-3-4': {
    intro: {
      stageId: 'moji-3-4',
      lines: [
        { bg: 'food_arcade', fx: ['rain'], glyph: '🌧️🌧️🌧️', text: 'あめが たくさん ふって います。', en: "It's raining hard." },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🌧️ 📅', text: 'この まちは、ずっと あめです。あめが 止(や)みません。', en: "It has rained in this town for ages. The rain won't stop." },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '☁️ 👾', text: 'モジクイが、そらの 字(じ)も 食(た)べました。', en: "The Mojikui ate the sky's letters too." },
        { glyph: '🏬 🪧❓ 🪧❓', text: 'しょうてんがいの 入(いり)口(ぐち)と 出(で)口(ぐち)の ふだが ありません。', en: "The arcade's entrance and exit signs are gone." },
        { speaker: 'delivery', sprite: 'delivery:trouble', glyph: '🍜 📦', text: 'ラーメンを とどけます！ 入(いり)口(ぐち)は どこですか？ わかりません！ 💦', en: "I'm delivering ramen! Where's the entrance? I can't tell!" },
        { glyph: '🚲💨 🛑❓', text: 'みちの「止(と)まれ」も ありません。自(じ)転(てん)車(しゃ)が 止(と)まりません！', en: 'The STOP on the road is gone too. The bicycles don’t stop!' },
        { text: '止(と)まります、雨(あめ)、入(はい)ります、出(で)ます……かんじが ありませんから、わかりません。', en: 'tomarimasu, ame, hairimasu, demasu… no kanji, so nobody understands.' },
        { glyph: '☂️ 👀', text: '……クルクル。さかさまの かさが、とんで います。', en: 'Twirl, twirl. An upside-down umbrella is flying about.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-3-4',
      lines: [
        { bg: 'food_arcade', fx: ['rain'], glyph: '止(と) 雨(あめ) 入(にゅう) 出(で)', text: 'しょうてんがいの ふだが ひかります。💡', en: 'The arcade signs light up.' },
        { fx: ['rain', 'darkclouds'], speaker: 'mojikui_umbrella', sprite: 'mojikui_umbrella:normal', text: '入(はい)って ください？ いやです、出(で)ます！ 止(と)まって ください？ いやです、はしります！ 😈', en: '"Please come in"? No — I\'m going out! "Please stop"? No — I\'m running!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かさの モジクイです！ ぜんぶ はんたいです！', en: 'The umbrella Mojikui! It does everything backwards!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-3-4',
      lines: [
        { bg: 'food_arcade', fx: ['rain', 'darkclouds'], sprite: 'mojikui_umbrella:normal', glyph: '🏟️ 💨', text: 'モジクイは りょうり大(たい)会(かい)の かいじょうへ にげました。', en: 'The Mojikui fled to the cooking contest hall.' },
        { fx: ['spring'], sprite: 'none', glyph: '🌧️ ➡️ 🌈', text: '雨(あめ)が 止(や)みました！ そらに にじが 出(で)て います。', en: 'The rain has stopped! There is a rainbow in the sky.' },
        { speaker: 'delivery', sprite: 'delivery:happy', glyph: '🚲 🛑', text: 'はい、ここで 止(と)まります。入(いり)口(ぐち)から 入(はい)ります！', en: 'Right — I stop here, and I go in through the entrance!' },
        { speaker: 'delivery', sprite: 'delivery:happy', glyph: '🏟️ 📣', text: 'あしたは りょうり大(たい)会(かい)です。かいじょうは あちらです。', en: 'Tomorrow is the cooking contest. The hall is over there.' },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '👩‍🍳 🏟️', text: 'わたしも 大(たい)会(かい)に 出(で)たいです！', en: 'I want to enter the contest too!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '☂️ 🙅 👉', text: 'もう かさは いりませんね。かいじょうへ 行(い)きましょうか。', en: "We don't need the umbrellas any more. Shall we go to the hall?" },
      ],
    },
  },
  'moji-3-5': {
    intro: {
      stageId: 'moji-3-5',
      lines: [
        { bg: 'food_kitchen', glyph: '🏟️ 🍳', text: 'りょうり大(たい)会(かい)の かいじょうの うらの、だいどころと いちばです。', en: 'The kitchen and market behind the cooking contest hall.' },
        { glyph: '🥕 🐟 🪧❓', text: 'やさいや さかなの ふだに、字(じ)が ありません。', en: 'The signs on the vegetables and fish have no letters.' },
        { speaker: 'grocer', sprite: 'grocer:trouble', text: 'この だいこんは もう 売(う)り切(き)れですか？ わかりません……😰', en: "Is this daikon sold out already? I can't tell…" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '👩‍🍳 🍜 🪧❓', text: 'わたしは 大(たい)会(かい)で ラーメンを 作(つく)りたいです。でも、だいどころの きまりの ふだが ありません。', en: 'I want to make ramen at the contest. But the kitchen rules board has no letters.' },
        { text: '売(う)ります、使(つか)います、作(つく)ります……かんじが ありませんから、わかりません。', en: 'urimasu, tsukaimasu, tsukurimasu… no kanji, so nobody understands.' },
        { glyph: '🍽️ 👀', text: '……パクッ、パクッ。だいどころで、つまみぐいを する かげが……。', en: 'Nom, nom. In the kitchen, a shadow is sneaking bites…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-3-5',
      lines: [
        { bg: 'food_kitchen', glyph: '売(う) 使(つか) 作(つく)', text: 'だいどころの ふだが ひかります。💡', en: 'The kitchen signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_chef', sprite: 'mojikui_chef:normal', text: 'あじみ、あじみ……ぜんぶ おいしいです！ ぜんぶ わたしが 食(た)べます！ 😈', en: "Just a taste, just a taste… It's all delicious! I'll eat it all!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'コックの モジクイです！', en: 'The chef Mojikui!' },
        { speaker: 'hana', sprite: 'hana:trouble', text: 'それは 大(たい)会(かい)の やさいです！ 😤', en: 'Those are the contest vegetables!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-3-5',
      lines: [
        { bg: 'food_kitchen', fx: ['darkclouds'], sprite: 'mojikui_chef:normal', glyph: '🎤 💨', text: 'モジクイは 大(たい)会(かい)の ステージへ にげました。', en: 'The Mojikui fled onto the contest stage.' },
        { fx: ['spring'], sprite: 'none', glyph: '売(う) 使(つか) 作(つく) ✨', text: 'ふだが もどりました！', en: 'The signs came back!' },
        { speaker: 'grocer', sprite: 'grocer:happy', glyph: '🥕 🥬', text: 'だいこんも キャベツも 売(う)って いますよ。どうぞ！', en: "We've got daikon and cabbage for sale. Here you go!" },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '🍲 ❓', text: 'この なべを 使(つか)っても いいですか？', en: 'May I use this pot?' },
        { speaker: 'grocer', sprite: 'grocer:happy', glyph: '🍲 👍 🚫😋', text: 'はい、どうぞ。でも、ステージで つまみぐいを しては いけませんよ。', en: "Yes, go ahead. But no sneaking bites on the stage!" },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '👩‍🍳 🍜 ✨', text: 'わたしの ラーメンを 作(つく)ります！', en: "I'll make my ramen!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🎤 👾', text: '大(おお)モジクイは、ステージに います！ 行(い)きましょう！', en: "The Great Mojikui is on the stage! Let's go!" },
      ],
    },
  },
};

/**
 * 3章 6話 まとめの ボス（docs/design/14 §3）: 料理大会の 会場で 大モジクイ。勝つと メニューが 戻り、
 * ハナが みんなに ラーメンを 作る。大モジクイは 電車で となりの 大きい 町へ 逃げる → つづく（4章「町を 回る」）。
 */
export const MOJI3_FINALE: FinaleScript = {
  intro: {
    stageId: 'moji-3-boss',
    lines: [
      { bg: 'food_contest', glyph: '🏟️ 🎤', text: 'りょうり大(たい)会(かい)の かいじょうです。', en: 'The cooking contest hall.' },
      { glyph: '📋 📖 🪧', text: 'メニュー、レシピ、ふだ……ぜんぶ ここに あります！', en: 'Menus, recipes, signs — they are all here!' },
      { fx: ['darkclouds'], speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: 'また きましたね。この まちの メニューも、わたしの ものです！ 😈', en: "You came again. This town's menus are mine too!" },
      { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👀 ✍️ ❓', text: 'あなたは 字(じ)を ぜんぶ おぼえて いますか？ にがてな 字(じ)から 食(た)べます！', en: "Do you remember all your letters? I'll eat the ones you're weakest at first!" },
      { speaker: 'hana', sprite: 'hana:trouble', text: 'わたしの ラーメンの メニュー……かえして ください！', en: 'My ramen menu… give it back!' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '✍️ 2️⃣0️⃣', text: 'にがてな 字(じ)は ありません！ ぜんぶ 書(か)きます！', en: 'No weak letters here! We can write all twenty!' },
      FIGHT,
    ],
  },
  outro: {
    stageId: 'moji-3-boss',
    lines: [
      { bg: 'food_contest', fx: ['sparkle'], glyph: '🫧💥 ✨✨✨', text: 'あわが われました！ メニューの 字(じ)が とびます！', en: 'The bubbles burst! The menu letters fly out!' },
      { fx: ['darkclouds'], sprite: 'mojikui_boss:normal', glyph: '🚃 💨', text: '大(おお)モジクイは、電(でん)車(しゃ)で となりの 大(おお)きい 町(まち)へ にげました。', en: 'The Great Mojikui fled by train to the big city next door.' },
      { bg: 'food_lights_back', fx: ['spring'], sprite: 'hana:happy', glyph: '🌃 🏮 ✨', text: 'まちの あかりが もどりました！ メニューの 字(じ)も もどりました。', en: 'The town lights came back! The menus have their letters again.' },
      { speaker: 'hana', sprite: 'hana:cook', glyph: '👩‍🍳 🍜 ✨', text: 'みなさん、わたしの ラーメンです。どうぞ！', en: "Everyone, here's my ramen. Please, eat!" },
      { speaker: 'chef', sprite: 'chef:happy', glyph: '🍜 👑', text: 'おいしい！ 大(たい)会(かい)で いちばんの ラーメンです！', en: 'Delicious! The best ramen of the contest!' },
      { speaker: 'hana', sprite: 'hana:happy', glyph: '👧 🤝 🤖', text: 'ネクマックス、ありがとう。わたしも いっしょに 行(い)きたいです！', en: 'Thank you, Nexmax. I want to come with you!' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🚃 👉 🏙️', text: 'はい！ いっしょに となりの 町(まち)を 回(まわ)りましょう！', en: "Yes! Let's go round the next town together!" },
    ],
  },
};
