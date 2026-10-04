import type { CastMember } from '../../types/novel';
import type { EpisodeScript } from './moji1';
import { NANIWA_NEXMAX } from './naniwaCast';

/**
 * 2章「市場の ともだち」の 脚本（docs/design/12）。
 *
 * 1章の まとめの ボスの あと、大モジクイは 海の むこうの 港町 ミナトタウンへ 逃げた。霧の 町。
 * 字を 取り戻すと 霧が 晴れて いく。決まりは 1章（scripts/moji1.ts）と 同じ:
 *  - 絵が 主役。意味は 絵文字と 大きな 字（glyph）で 見せる。英語は EN ボタンだけ（`en`）。
 *  - 漢字は 1字ずつ ふりがな記法。まだ 書いて いない 漢字は 音（かな）で 出る（KanjiBackText）。
 *  - 文型は 1冊目、6〜10課まで（〜を 〜ます・〜ましょう・〜ませんか・い／な形容詞・好きです・
 *    あります／います・上／下／右／左／間・〜で（道具・ことば））。形容詞の 過去・〜より・〜たい・
 *    て形の 自由な 使い方は 使わない（docs/constraints.md 2026-10-04）。
 *  - 話ごとに: intro（困る・影の 伏線）→ 書く → encounter（灯った 字に モジクイ。あなたは かく、
 *    ぼくは たたかう）→ たたかい → outro（どこへ 逃げたか・次へ 行く 理由）。
 * はじめての ともだち ソラは 3話で 会い、8話で「友達」を 書く。
 */

const folk = (name: string) => `img/chara/naniwa/folk_${name}.webp`;
const enemy = (id: string, name: string): CastMember => ({ id, name, color: '#5a2d8c', sprites: { normal: `img/battle/${id}.webp` } });

export const MOJI2_CAST: CastMember[] = [
  NANIWA_NEXMAX,
  enemy('mojikui_scale', 'はかりの モジクイ'),
  enemy('mojikui_paint', 'いろの モジクイ'),
  enemy('mojikui_stairs', 'いしだんの モジクイ'),
  enemy('mojikui_hungry', 'はらぺこ モジクイ'),
  enemy('mojikui_arrow', 'みちしるべの モジクイ'),
  // ソラ: 2章の はじめての ともだち（docs/design/12 §2）。名前は かなで、はじめから 出る。
  { id: 'sora', name: 'ソラ', color: '#2fa3a8', sprites: { normal: folk('sora_normal'), trouble: folk('sora_trouble'), happy: folk('sora_happy') } },
  {
    // The family's name plates were eaten: ？？？ until 父・母 are written (3話).
    id: 'sora_papa',
    name: 'ソラの お父(とう)さん',
    nameChars: '父(とう)',
    color: '#6b8f3a',
    sprites: { normal: folk('sora_papa_trouble'), trouble: folk('sora_papa_trouble'), happy: folk('sora_papa_happy') },
  },
  {
    id: 'sora_mama',
    name: 'ソラの お母(かあ)さん',
    nameChars: '母(かあ)',
    color: '#d9a21b',
    sprites: { normal: folk('sora_mama_trouble'), trouble: folk('sora_mama_trouble'), happy: folk('sora_mama_happy') },
  },
  { id: 'fishmonger', name: 'いちばの ひと', color: '#2f6fb8', sprites: { normal: folk('fishmonger_trouble'), trouble: folk('fishmonger_trouble'), happy: folk('fishmonger_happy') } },
  { id: 'tailor', name: 'ふくやの ひと', color: '#b0584a', sprites: { normal: folk('tailor_trouble'), trouble: folk('tailor_trouble'), happy: folk('tailor_happy') } },
  { id: 'cook', name: 'しょくどうの ひと', color: '#e0a400', sprites: { normal: folk('cook_trouble'), trouble: folk('cook_trouble'), happy: folk('cook_happy') } },
];

