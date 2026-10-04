import type { CastMember } from '../../types/novel';
import type { EpisodeScript } from './moji1';
import type { FinaleScript } from '../mojiFinale';
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
  enemy('mojikui_park', 'こうえんの モジクイ'),
  enemy('mojikui_newspaper', 'しんぶんの モジクイ'),
  enemy('mojikui_diary', 'にっきの モジクイ'),
  enemy('mojikui_camera', 'カメラの モジクイ'),
  enemy('mojikui_film', 'フィルムの モジクイ'),
  // ソラ: 2章の はじめての ともだち（docs/design/12 §2）。名前は かなで、はじめから 出る。
  {
    id: 'sora',
    name: 'ソラ',
    color: '#2fa3a8',
    sprites: { normal: folk('sora_normal'), trouble: folk('sora_trouble'), happy: folk('sora_happy'), dog: folk('sora_dog'), diary: folk('sora_diary') },
  },
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
  { id: 'librarian', name: 'としょかんの ひと', color: '#3aa877', sprites: { normal: folk('librarian_trouble'), trouble: folk('librarian_trouble'), happy: folk('librarian_happy') } },
  { id: 'photographer', name: 'しゃしんやの ひと', color: '#8a6a44', sprites: { normal: folk('photographer_trouble'), trouble: folk('photographer_trouble'), happy: folk('photographer_happy') } },
  { id: 'usher', name: 'えいがかんの ひと', color: '#c0392b', sprites: { normal: folk('usher_trouble'), trouble: folk('usher_trouble'), happy: folk('usher_happy') } },
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
        { fx: ['spring'], sprite: 'fishmonger:happy', glyph: '高(たか) 安(やす) 大(おお) 小(ちい) 新(あたら)', text: 'ねふだが もどりました！ きりが すこし はれました。', en: 'The price tags came back! The fog lifted a little.' },
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
        { fx: ['spring'], sprite: 'tailor:happy', glyph: '🟥 🟦 ⬜ ⬛', text: 'いろが もどりました！ まちが あかるいです。', en: 'The colours came back! The town is bright.' },
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
        { fx: ['spring'], sprite: 'sora_papa:happy', glyph: '⬆️ 上(うえ) ⬇️ 下(した)', text: 'ふだが もどりました！ ソラの うちは 上(うえ)です！', en: "The signs came back! Sora's house is at the top!" },
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
        { fx: ['spring'], sprite: 'cook:happy', glyph: '📋 ✨', text: 'メニューが もどりました！', en: 'The menu came back!' },
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
        { fx: ['spring'], sprite: 'sora:happy', glyph: '⬅️ 左(ひだり) ➡️ 右(みぎ)', text: 'みちしるべが もどりました！', en: 'The signposts came back!' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🏠 ⬅️ 🍽️ ➡️', text: 'うちは 左(ひだり)です。しょくどうは 右(みぎ)です！', en: 'Home is to the left. The eatery is to the right!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🚉 🌳 ⚓', text: 'こうえんは、えきと みなとの 間(あいだ)です。近(ちか)くですね。', en: "The park is between the station and the harbour. It's close by." },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🐕 ❓', text: 'わたしの いぬも、こうえんに いますか？', en: 'Is my dog in the park too?' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🌳 👉', text: 'こうえんへ いきましょう！', en: "Let's go to the park!" },
      ],
    },
  },
  'moji-2-6': {
    intro: {
      stageId: 'moji-2-6',
      lines: [
        { bg: 'port_park', text: 'えきと みなとの 間(あいだ)の こうえんです。', en: 'The park between the station and the harbour.' },
        { glyph: '🐕 🪧❓ 🚻❓', text: 'こうえんの ふだの じが ありません。', en: "The park's signs have lost their letters." },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'わたしの いぬが いません……。どこですか？ 😢', en: "My dog isn't here… Where is it?" },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🚻 ❓', text: 'お手(て)あらいの ふだも ありません。こまりますね。', en: "The restroom signs are gone too. That's a problem." },
        { text: '外(そと)、男(おとこ)、女(おんな)、犬(いぬ)……おとだけ、のこって います。', en: 'Only the sounds are left: soto, otoko, onna, inu.' },
        { glyph: '🦴 👀', text: '……ガジガジ。くびわを かむ かげが……。', en: 'Chomp, chomp. A shadow chewing a dog collar…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-6',
      lines: [
        { bg: 'port_park', glyph: '外(そと) 男(おとこ) 女(おんな) 犬(いぬ)', text: 'こうえんの ふだが ひかります。💡', en: "The park's signs light up." },
        { fx: ['darkclouds'], speaker: 'mojikui_park', sprite: 'mojikui_park:normal', text: '犬(いぬ)の なまえは、わたしが 食(た)べました！ 😈', en: "I ate the dog's name!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'こうえんの モジクイです！', en: 'The park Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-6',
      lines: [
        { bg: 'port_park', fx: ['darkclouds'], sprite: 'mojikui_park:normal', glyph: '📚 💨', text: 'モジクイは さかの 上(うえ)の としょかんへ にげました。', en: 'The Mojikui fled to the library at the top of the hill.' },
        { fx: ['spring'], sprite: 'sora:dog', glyph: '🚹 男(おとこ) 🚺 女(おんな)', text: 'ふだが もどりました！', en: 'The signs came back!' },
        { glyph: '🐕 ❗', text: '……ワン！ 犬(いぬ)は こうえんの 外(そと)に います！', en: 'Woof! The dog is outside the park!' },
        { speaker: 'sora', sprite: 'sora:dog', glyph: '👧 🐕 💕', text: 'マル！ ここに いますね！ ありがとう！', en: "Maru! There you are! Thank you!" },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '📚 👾', text: 'としょかんに、大(おお)モジクイの 本(ほん)が ありますか？', en: 'Is there a book about the Great Mojikui in the library?' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '📚 👉', text: 'としょかんは さかの 上(うえ)です。いきましょう！', en: "The library is at the top of the hill. Let's go!" },
      ],
    },
  },
  'moji-2-7': {
    intro: {
      stageId: 'moji-2-7',
      lines: [
        { bg: 'port_library', text: 'さかの 上(うえ)の、古(ふる)い としょかんです。', en: 'The old library at the top of the hill.' },
        { glyph: '📚 🎭 ❓', text: '本(ほん)の じが ありません。かみしばいの じも ありません。', en: 'The books have lost their letters. The picture-story cards too.' },
        { speaker: 'librarian', sprite: 'librarian:trouble', text: '本(ほん)を 読(よ)みますか？ ……でも、じが ありません。😰', en: 'Will you read a book? …But there are no letters.' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🎭 👂', text: 'まいにち ここで かみしばいの 話(はなし)を 聞(き)きます。でも、きょうは……。', en: 'Every day I listen to the picture-stories here. But today…' },
        { text: '書(か)きます、聞(き)きます、読(よ)みます、見(み)ます、話(はな)します……おとだけ、のこって います。', en: 'Only the sounds are left: kakimasu, kikimasu, yomimasu, mimasu, hanashimasu.' },
        { glyph: '📰 👀', text: '……バサッ。しんぶんの うしろに、かげが……。', en: 'Flap! Behind the newspaper, a shadow…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-7',
      lines: [
        { bg: 'port_library', glyph: '書(か) 聞(き) 読(よ) 見(み) 話(はな)', text: '本(ほん)と かみしばいが ひかります。💡', en: 'The books and the picture-story cards light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_newspaper', sprite: 'mojikui_newspaper:normal', text: '本(ほん)の じも 話(はなし)も、ぜんぶ 食(た)べます！ 😋', en: "Book letters and stories — I'll eat them all!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'しんぶんの モジクイです！', en: 'The newspaper Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-7',
      lines: [
        { bg: 'port_library', fx: ['darkclouds'], sprite: 'mojikui_newspaper:normal', glyph: '🌊 💨', text: 'モジクイは うみぞいの みちへ にげました。', en: 'The Mojikui fled to the seaside path.' },
        { fx: ['spring'], sprite: 'librarian:happy', glyph: '📚 ✨', text: '本(ほん)の じが もどりました！', en: 'The letters came back to the books!' },
        { speaker: 'librarian', sprite: 'librarian:happy', glyph: '📖 😊', text: 'どうぞ、本(ほん)を 読(よ)んで ください。', en: 'Please, read the books.' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🎭 ✨', text: 'かみしばいの 話(はなし)を 聞(き)きましょう！', en: "Let's listen to the picture-story!" },
        { speaker: 'librarian', sprite: 'librarian:happy', glyph: '🖼️ 💡', text: 'この えを 見(み)て ください。みさきの とうだいです。', en: 'Look at this picture. It is the lighthouse on the cape.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🌁 💡 👾', text: 'きりの まんなかに、とうだいが あります。', en: 'In the middle of the fog, there is a lighthouse.' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🌊 👉', text: 'まず、うみぞいの みちへ いきましょう！', en: "First, let's go to the seaside path!" },
      ],
    },
  },
  'moji-2-8': {
    intro: {
      stageId: 'moji-2-8',
      lines: [
        { bg: 'port_seaside', text: 'うみぞいの みちです。かもめが います。', en: 'The seaside path. There are gulls.' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '📔 ❓', text: 'わたしの にっき……じが ありません！ 😢', en: 'My diary… the letters are gone!' },
        { glyph: '📔 🕖 🛍️ 🏠', text: '「七(しち)時(じ)に 起(お)きます。いちばで 買(か)います。うちへ 帰(かえ)ります。」……', en: '"I wake up at seven. I shop at the market. I go home." …' },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'まいにち にっきを 書(か)きます。でも、きょうは 書(か)きません……。', en: "I write my diary every day. But today I can't…" },
        { text: '買(か)います、起(お)きます、帰(かえ)ります、友(とも)、達(だち)……おとだけ、のこって います。', en: 'Only the sounds are left: kaimasu, okimasu, kaerimasu, tomo, dachi.' },
        { glyph: '📔 👀', text: '……パラパラ。にっきを めくる かげが……。', en: 'Flip, flip. A shadow turning the pages of the diary…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-8',
      lines: [
        { bg: 'port_seaside', glyph: '買(か) 起(お) 帰(かえ) 友(とも) 達(だち)', text: 'にっきが ひかります。💡', en: 'The diary lights up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_diary', sprite: 'mojikui_diary:normal', text: 'この にっきは、わたしの ごはんです！ 😋', en: 'This diary is my dinner!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'にっきの モジクイです！', en: 'The diary Mojikui!' },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'かえして ください！ 😱', en: 'Give it back!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-8',
      lines: [
        { bg: 'port_seaside', fx: ['darkclouds'], sprite: 'mojikui_diary:normal', glyph: '📷 💨', text: 'モジクイは しゃしんやへ にげました。', en: 'The Mojikui fled to the photo studio.' },
        { fx: ['spring'], sprite: 'sora:diary', glyph: '📔 ✨', text: 'にっきの じが もどりました！', en: "The diary's letters came back!" },
        { speaker: 'sora', sprite: 'sora:diary', glyph: '📔 ✏️', text: '「七(しち)時(じ)に 起(お)きます。いちばで 買(か)います。うちへ 帰(かえ)ります。」', en: '"I wake up at seven. I shop at the market. I go home."' },
        { speaker: 'sora', sprite: 'sora:diary', glyph: '✏️ 友(とも)達(だち)', text: 'それから……「友(とも)達(だち)」。', en: 'And then… "friends".' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '👧 🤝 🤖', text: 'あなたと ネクマックスは、わたしの 友(とも)達(だち)です！', en: 'You and Nexmax are my friends!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🤖 💕', text: 'うれしいです！ ソラは ミナトタウンの はじめての 友(とも)達(だち)です。', en: "I'm so happy! Sora is our first friend in Minato Town." },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '📷 👉', text: 'しゃしんやへ いきましょう！ みんなで しゃしんを とりましょう！', en: "Let's go to the photo studio! Let's all take a photo!" },
      ],
    },
  },
  'moji-2-9': {
    intro: {
      stageId: 'moji-2-9',
      lines: [
        { bg: 'port_photo', text: 'しゃしんやと おちゃやが あります。', en: 'There is a photo studio and a tea shop.' },
        { glyph: '🖼️ ⬜ 🍵 ❓', text: 'しゃしんも かみも まっしろです。おみせの ふだの じも ありません。', en: 'The photos and papers are all blank white. The shop signs have no letters either.' },
        { speaker: 'photographer', sprite: 'photographer:trouble', text: 'わたしの しゃしん……なにも ありません。😰', en: "My photographs… there's nothing on them." },
        { speaker: 'photographer', sprite: 'photographer:trouble', glyph: '🍵 🍶 ❓', text: 'となりの おみせも、お茶(ちゃ)ですか？ お酒(さけ)ですか？ わかりません。', en: "And the shop next door — tea? Sake? I can't tell." },
        { text: '茶(ちゃ)、酒(さけ)、写(しゃ)、真(しん)、紙(かみ)……おとだけ、のこって います。', en: 'Only the sounds are left: cha, sake, sha, shin, kami.' },
        { glyph: '📷 👀', text: '……パシャ！ ひかりの 中(なか)に、かげが……。', en: 'Flash! Inside the light, a shadow…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-9',
      lines: [
        { bg: 'port_photo', glyph: '茶(ちゃ) 酒(さけ) 写(しゃ) 真(しん) 紙(かみ)', text: 'しゃしんと ふだが ひかります。💡', en: 'The photos and the signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_camera', sprite: 'mojikui_camera:normal', text: 'まちの おもいでは、ぜんぶ わたしの もの！ 😈', en: "The town's memories are all mine!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'カメラの モジクイです！', en: 'The camera Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-9',
      lines: [
        { bg: 'port_photo', fx: ['darkclouds'], sprite: 'mojikui_camera:normal', glyph: '🎬 💨', text: 'モジクイは えいがかんの とおりへ にげました。', en: 'The Mojikui fled to the cinema street.' },
        { fx: ['spring'], sprite: 'photographer:happy', glyph: '🖼️ ✨', text: '写(しゃ)真(しん)が もどりました！', en: 'The photographs came back!' },
        { speaker: 'photographer', sprite: 'photographer:happy', glyph: '🖼️ 💡 ☀️', text: 'これは むかしの 写(しゃ)真(しん)です。きりが ありません。とうだいも あかるいです。', en: 'This is an old photo. No fog. The lighthouse is bright.' },
        { speaker: 'photographer', sprite: 'photographer:happy', glyph: '🍵', text: 'となりは お茶(ちゃ)の おみせです。どうぞ、お茶(ちゃ)を 飲(の)んで ください。', en: 'Next door is the tea shop. Please, have some tea.' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '📷 👧 🤖', text: 'みんなで 写(しゃ)真(しん)を とりましょう！ はい、チーズ！', en: "Let's all take a photo! Say cheese!" },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🎬 👉', text: 'つぎは えいがかんです。いきましょう！', en: "Next is the cinema. Let's go!" },
      ],
    },
  },
  'moji-2-10': {
    intro: {
      stageId: 'moji-2-10',
      lines: [
        { bg: 'port_cinema', text: 'よるの えいがかんの とおりです。', en: 'The cinema street at night.' },
        { glyph: '🎬 🪧❓ 🔤❓', text: 'えいがの ポスターも、おみせの なまえも、じが ありません。', en: 'The movie posters and the shop names have lost their letters.' },
        { speaker: 'usher', sprite: 'usher:trouble', text: 'きょうの えいがは なんですか？ わたしも わかりません……😰', en: "What's showing today? Even I don't know…" },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🔤 ❓', text: 'わたしは 英(えい)語(ご)が 好(す)きです。でも、ポスターの 英(えい)語(ご)も ありません。', en: 'I like English. But the English on the posters is gone too.' },
        { text: '映(えい)、画(が)、店(みせ)、英(えい)、語(ご)……おとだけ、のこって います。', en: 'Only the sounds are left: ei, ga, mise, ei, go.' },
        { glyph: '🎞️ 👀', text: '……カラカラ。フィルムを まわす かげが……。', en: 'Rattle, rattle. A shadow is spinning the film…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-2-10',
      lines: [
        { bg: 'port_cinema', glyph: '映(えい) 画(が) 店(みせ) 英(えい) 語(ご)', text: 'ポスターと おみせの ふだが ひかります。💡', en: 'The posters and the shop signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_film', sprite: 'mojikui_film:normal', text: 'えいがは おわりです！ まちは ずっと くらいです！ 😈', en: "The movie's over! The town stays dark forever!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'フィルムの モジクイです！', en: 'The film Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-2-10',
      lines: [
        { bg: 'port_cinema', fx: ['darkclouds'], sprite: 'mojikui_film:normal', glyph: '💡 💨', text: 'モジクイは みさきの とうだいへ にげました。', en: 'The Mojikui fled to the lighthouse on the cape.' },
        { fx: ['spring'], sprite: 'usher:happy', glyph: '🎬 ✨', text: 'ポスターと おみせの なまえが もどりました！', en: 'The posters and the shop names came back!' },
        { speaker: 'usher', sprite: 'usher:happy', glyph: '🎟️ 🎬', text: '映(えい)画(が)を 見(み)ませんか？ きょうは ふねの 映(えい)画(が)です！', en: "Won't you watch a movie? Today it's a ship movie!" },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🔤 ✨', text: '「シネマ」は 英(えい)語(ご)です。日(に)本(ほん)語(ご)で「映(えい)画(が)」です！', en: '"Cinema" is English. In Japanese it is "eiga"!' },
        { glyph: '🎬 💡 👾', text: '……スクリーンに、とうだいの かげが うつります。', en: '…On the screen, the shadow of the lighthouse appears.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '💡 👾', text: '大(おお)モジクイは、とうだいに います！', en: 'The Great Mojikui is in the lighthouse!' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '💡 👉', text: 'いっしょに とうだいへ いきましょう！', en: "Let's go to the lighthouse together!" },
      ],
    },
  },
};

/**
 * 2章 11話 まとめの ボス（docs/design/12 §3）: 霧の 灯台で 大モジクイ。勝つと 霧が 晴れ、
 * 大モジクイは 海の むこうの「たべものの まち」（3章「読めない メニュー」）へ 逃げる → つづく。
 */
export const MOJI2_FINALE: FinaleScript = {
  intro: {
    stageId: 'moji-2-boss',
    lines: [
      { bg: 'port_lighthouse', glyph: '🌁 💡', text: 'みさきの とうだいの 中(なか)です。きりが いっぱいです。', en: 'Inside the lighthouse on the cape. Thick fog everywhere.' },
      { glyph: '🏷️ 📋 🎬 🖼️', text: 'ねふだ、メニュー、ポスター、写(しゃ)真(しん)……ぜんぶ ここに あります！', en: 'Price tags, menus, posters, photos — they are all here!' },
      { fx: ['darkclouds'], speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: 'また きましたね。この まちの じも、わたしの ものです！ 😈', en: "You came again. This town's letters are mine too!" },
      { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👀 ✍️ ❓', text: 'あなたの にがてな じは どれですか？ その じから 食(た)べます！', en: "Which letters are you weakest at? I'll eat those first!" },
      { speaker: 'sora', sprite: 'sora:trouble', text: 'こわい……。でも、わたしも ここに います！', en: "It's scary… But I'm here too!" },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '✍️ 5️⃣1️⃣', text: 'にがてな じは ありません！ ぜんぶ かきます！', en: 'No weak letters here! We can write all 51!' },
      FIGHT,
    ],
  },
  outro: {
    stageId: 'moji-2-boss',
    lines: [
      { bg: 'port_lighthouse', fx: ['sparkle'], glyph: '🫧💥 ✨✨✨', text: 'あわが われました！ じが そとへ とびます！', en: 'The bubbles burst! The letters fly out!' },
      { fx: ['darkclouds'], sprite: 'mojikui_boss:normal', glyph: '🍜 💨', text: '大(おお)モジクイは、うみの むこうの たべものの まちへ にげました。', en: 'The Great Mojikui fled across the sea to the city of food.' },
      { bg: 'port_lights_back', fx: ['spring'], sprite: 'sora_papa:happy', glyph: '💡 🏙️ ✨', text: 'きりが はれました！ とうだいの ひかりが まちを てらします。', en: 'The fog has cleared! The lighthouse light shines over the town.' },
      { speaker: 'sora_papa', sprite: 'sora_papa:happy', glyph: '👨‍👩‍👧 ✨', text: 'ありがとう ございます。まちが あかるいです。', en: 'Thank you so much. The town is bright.' },
      { speaker: 'sora', sprite: 'sora:happy', glyph: '👧 🤝 🤖', text: 'あなたたちは、ずっと わたしの 友(とも)達(だち)です！', en: 'You will always be my friends!' },
      { speaker: 'sora', sprite: 'sora:normal', glyph: '📷 💌', text: 'また いっしょに あそびましょう！', en: "Let's play together again!" },
      { glyph: '🌊 🍜 🏙️ ❓', text: 'でも……うみの むこうの まちの メニューも、じが ありません。', en: "But… across the sea, the food city's menus have lost their letters too." },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '⛴️ 👉 🍜', text: 'つぎは あの まちへ 行(い)きましょう！', en: "Next, let's go to that town!" },
    ],
  },
};