const WRITE = { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" } as const;
const FIGHT = { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" } as const;

export const MOJI2_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-2-1': {
    intro: {
      stageId: 'moji-2-1',
      lines: [
        { bg: 'port_market', glyph: '⛴️ 🌁', text: 'ふねが、うみの むこうの まちに つきました。', en: 'The ferry arrives at the town across the sea.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ここは ミナトタウンです。きりの まちです。', en: 'This is Minato Town — the town of fog.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '👾 🌁', text: '大(おお)モジクイは、この まちに います。', en: 'The Great Mojikui is somewhere in this town.' },
        { glyph: '🐟 🏷️❓', text: 'みなとの いちばの ねふだの じが、ありません。', en: "The letters on the harbour market's price tags are gone." },
        { speaker: 'fishmonger', sprite: 'fishmonger:trouble', text: 'この さかなは 高(たか)いですか？ 安(やす)いですか？ わかりません……😰', en: "Is this fish expensive or cheap? I can't tell…" },
        { text: '高(たか)い、安(やす)い、大(おお)きい、小(ちい)さい、新(あたら)しい……おとだけ、のこって います。', en: 'Only the sounds are left: takai, yasui, ookii, chiisai, atarashii.' },
        { glyph: '⚖️ 👀', text: '……カチャ、カチャ。はかりの うしろに、かげが……。', en: 'Clink, clink. Behind the scale, a shadow…' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ねふだが ない。🪧🪧🪧🪧🪧', en: 'No price tags. Five empty signs.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-1',
      lines: [
        { bg: 'port_market', glyph: '高(たか) 安(やす) 大(おお) 小(ちい) 新(あたら)', text: 'ねふだが ひかります。💡', en: 'The price tags light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_scale', sprite: 'mojikui_scale:normal', text: 'ねふだも さかなも、ぜんぶ わたしの もの！ 😈', en: 'Price tags and fish — all mine!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'はかりの モジクイです！', en: 'The scale Mojikui!' },
        { speaker: 'fishmonger', sprite: 'fishmonger:trouble', text: 'わたしの さかな……！ 😱', en: 'My fish…!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-1',
      lines: [
        { bg: 'port_market', fx: ['darkclouds'], sprite: 'mojikui_scale:normal', glyph: '👕 💨', text: 'モジクイは となりの ふくやへ にげました。', en: 'The Mojikui fled into the clothes shop next door.' },
        { fx: ['spring'], glyph: '高(たか) 安(やす) 大(おお) 小(ちい) 新(あたら)', text: 'ねふだが もどりました！ きりが すこし はれました。', en: 'The price tags came back! The fog lifted a little.' },
        { speaker: 'fishmonger', sprite: 'fishmonger:happy', glyph: '🐟 = 百(ひゃく)円(えん)', text: 'この さかなは 安(やす)いですよ！ 百(ひゃく)円(えん)です。', en: 'This fish is cheap! 100 yen.' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🚢 ⛵', text: '大(おお)きい ふねと 小(ちい)さい ふねですね。', en: 'A big ship and a small boat.' },
        { speaker: 'fishmonger', sprite: 'fishmonger:happy', glyph: '👕 ⬜', text: 'となりの ふくやも、いろが ありません。', en: 'The clothes shop next door has lost its colours too.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '👕 👉', text: 'ふくやへ いきましょう！', en: "Let's go to the clothes shop!" },
      ],
    },
  },
  'moji-2-2': {
    intro: {
      stageId: 'moji-2-2',
      lines: [
        { bg: 'port_clothes', text: 'いちばの となりの ふくやです。', en: 'The clothes shop next to the harbour market.' },
        { glyph: '👕 👗 🎩 ⬜', text: 'ふくの いろが ありません。ぜんぶ はいいろです。', en: 'The clothes have no colour. Everything is grey.' },
        { speaker: 'tailor', sprite: 'tailor:trouble', text: 'この ふくは 赤(あか)ですか？ 青(あお)ですか？ わかりません……😰', en: "Is this shirt red? Blue? I can't tell…" },
        { text: '古(ふる)い、青(あお)、白(しろ)、赤(あか)、黒(くろ)……おとだけ、のこって います。', en: 'Only the sounds are left: furui, ao, shiro, aka, kuro.' },
        { glyph: '🎨 👀', text: '……ゴクゴク。えのぐを のむ かげが……。', en: 'Gulp, gulp. A shadow is drinking the paint…' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'いろの ふだが ない。🪧🪧🪧🪧🪧', en: 'No colour tags. Five empty signs.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-2',
      lines: [
        { bg: 'port_clothes', glyph: '古(ふる) 青(あお) 白(しろ) 赤(あか) 黒(くろ)', text: 'いろの ふだが ひかります。💡', en: 'The colour tags light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_paint', sprite: 'mojikui_paint:normal', text: 'いろは おいしい！ まちは ずっと はいいろです！ 😈', en: 'Colours are tasty! The town stays grey forever!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いろの モジクイです！', en: 'The colour Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-2',
      lines: [
        { bg: 'port_clothes', fx: ['darkclouds'], sprite: 'mojikui_paint:normal', glyph: '🪜 💨', text: 'モジクイは いしだんの ほうへ にげました。', en: 'The Mojikui fled toward the stone stairs.' },
        { fx: ['spring'], glyph: '🟥 🟦 ⬜ ⬛', text: 'いろが もどりました！ まちが あかるいです。', en: 'The colours came back! The town is bright.' },
        { speaker: 'tailor', sprite: 'tailor:happy', glyph: '👕 = 赤(あか)', text: 'これは 赤(あか)い ふくです。あれは 青(あお)い ぼうしです。', en: 'This is a red shirt. That is a blue hat.' },
        { speaker: 'tailor', sprite: 'tailor:happy', glyph: '🧥 ✨', text: 'この 黒(くろ)い コートは 古(ふる)いですが、すてきです。', en: 'This black coat is old, but lovely.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🪜 ⬆️', text: 'いしだんの 上(うえ)に、おみせが ありますね。', en: "There's a shop at the top of the stone stairs." },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🪜 👉', text: 'いしだんへ いきましょう！', en: "Let's go to the stairs!" },
      ],
    },
  },
  'moji-2-3': {
    intro: {
      stageId: 'moji-2-3',
      lines: [
        { bg: 'port_stairs', text: 'さかの まちの、ながい いしだんです。', en: 'A long stone staircase in the hillside town.' },
        { glyph: '🪜 🏠⬆️ 🏠⬇️', text: '上(うえ)にも 下(した)にも、おみせが あります。でも、ふだの じが ありません。', en: "There are shops at the top and at the bottom. But the signs' letters are gone." },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'お父(とう)さん！ お母(かあ)さん！ どこですか？ 😢', en: 'Dad! Mum! Where are you?' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🏠 ⬆️❓ ⬇️❓', text: 'わたしの うちは 上(うえ)ですか？ 下(した)ですか？', en: 'Is my house at the top? Or at the bottom?' },
        { text: '上(うえ)、下(した)、父(ちち)、母(はは)、子(こ)、手(て)……おとだけ、のこって います。', en: 'Only the sounds are left: ue, shita, chichi, haha, ko, te.' },
        { glyph: '🪜 👀', text: '……ズル、ズル。いしだんを すべる かげが……。', en: 'Slither, slither. A shadow slides down the stairs…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-3',
      lines: [
        { bg: 'port_stairs', glyph: '上(うえ) 下(した) 父(ちち) 母(はは) 子(こ) 手(て)', text: 'いしだんの ふだが ひかります。💡', en: 'The signs on the stairs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_stairs', sprite: 'mojikui_stairs:normal', text: 'うちの ふだは、わたしが 食(た)べます！ 😈', en: "I'll eat the house signs!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いしだんの モジクイです！', en: 'The stairs Mojikui!' },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'こわい……！ 😱', en: 'Scary…!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-3',
      lines: [
        { bg: 'port_stairs', fx: ['darkclouds'], sprite: 'mojikui_stairs:normal', glyph: '🍽️ 💨', text: 'モジクイは みなとの しょくどうへ にげました。', en: 'The Mojikui fled to the harbour eatery.' },
        { fx: ['spring'], glyph: '⬆️ 上(うえ) ⬇️ 下(した)', text: 'ふだが もどりました！ ソラの うちは 上(うえ)です！', en: "The signs came back! Sora's house is at the top!" },
        { speaker: 'sora_papa', sprite: 'sora_papa:happy', text: 'ソラ！ わたしは ソラの 父(ちち)です。', en: "Sora! I'm Sora's father." },
        { speaker: 'sora_mama', sprite: 'sora_mama:happy', text: 'わたしは 母(はは)です。ありがとう ございます！', en: "I'm her mother. Thank you so much!" },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '👧 🤖', text: 'はじめまして。わたしは ソラです。この うちの 子(こ)です！', en: "Nice to meet you. I'm Sora — the child of this house!" },
        { speaker: 'sora_papa', sprite: 'sora_papa:happy', glyph: '✋ 🧸 ⛵', text: 'うちの おみせの ものは、ぜんぶ 手(て)で つくります。', en: 'Everything in our shop is made by hand.' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🍽️ 👉', text: 'わたしも いっしょに いきます！ しょくどうへ いきましょう！', en: "I'll come too! Let's go to the eatery!" },
      ],
    },
  },
  'moji-2-4': {
    intro: {
      stageId: 'moji-2-4',
      lines: [
        { bg: 'port_foodhall', text: 'みなとの しょくどうです。いい におい！', en: 'The harbour eatery. It smells good!' },
        { glyph: '📋 ❓', text: 'メニューの じが ありません。', en: 'The letters on the menu are gone.' },
        { speaker: 'cook', sprite: 'cook:trouble', text: 'なにを 食(た)べますか？ なにを 飲(の)みますか？ わたしも わかりません……😰', en: "What will you eat? What will you drink? Even I don't know…" },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🐟 ❤️', text: 'わたしは さかなが 好(す)きです！', en: 'I like fish!' },
        { text: '好(す)き、主(しゅ)、肉(にく)、魚(さかな)、食(た)べます、飲(の)みます、物(もの)……おとだけ、のこって います。', en: 'Only the sounds are left: suki, shu, niku, sakana, tabemasu, nomimasu, mono.' },
        { glyph: '🍽️ 👀', text: '……モグモグ。メニューを 食(た)べる かげが……。', en: 'Munch, munch. A shadow is eating the menu…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-4',
      lines: [
        { bg: 'port_foodhall', glyph: '好(す) 主(しゅ) 肉(にく) 魚(さかな) 食(た) 飲(の) 物(もの)', text: 'メニューが ひかります。💡', en: 'The menu lights up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_hungry', sprite: 'mojikui_hungry:normal', text: 'メニューも ごはんも、ぜんぶ 食(た)べます！ 😋', en: "Menus and meals — I'll eat it all!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'はらぺこ モジクイです！', en: 'The hungry Mojikui!' },
        { speaker: 'cook', sprite: 'cook:trouble', text: 'わたしの りょうり……！ 😱', en: 'My cooking…!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-4',
      lines: [
        { bg: 'port_foodhall', fx: ['darkclouds'], sprite: 'mojikui_hungry:normal', glyph: '🛤️ 💨', text: 'モジクイは いしだんの こみちへ にげました。', en: 'The Mojikui fled into the narrow stone alleys.' },
        { fx: ['spring'], glyph: '📋 ✨', text: 'メニューが もどりました！', en: 'The menu came back!' },
        { speaker: 'cook', sprite: 'cook:happy', glyph: '🍖 🐟 🍵', text: '肉(にく)と 魚(さかな)が あります。なにを 食(た)べますか？', en: 'We have meat and fish. What will you eat?' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🐟 😋', text: '魚(さかな)を 食(た)べます！ それから、おちゃを 飲(の)みます。', en: "I'll have fish! And then I'll drink tea." },
        { speaker: 'cook', sprite: 'cook:happy', glyph: '🍚 = 主(しゅ)食(しょく)', text: '主(しゅ)食(しょく)は ごはんです。たくさん どうぞ！', en: 'The staple is rice. Have plenty!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🤖 ❤️', text: 'ぼくは なにも 食(た)べません。でも、みんなの 好(す)きな 物(もの)が 好(す)きです！', en: "I don't eat anything. But I like everyone's favourite things!" },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🛤️ 👉', text: 'こみちは むずかしいです。いっしょに いきましょう！', en: "The alleys are tricky. Let's go together!" },
      ],
    },
  },
  'moji-2-5': {
    intro: {
      stageId: 'moji-2-5',
      lines: [
        { bg: 'port_alley', text: 'いしだんの こみちです。みちが たくさん あります。', en: 'The narrow stone alleys. So many paths.' },
        { glyph: '🪧⬅️❓ 🪧➡️❓', text: 'みちしるべの じが ありません。', en: "The signposts' letters are gone." },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'きりで みちが わかりません。右(みぎ)ですか？ 左(ひだり)ですか？ 😰', en: "I can't tell the way in this fog. Right? Left?" },
        { text: '近(ちか)く、間(あいだ)、右(みぎ)、左(ひだり)……おとだけ、のこって います。', en: 'Only the sounds are left: chikaku, aida, migi, hidari.' },
        { glyph: '🐕 🔊', text: '……ワン！ ワン！ とおくで いぬの こえが します。', en: 'Woof! Woof! A dog barks in the distance.' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🐕 ❓', text: 'あ……わたしの いぬ？', en: 'Ah… is that my dog?' },
        { glyph: '🪧 👀', text: '……クルクル。みちしるべを まわす かげが……。', en: 'Round and round. A shadow is spinning the signposts…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-5',
      lines: [
        { bg: 'port_alley', glyph: '近(ちか) 間(あいだ) 右(みぎ) 左(ひだり)', text: 'みちしるべが ひかります。💡', en: 'The signposts light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_arrow', sprite: 'mojikui_arrow:normal', text: '右(みぎ)？ 左(ひだり)？ みんな まいごです！ 😈', en: 'Right? Left? Everyone is lost!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'みちしるべの モジクイです！', en: 'The signpost Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-5',
      lines: [
        { bg: 'port_alley', fx: ['darkclouds'], sprite: 'mojikui_arrow:normal', glyph: '🌳 💨', text: 'モジクイは みなとの こうえんへ にげました。', en: 'The Mojikui fled to the harbour park.' },
        { fx: ['spring'], glyph: '⬅️ 左(ひだり) ➡️ 右(みぎ)', text: 'みちしるべが もどりました！', en: 'The signposts came back!' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🏠 ⬅️ 🍽️ ➡️', text: 'うちは 左(ひだり)です。しょくどうは 右(みぎ)です！', en: 'Home is to the left. The eatery is to the right!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🚉 🌳 ⚓', text: 'こうえんは、えきと みなとの 間(あいだ)です。近(ちか)くですね。', en: "The park is between the station and the harbour. It's close by." },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🐕 ❓', text: 'わたしの いぬも、こうえんに いますか？', en: 'Is my dog in the park too?' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🌳 👉', text: 'こうえんへ いきましょう！', en: "Let's go to the park!" },
      ],
    },
  },
};
