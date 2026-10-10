import type { CastMember } from '../../types/novel';
import type { EpisodeScript } from './moji1';
import type { FinaleScript } from '../mojiFinale';
import { NANIWA_NEXMAX } from './naniwaCast';
import { MOJI1_CAST } from './moji1';
import { MOJI2_CAST } from './moji2';
import { MOJI3_CAST } from './moji3';

/**
 * 5章「モジクイの 王」の 脚本（docs/design/20）。
 *
 * 4章の まとめの ボスの あと、モジクイの 王が 大モジクイを「字の ない せかい」へ 連れて いった。
 * 3人は 夜の 電車で その せかいの 町 シズカタウンへ 行く。決まりは 1〜4章と 同じ:
 *  - 絵が 主役。意味は 絵文字と 大きな 字（glyph）で 見せる。英語は EN ボタンだけ（`en`）。
 *  - 漢字は 1字ずつ ふりがな記法。まだ 書いて いない 漢字は 音（かな）で 出る（KanjiBackText）。
 *  - 文型は 25課まで。1話に 1つ: と 思います・と 言いました（21）・名詞修飾（22）・とき・と（条件）（23）・
 *    くれます・〜て もらいます（24）・たら・ても・もし（25）。受け身・可能形・ば・なら・意向形・かもしれません・
 *    命令形・〜ていく は 使わない（docs/constraints.md）。
 *  - ともだちどうしは ふつうの 言い方（4章 5話から）。町の 人と ネクマックスは です・ます。
 * まとめの ボスでは プレイヤーが はじめて 王に こたえる（えらぶ ボタンが プレイヤーの ことば。王が こたえて、どちらも 同じ 所へ もどる）。
 */

const folk = (name: string) => `img/chara/naniwa/folk_${name}.webp`;
const enemy = (id: string, name: string): CastMember => ({ id, name, color: '#5a2d8c', sprites: { normal: `img/battle/${id}.webp` } });
const townsperson = (id: string, name: string, color: string, nameChars?: string): CastMember => ({
  id,
  name,
  ...(nameChars ? { nameChars } : {}),
  color,
  sprites: { normal: folk(`${id}_trouble`), trouble: folk(`${id}_trouble`), happy: folk(`${id}_happy`) },
});
/** The friends from 2章 and 3章, and the Great Mojikui of 1〜4章: the same people, with the same pictures. */
const same = (cast: CastMember[], id: string): CastMember => cast.find((c) => c.id === id)!;

export const MOJI5_CAST: CastMember[] = [
  NANIWA_NEXMAX,
  same(MOJI2_CAST, 'sora'),
  same(MOJI3_CAST, 'hana'),
  same(MOJI1_CAST, 'mojikui_boss'),
  enemy('mojikui_pillow', 'まくらの モジクイ'),
  enemy('mojikui_stamp', 'はんこの モジクイ'),
  enemy('mojikui_key', 'かぎの モジクイ'),
  enemy('mojikui_earplug', 'みみせんの モジクイ'),
  enemy('mojikui_snowman', 'ゆきだるまの モジクイ'),
  enemy('mojikui_sneeze', 'くしゃみの モジクイ'),
  enemy('mojikui_album', 'アルバムの モジクイ'),
  enemy('mojikui_wave', 'なみの モジクイ'),
  enemy('mojikui_curtain', 'カーテンの モジクイ'),
  {
    id: 'mojikui_king',
    name: 'モジクイの 王(おう)',
    color: '#2a1550',
    sprites: { normal: 'img/battle/mojikui_king.webp', small: 'img/battle/mojikui_king_small.webp', happy: 'img/battle/mojikui_king_happy.webp' },
  },
  { id: 'ekichou', name: 'えきちょうさん', color: '#2f4f8f', sprites: { normal: folk('ekichou_sleep'), sleep: folk('ekichou_sleep'), happy: folk('ekichou_happy') } },
  townsperson('boy', 'おとこのこ', '#d9a21b'),
  // Their names were eaten with the town's letters: ？？？ until they are written.
  townsperson('mayor', '町(ちょう)長(ちょう)さん', '#2f7a4f', '町(ちょう)'),
  townsperson('musician', '音(おん)楽(がく)の 人(ひと)', '#b8323a', '音(おん)楽(がく)'),
  townsperson('gardener', 'にわの おじいさん', '#5a8a2f'),
  townsperson('nurse', 'かんごしさん', '#e2799a'),
  townsperson('ani', 'お兄(にい)さん', '#2f4f8f', '兄(にい)'),
  townsperson('otouto', '弟(おとうと)', '#3a8fd8', '弟(おとうと)'),
  townsperson('ane', 'お姉(ねえ)さん', '#2fa3a8', '姉(ねえ)'),
  townsperson('imouto', '妹(いもうと)さん', '#d9a21b', '妹(いもうと)'),
];

const WRITE = { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" } as const;
const FIGHT = { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" } as const;

export const MOJI5_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-5-1': {
    intro: {
      stageId: 'moji-5-1',
      lines: [
        { bg: 'shizuka_station', fx: ['rain'], glyph: '🚃 🌧️', text: '夜(よる)の 電(でん)車(しゃ)を 降(お)りました。雨(あめ)が 降(ふ)って います。', en: 'We got off the night train. It is raining.' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🤫', text: 'とても しずかだね……。だれも いない。', en: "It's so quiet… There's no one here." },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🪧⬜ 🕰️⬜', text: 'ふだにも、とけいにも、字(じ)が ありません。ここは 字(じ)の ない せかいだと 思(おも)います。', en: 'The signs and the clock have no letters. I think this is the world without letters.' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '👑 💬', text: '王(おう)さまは「字(じ)の ない せかいへ かえりましょう」と 言(い)いました。', en: 'The King said, "Let us go home to the world without letters."' },
        { sprite: 'ekichou:sleep', glyph: '💤', text: 'えきの 人(ひと)が 寝(ね)て います。', en: 'Someone from the station is asleep.' },
        { speaker: 'sora', sprite: 'sora:trouble', text: 'あの……おきて ください！', en: 'Um… please wake up!' },
        { speaker: 'ekichou', sprite: 'ekichou:sleep', glyph: '💤', text: 'ぐう……ぐう……。夜(よる)は まだ 終(お)わりません……。', en: 'Zzz… zzz… The night is not over yet…' },
        { text: '降(ふ)る、思(おも)う、寝(ね)る、終(お)わる、言(い)う……かんじが ありませんから、わかりません。', en: 'furu, omou, neru, owaru, iu… no kanji, so nobody understands.' },
        { glyph: '🛏️ 👀', text: '……ふわぁ。大(おお)きい まくらの 上(うえ)に、かげが います。', en: 'Yaaawn… A shadow lies on a big pillow.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-1',
      lines: [
        { bg: 'shizuka_station', glyph: '降(ふ) 思(おも) 寝(ね) 終(お) 言(い)', text: 'えきの ふだが ひかります。💡', en: 'The station signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_pillow', sprite: 'mojikui_pillow:normal', text: 'ふわぁ。字(じ)は いりません。みんな ずっと 寝(ね)て ください。😈', en: 'Yaaawn. No letters needed. Everyone, just sleep forever.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'まくらの モジクイです！ ねぼすけです！', en: 'The pillow Mojikui! What a sleepyhead!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-1',
      lines: [
        { bg: 'shizuka_station', fx: ['darkclouds'], sprite: 'mojikui_pillow:normal', glyph: '⛲ 💨', text: 'モジクイは 町(まち)の ひろばへ にげました。', en: 'The Mojikui fled to the town square.' },
        { fx: ['spring'], sprite: 'none', glyph: '🌧️ ➡️ 🌙', text: 'ふだが もどりました！ 雨(あめ)が 降(ふ)らなく なりました。', en: 'The signs came back! The rain has stopped.' },
        { speaker: 'ekichou', sprite: 'ekichou:happy', glyph: '😮 ✨', text: 'あれ？ わたしは 寝(ね)て いましたか？ ありがとう ございます！', en: 'Huh? Was I asleep? Thank you!' },
        { speaker: 'ekichou', sprite: 'ekichou:happy', glyph: '👑 💬', text: '王(おう)さまは「この 町(まち)の 字(じ)も、ぜんぶ 食(た)べます」と 言(い)いました。それから、みんな 寝(ね)ました。', en: 'The King said, "I will eat this town\'s letters too." Then everyone fell asleep.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '王(おう)さまは どこに いますか？', en: 'Where is the King?' },
        { speaker: 'ekichou', sprite: 'ekichou:happy', glyph: '🏯', text: '町(まち)の 中(なか)の 大(おお)きい しろに います。', en: 'In the big castle in the middle of the town.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '⛲ 👉', text: 'ひろばへ 行(い)きましょう！', en: "Let's go to the square!" },
      ],
    },
  },
  'moji-5-2': {
    intro: {
      stageId: 'moji-5-2',
      lines: [
        { bg: 'shizuka_square', glyph: '⛲ 🕰️', text: '町(まち)の ひろばです。大(おお)きい とけいが あります。', en: 'The town square. There is a big clock.' },
        { glyph: '🕰️ 🪆❌', text: 'でも、とけいの にんぎょうが 動(うご)きません。', en: "But the clock's dolls don't move." },
        { glyph: '⬛ ⬛ ⬛', text: 'ふだは ぜんぶ くろくて、同(おな)じです。', en: 'All the signs are black — all the same.' },
        { speaker: 'boy', sprite: 'boy:trouble', glyph: '👦 ❓', text: 'これは 何(なん)ですか？ ぜんぶ 同(おな)じでしょう？', en: "What are these? They're all the same, right?" },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🪧 ✍️', text: 'これは 漢(かん)字(じ)の ふだです。漢(かん)字(じ)を 知(し)って いますか？', en: 'These are kanji signs. Do you know kanji?' },
        { speaker: 'boy', sprite: 'boy:trouble', text: 'かんじ？ 知(し)りません。この 町(まち)には 字(じ)が ありません。', en: "Kanji? I don't know them. There are no letters in this town." },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '😢', text: '字(じ)を 見(み)た ことが ない……？', en: 'He has never seen letters…?' },
        { text: '知(し)る、動(うご)く、同(おな)じ、漢(かん)字(じ)、方(かた)……かんじが ありませんから、わかりません。', en: 'shiru, ugoku, onaji, kanji, kata… no kanji, so nobody understands.' },
        { glyph: '⬛ 👀', text: '……ペタン、ペタン。かげが ふだに はんこを おして います。', en: 'Stamp, stamp. A shadow is stamping the signs.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-2',
      lines: [
        { bg: 'shizuka_square', glyph: '知(し) 動(うご) 同(おな) 漢(かん) 字(じ) 方(かた)', text: 'ひろばの ふだが ひかります。💡', en: 'The signs in the square light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_stamp', sprite: 'mojikui_stamp:normal', text: 'ペタン！ ペタン！ ぜんぶ 同(おな)じ！ 同(おな)じは いいでしょう？ 😈', en: 'Stamp! Stamp! All the same! Same is good, right?' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'はんこの モジクイです！ まねっこです！', en: 'The stamp Mojikui! A copycat!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-2',
      lines: [
        { bg: 'shizuka_square', fx: ['darkclouds'], sprite: 'mojikui_stamp:normal', glyph: '🏛️ 💨', text: 'モジクイは 図(と)書(しょ)館(かん)の 方(ほう)へ にげました。', en: 'The Mojikui fled toward the library.' },
        { fx: ['spring'], sprite: 'none', glyph: '🕰️ 🪆 ✨', text: 'ふだが もどりました！ とけいの にんぎょうも 動(うご)きます！', en: "The signs came back! The clock's dolls are moving too!" },
        { speaker: 'boy', sprite: 'boy:happy', glyph: '👦 ✨', text: 'これが 漢(かん)字(じ)ですか！ すごい！ 書(か)き方(かた)を 知(し)りたいです！', en: 'So these are kanji! Amazing! I want to know how to write them!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '字(じ) ✍️', text: 'いっしょに 書(か)きましょう。これは「字(じ)」です。', en: 'Let\'s write together. This one is "ji" — a letter.' },
        { speaker: 'boy', sprite: 'boy:happy', glyph: '✍️ 字(じ)', text: '字(じ)……！ ぼくの はじめての 字(じ)です！', en: 'Ji…! My very first letter!' },
        { speaker: 'boy', sprite: 'boy:happy', glyph: '📚 ⬜', text: '図(と)書(しょ)館(かん)に 本(ほん)が たくさん あります。でも、本(ほん)にも 字(じ)が ないと 思(おも)います。', en: "There are lots of books in the library. But I think the books have no letters either." },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '📚 👉', text: '図(と)書(しょ)館(かん)へ 行(い)きましょう！', en: "Let's go to the library!" },
      ],
    },
  },
  'moji-5-3': {
    intro: {
      stageId: 'moji-5-3',
      lines: [
        { bg: 'shizuka_street', glyph: '🏛️ 🏦', text: '町(まち)の 中(なか)の 大(おお)きい みちです。図(と)書(しょ)館(かん)と 銀(ぎん)行(こう)が あります。', en: 'A wide street in the middle of town. There is a library and a bank.' },
        { glyph: '🔒 🔒', text: 'でも、ドアに 大(おお)きい かぎが あります。', en: 'But there are big locks on the doors.' },
        { speaker: 'mayor', sprite: 'mayor:trouble', glyph: '🎩 ❓', text: 'わたしは この 町(まち)の 町(ちょう)長(ちょう)です。でも……わたしが 住(す)んで いる 家(いえ)は どこですか？', en: 'I am the mayor of this town. But… where is the house I live in?' },
        { speaker: 'sora', sprite: 'sora:trouble', text: '町(ちょう)長(ちょう)さんが 住(す)んで いる 家(いえ)が わかりませんか？', en: "You don't know the house you live in?" },
        { speaker: 'mayor', sprite: 'mayor:trouble', glyph: '🏠🏠🏠 ⬜', text: 'はい。家(いえ)の 名(な)前(まえ)の ふだに、字(じ)が ありません。😰', en: 'No. The name plates on the houses have no letters.' },
        { text: '図(ず)、館(かん)、銀(ぎん)、町(まち)、住(す)む……かんじが ありませんから、わかりません。', en: 'zu, kan, gin, machi, sumu… no kanji, so nobody understands.' },
        { glyph: '🔑 👀', text: '……ガチャガチャ。大(おお)きい かぎの かげが います。', en: 'Jangle, jangle. A big padlock-shaped shadow is there.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-3',
      lines: [
        { bg: 'shizuka_street', glyph: '図(ず) 館(かん) 銀(ぎん) 町(まち) 住(す)', text: 'みちの ふだが ひかります。💡', en: 'The street signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_key', sprite: 'mojikui_key:normal', text: '図(と)書(しょ)館(かん)の 本(ほん)も、銀(ぎん)行(こう)の お金(かね)も、ぜんぶ わたしの ものです！ 😈', en: 'The library books, the bank money — all of it is mine!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かぎの モジクイです！ ひとりじめです！', en: 'The padlock Mojikui! It keeps everything for itself!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-3',
      lines: [
        { bg: 'shizuka_street', fx: ['darkclouds'], sprite: 'mojikui_key:normal', glyph: '🎻 💨', text: 'モジクイは 音(おん)楽(がく)の ホールへ にげました。', en: 'The Mojikui fled to the concert hall.' },
        { fx: ['spring'], sprite: 'none', glyph: '🔓 ✨', text: 'ふだが もどりました！ 図(と)書(しょ)館(かん)に 入(はい)る ことが できます。', en: 'The signs came back! We can go into the library.' },
        { speaker: 'mayor', sprite: 'mayor:happy', glyph: '🏠 🎩', text: 'ありました！ あれが わたしが 住(す)んで いる 家(いえ)です！', en: "There it is! That's the house I live in!" },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '📖 👾', text: 'この 本(ほん)は 何(なん)ですか？ 小(ちい)さい モジクイの 本(ほん)です。', en: 'What is this book? It is a book about a little Mojikui.' },
        { speaker: 'mayor', sprite: 'mayor:happy', glyph: '📖 👑', text: 'それは 王(おう)さまの 本(ほん)です。ずっと まえ、王(おう)さまは 小(ちい)さい モジクイでした。', en: "That is the King's book. Long ago, the King was a little Mojikui." },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '小(ちい)さい モジクイ……？', en: 'A little Mojikui…?' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🎻 🤫', text: 'あ、音(おん)楽(がく)の ホールも しずかだね。', en: 'Oh, the concert hall is quiet too.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🎻 👉', text: 'ホールへ 行(い)きましょう！', en: "Let's go to the hall!" },
      ],
    },
  },
  'moji-5-4': {
    intro: {
      stageId: 'moji-5-4',
      lines: [
        { bg: 'shizuka_hall', glyph: '🎻 🎹 🥁', text: '音(おん)楽(がく)の ホールです。でも、音(おと)が ありません。', en: 'The concert hall. But there is no sound.' },
        { speaker: 'musician', sprite: 'musician:trouble', glyph: '🎼 ⬜', text: 'がくふに 字(じ)が ありません。どの 歌(うた)を ひきますか？ わかりません……😰', en: "The sheet music has no letters. Which song do I play? I don't know…" },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '👗 ❓', text: 'この 服(ふく)は だれの 服(ふく)ですか？', en: 'Whose clothes are these?' },
        { speaker: 'musician', sprite: 'musician:trouble', text: 'わかりません。きょう 着(き)る 服(ふく)も わかりません。', en: "I don't know. I don't even know the clothes I'm wearing today." },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🎶 💭', text: 'もう 一(いち)度(ど)、音(おん)楽(がく)が 聞(き)きたいね。', en: 'I want to hear music once more.' },
        { text: '度(ど)、服(ふく)、着(き)る、音(おと)、楽(たの)しい、持(も)つ……かんじが ありませんから、わかりません。', en: 'do, fuku, kiru, oto, tanoshii, motsu… no kanji, so nobody understands.' },
        { glyph: '🙉 👀', text: '……しーっ！ ピアノの うしろに、かげが います。', en: 'Shh! A shadow is behind the piano.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-4',
      lines: [
        { bg: 'shizuka_hall', glyph: '度(ど) 服(ふく) 着(き) 音(おと) 楽(たの) 持(も)', text: 'ホールの ふだが ひかります。💡', en: 'The signs in the hall light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_earplug', sprite: 'mojikui_earplug:normal', text: 'しーっ！ 音(おん)楽(がく)は うるさいです！ しずかな 町(まち)が いちばんです！ 😈', en: 'Shh! Music is noisy! A quiet town is best!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'みみせんの モジクイです！ 人(ひと)の 話(はなし)を 聞(き)きません！', en: "The earplug Mojikui! It won't listen to anyone!" },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-4',
      lines: [
        { bg: 'shizuka_hall', fx: ['darkclouds'], sprite: 'mojikui_earplug:normal', glyph: '🌳 💨', text: 'モジクイは こうえんへ にげました。', en: 'The Mojikui fled to the park.' },
        { fx: ['spring'], sprite: 'none', glyph: '🎶 ✨', text: 'ふだが もどりました！ ホールに 音(おん)楽(がく)が もどりました！', en: 'The signs came back! Music came back to the hall!' },
        { speaker: 'musician', sprite: 'musician:happy', glyph: '👗 🎻', text: 'これは わたしが いつも 着(き)る 服(ふく)です！ チェロも 持(も)ちました！', en: "These are the clothes I always wear! And I've got my cello!" },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '👗 🎻 👏', text: 'あかい 服(ふく)を 着(き)て いる 人(ひと)は、チェロが とても じょうずだね！', en: 'The lady in the red dress plays the cello so well!' },
        { speaker: 'musician', sprite: 'musician:happy', glyph: '🎶', text: 'みなさん、もう 一(いち)度(ど) いっしょに ひきましょう！', en: "Everyone, let's play together once more!" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🪟 ❄️', text: 'あれ？ そとは 雪(ゆき)だよ。とても さむい……。', en: "Huh? It's snowing outside. It's freezing…" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🌳 ❄️', text: 'こうえんに 雪(ゆき)が たくさん あります！ 行(い)きましょう！', en: "There's lots of snow in the park! Let's go!" },
      ],
    },
  },
  'moji-5-5': {
    intro: {
      stageId: 'moji-5-5',
      lines: [
        { bg: 'shizuka_park', glyph: '🌳 ❄️', text: 'こうえんです。雪(ゆき)が たくさん あります。とても さむいです。', en: 'The park. There is a lot of snow. It is very cold.' },
        { speaker: 'gardener', sprite: 'gardener:trouble', glyph: '🌸 💭', text: '春(はる)の とき、ここは 花(はな)で きれいです。でも、春(はる)が 来(き)ません……。', en: "In spring it's beautiful here with flowers. But spring doesn't come…" },
        { speaker: 'gardener', sprite: 'gardener:trouble', glyph: '🌸 ☀️ 🍁 ⛄', text: '春(はる)、夏(なつ)、秋(あき)、冬(ふゆ)……きせつの ふだが ありません。ずっと 冬(ふゆ)です。😰', en: 'Spring, summer, autumn, winter… the season signs are gone. It is winter forever.' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🍲 ❓', text: '食(しょく)堂(どう)で あたたかい ものが 食(た)べたいです。でも、道(みち)が わかりません。', en: "I want to eat something warm at the canteen. But I don't know the way." },
        { text: '春(はる)、夏(なつ)、秋(あき)、冬(ふゆ)、道(みち)、堂(どう)……かんじが ありませんから、わかりません。', en: 'haru, natsu, aki, fuyu, michi, dou… no kanji, so nobody understands.' },
        { glyph: '⛄ 👀', text: '……ヒュー。大(おお)きい ゆきだるまの かげが います。', en: 'Whoosh… A big snowman-shaped shadow is there.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-5',
      lines: [
        { bg: 'shizuka_park', glyph: '春(はる) 夏(なつ) 秋(あき) 冬(ふゆ) 道(みち) 堂(どう)', text: 'こうえんの ふだが ひかります。💡', en: 'The signs in the park light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_snowman', sprite: 'mojikui_snowman:normal', text: '春(はる)も 夏(なつ)も 秋(あき)も いりません！ ずっと 冬(ふゆ)が いいです！ ❄️😈', en: 'No spring, no summer, no autumn! Winter forever is best!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ゆきだるまの モジクイです！ つめたいです！', en: 'The snowman Mojikui! So cold!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-5',
      lines: [
        { bg: 'shizuka_park', fx: ['darkclouds'], sprite: 'mojikui_snowman:normal', glyph: '🏥 💨', text: 'モジクイは 病(びょう)院(いん)の 方(ほう)へ にげました。', en: 'The Mojikui fled toward the hospital.' },
        { fx: ['spring'], sprite: 'none', glyph: '🌸 ☀️ 🍁 ⛄ ✨', text: 'ふだが もどりました！ 春(はる)が 来(き)ました！', en: 'The signs came back! Spring has come!' },
        { speaker: 'gardener', sprite: 'gardener:happy', glyph: '🌸 😊', text: 'ありがとう！ 春(はる)、夏(なつ)、秋(あき)、冬(ふゆ)……きせつが もどりました！', en: 'Thank you! Spring, summer, autumn, winter… the seasons are back!' },
        { speaker: 'gardener', sprite: 'gardener:happy', glyph: '🛤️ 🍲', text: 'この 道(みち)を まっすぐ 行(い)くと、食(しょく)堂(どう)が あります。あたたかい スープが ありますよ。', en: "Go straight along this path and you'll find the canteen. They have warm soup." },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🤧', text: '……はっくしょん！', en: 'Achoo!' },
        { speaker: 'hana', sprite: 'hana:trouble', text: 'ソラ、だいじょうぶ？', en: 'Sora, are you OK?' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🤒', text: 'あたまが いたい……。さむい……。', en: "My head hurts… I'm cold…" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏥 👉', text: 'ソラは かぜです！ 食(しょく)堂(どう)の となりに 病(びょう)院(いん)が あります。行(い)きましょう！', en: "Sora has a cold! There's a hospital next to the canteen. Let's go!" },
      ],
    },
  },
  'moji-5-6': {
    intro: {
      stageId: 'moji-5-6',
      lines: [
        { bg: 'shizuka_hospital', glyph: '🏥', text: '白(しろ)い 建(たて)物(もの)です。病(びょう)院(いん)です。', en: 'A white building. It is a hospital.' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🤒 🌡️', text: 'ねつが あります……。', en: 'I have a fever…' },
        { speaker: 'nurse', sprite: 'nurse:trouble', glyph: '💊 ⬜', text: 'くすりの ふだに 字(じ)が ありません。どの くすりですか？ わかりません。😰', en: "The medicine labels have no letters. Which medicine is it? I don't know." },
        { speaker: 'nurse', sprite: 'nurse:trouble', glyph: '🛗 ❌', text: 'エレベーターも 動(うご)きません。お医(い)者(しゃ)さんは 2かいに います。', en: "And the elevator won't move. The doctor is on the second floor." },
        { text: '建(た)てる、病(びょう)、院(いん)、体(からだ)、運(うん)、乗(の)る……かんじが ありませんから、わかりません。', en: 'tateru, byou, in, karada, un, noru… no kanji, so nobody understands.' },
        { glyph: '🤧 👀', text: '……ハックション！ くしゃみの かげが います。', en: 'Achoo! A sneezing shadow is there.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-6',
      lines: [
        { bg: 'shizuka_hospital', glyph: '建(た) 病(びょう) 院(いん) 体(からだ) 運(うん) 乗(の)', text: '病(びょう)院(いん)の ふだが ひかります。💡', en: 'The hospital signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_sneeze', sprite: 'mojikui_sneeze:normal', text: 'ハックション！ みんな かぜを ひいて ください！ ハックション！ 😈', en: 'Achoo! Everyone, catch a cold! Achoo!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'くしゃみの モジクイです！ かぜひきです！', en: 'The sneeze Mojikui! Always catching colds!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-6',
      lines: [
        { bg: 'shizuka_hospital', fx: ['darkclouds'], sprite: 'mojikui_sneeze:normal', glyph: '🏠 💨', text: 'モジクイは 小(ちい)さい 家(いえ)へ にげました。', en: 'The Mojikui fled to a little house.' },
        { fx: ['heal'], sprite: 'none', glyph: '💊 ✨', text: 'ふだが もどりました！', en: 'The labels came back!' },
        { speaker: 'nurse', sprite: 'nurse:happy', glyph: '💊', text: 'この くすりを 飲(の)んで ください。', en: 'Please take this medicine.' },
        { speaker: 'nurse', sprite: 'nurse:happy', glyph: '🛗 ⬆️', text: 'エレベーターに 乗(の)ると、お医(い)者(しゃ)さんの 部(へ)屋(や)へ 行(い)きます。', en: "Take the elevator and you'll get to the doctor's room." },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '💪 ✨', text: 'ありがとう！ 体(からだ)が 元(げん)気(き)に なった！', en: 'Thank you! I feel well again!' },
        { speaker: 'nurse', sprite: 'nurse:happy', text: '体(からだ)の ぐあいが 悪(わる)い ときは、すぐ 病(びょう)院(いん)へ 来(き)て ください。毎(まい)日(にち) 運(うん)動(どう)も して くださいね。', en: "When you feel unwell, come to the hospital right away. And exercise every day." },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏠 👀', text: 'あの 小(ちい)さい 家(いえ)に、モジクイが 入(はい)りました！', en: 'The Mojikui went into that little house!' },
      ],
    },
  },
  'moji-5-7': {
    intro: {
      stageId: 'moji-5-7',
      lines: [
        { bg: 'shizuka_house', glyph: '🏠', text: '小(ちい)さい 家(いえ)です。男(おとこ)の 子(こ)が ふたり います。', en: 'A little house. There are two boys.' },
        { speaker: 'otouto', sprite: 'otouto:trouble', glyph: '🧒 ❓', text: 'あなたは だれですか？', en: 'Who are you?' },
        { speaker: 'ani', sprite: 'ani:trouble', glyph: '👦 ❓', text: 'わからない……。きみは だれ？', en: "I don't know… Who are you?" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🏠 👦 🧒', text: 'ふたりは 同(おな)じ 家(いえ)に 住(す)んで いるでしょう？', en: 'You two live in the same house, right?' },
        { speaker: 'ani', sprite: 'ani:trouble', glyph: '📖 ⬜', text: 'はい。でも、名(な)前(まえ)を わすれました。アルバムの 名(な)前(まえ)も ありません。', en: "Yes. But we've forgotten our names. The names in the album are gone too." },
        { text: '家(いえ)、内(うち)、族(ぞく)、兄(あに)、弟(おとうと)……かんじが ありませんから、わかりません。', en: 'ie, uchi, zoku, ani, otouto… no kanji, so nobody understands.' },
        { glyph: '📖 👀', text: '……パタン、パタン。アルバムの 中(なか)に、かげが います。', en: 'Flap, flap. A shadow is inside the album.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-7',
      lines: [
        { bg: 'shizuka_house', glyph: '家(いえ) 内(うち) 族(ぞく) 兄(あに) 弟(おとうと)', text: '家(いえ)の ふだが ひかります。💡', en: 'The house signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_album', sprite: 'mojikui_album:normal', text: '名(な)前(まえ)も かおも、わすれても いいでしょう？ ぜんぶ わすれて ください。😈', en: "Names and faces — it's fine to forget them, right? Forget them all." },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'アルバムの モジクイです！ わすれっぽいです！', en: 'The album Mojikui! So forgetful!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-7',
      lines: [
        { bg: 'shizuka_house', fx: ['darkclouds'], sprite: 'mojikui_album:normal', glyph: '🌊 💨', text: 'モジクイは 海(うみ)へ にげました。', en: 'The Mojikui fled to the sea.' },
        { fx: ['spring'], sprite: 'none', glyph: '📖 ✨', text: 'アルバムの 名(な)前(まえ)が もどりました！', en: 'The names in the album came back!' },
        { speaker: 'otouto', sprite: 'otouto:happy', glyph: '🧒 ➡️ 👦', text: '兄(にい)さん！', en: 'Big brother!' },
        { speaker: 'ani', sprite: 'ani:happy', glyph: '👦 🤗 🧒', text: '弟(おとうと)！ よかった！', en: 'Little brother! Thank goodness!' },
        { speaker: 'otouto', sprite: 'otouto:happy', glyph: '📖 👦', text: '兄(にい)さんは いつも ぼくに 本(ほん)を 読(よ)んで くれました。これは 兄(にい)さんが くれた 本(ほん)です！', en: 'My brother always read books to me. This is the book he gave me!' },
        { speaker: 'ani', sprite: 'ani:happy', glyph: '✉️', text: 'あ、父(ちち)の 手(て)紙(がみ)だ。「家(か)内(ない)と 子(こ)どもたちへ」……。', en: 'Oh, a letter from Dad. "To my wife and the children"…' },
        { speaker: 'ani', sprite: 'ani:happy', glyph: '👨‍👩‍👦‍👦 ❤️', text: '父(ちち)と 母(はは)と ぼくたちは、家(か)族(ぞく)だ！', en: 'Dad, Mom and us — we are a family!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🌊 👉', text: '海(うみ)へ 行(い)きましょう！', en: "Let's go to the sea!" },
      ],
    },
  },
  'moji-5-8': {
    intro: {
      stageId: 'moji-5-8',
      lines: [
        { bg: 'shizuka_sea', glyph: '🌊 🕰️', text: '海(うみ)の ちかくの 時(と)計(けい)の 店(みせ)です。', en: 'A clock shop near the sea.' },
        { glyph: '🕰️ ⬜ ❌', text: '大(おお)きい 時(と)計(けい)に 字(じ)が ありません。時(と)計(けい)が 動(うご)きません。', en: "The big clock has no numbers. It doesn't move." },
        { speaker: 'ane', sprite: 'ane:trouble', glyph: '👧 🏯', text: '妹(いもうと)が しろの 奥(おく)へ 行(い)きました。まだ かえりません……。😢', en: "My little sister went deep into the castle. She still hasn't come back…" },
        { speaker: 'ane', sprite: 'ane:trouble', glyph: '👧 💬 👑', text: '妹(いもうと)は「王(おう)さまと 話(はな)します」と 言(い)いました。', en: 'She said, "I\'m going to talk with the King."' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🏯 👉', text: 'わたしたちも しろへ 行(い)きます！ 妹(いもうと)さんに 会(あ)いに 行(い)きましょう！', en: "We're going to the castle too! Let's go and find your sister!" },
        { text: '奥(おく)、姉(あね)、妹(いもうと)、海(うみ)、計(けい)……かんじが ありませんから、わかりません。', en: 'oku, ane, imouto, umi, kei… no kanji, so nobody understands.' },
        { glyph: '🌊 👀', text: '……ザブーン！ 大(おお)きい なみの かげが います。', en: 'Splash! A big wave-shaped shadow is there.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-8',
      lines: [
        { bg: 'shizuka_sea', glyph: '奥(おく) 姉(あね) 妹(いもうと) 海(うみ) 計(けい)', text: '海(うみ)の ふだが ひかります。💡', en: 'The signs by the sea light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_wave', sprite: 'mojikui_wave:normal', text: 'ザブーン！ 時(と)計(けい)も 字(じ)も、ぜんぶ 海(うみ)の 中(なか)です！ 😈', en: 'Splash! Clocks, letters — all into the sea!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'なみの モジクイです！ きぶんやです！', en: 'The wave Mojikui! So moody!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-8',
      lines: [
        { bg: 'shizuka_sea', fx: ['darkclouds'], sprite: 'mojikui_wave:normal', glyph: '🏯 💨', text: 'モジクイは しろへ にげました。', en: 'The Mojikui fled to the castle.' },
        { fx: ['spring'], sprite: 'none', glyph: '🕰️ ✨', text: 'ふだが もどりました！', en: 'The signs came back!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🔧 🕰️', text: '時(と)計(けい)を なおしましょうか。', en: 'Shall I fix the clock?' },
        { sprite: 'none', glyph: '🕰️ 🔧 ✨', text: 'カチ、カチ……時(と)計(けい)が 動(うご)きました！', en: 'Tick, tock… the clock is moving!' },
        { speaker: 'ane', sprite: 'ane:happy', glyph: '🤖 🔧 🕰️', text: 'ネクマックスさんに 時(と)計(けい)を なおして もらいました！ ありがとう！', en: 'Nexmax fixed the clock for me! Thank you!' },
        { speaker: 'ane', sprite: 'ane:happy', glyph: '🐚 👧', text: 'この かいがらを 妹(いもうと)に あげて ください。', en: 'Please give this seashell to my sister.' },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '🏯 👉', text: 'はい！ しろへ 行(い)きましょう！', en: "OK! Let's go to the castle!" },
      ],
    },
  },
  'moji-5-9': {
    intro: {
      stageId: 'moji-5-9',
      lines: [
        { bg: 'shizuka_castle', fx: ['darkclouds'], glyph: '🏯 🚪🚪🚪', text: 'しろの 中(なか)です。部(へ)屋(や)が たくさん あります。', en: 'Inside the castle. There are many rooms.' },
        { glyph: '🪟 ⬛', text: '窓(まど)に くろい カーテンが あります。とても くらいです。', en: 'Black curtains cover the windows. It is very dark.' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '😨', text: 'くらくて、こわい……。', en: "It's dark and scary…" },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🚪 💪', text: 'この ドアを おしても、動(うご)かない！', en: "I push this door, but it won't move!" },
        { speaker: 'imouto', sprite: 'none', glyph: '🚪 💬', text: '……だれか いますか？', en: '…Is anyone there?' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'この 部(へ)屋(や)に だれか います！', en: 'Someone is in this room!' },
        { text: '部(ぶ)、屋(や)、室(しつ)、窓(まど)、開(あ)ける、閉(し)める……かんじが ありませんから、わかりません。', en: 'bu, ya, shitsu, mado, akeru, shimeru… no kanji, so nobody understands.' },
        { glyph: '🪟 👀', text: '……ヒラヒラ。カーテンの かげが います。', en: 'Flutter, flutter. A curtain-shaped shadow is there.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-9',
      lines: [
        { bg: 'shizuka_castle', glyph: '部(ぶ) 屋(や) 室(しつ) 窓(まど) 開(あ) 閉(し)', text: 'しろの ふだが ひかります。💡', en: 'The castle signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_curtain', sprite: 'mojikui_curtain:normal', text: '見(み)ないで ください！ 窓(まど)を 開(あ)けないで ください！ はずかしいです！ 😈', en: "Don't look! Don't open the windows! I'm so embarrassed!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'カーテンの モジクイです！ てれやです！', en: 'The curtain Mojikui! So bashful!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-9',
      lines: [
        { bg: 'shizuka_castle', fx: ['darkclouds'], sprite: 'mojikui_curtain:normal', glyph: '⬆️ 💨', text: 'モジクイは しろの いちばん 上(うえ)へ にげました。', en: 'The Mojikui fled to the very top of the castle.' },
        { fx: ['spring'], sprite: 'none', glyph: '🪟 🌙 ✨', text: '窓(まど)を 開(あ)けたら、月(つき)の あかりが 入(はい)りました！', en: 'When we opened the windows, moonlight came in!' },
        { glyph: '🏫 👧', text: 'ドアの 中(なか)は 教(きょう)室(しつ)です。女(おんな)の 子(こ)が います。', en: 'Behind the door is a classroom. There is a girl inside.' },
        { speaker: 'imouto', sprite: 'imouto:happy', glyph: '👧 😊', text: 'ありがとう！ わたしは 時(と)計(けい)の 店(みせ)の 妹(いもうと)です。', en: "Thank you! I'm the little sister from the clock shop." },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '🐚', text: 'これ、お姉(ねえ)さんから。どうぞ。', en: 'This is from your sister. Here.' },
        { speaker: 'imouto', sprite: 'imouto:happy', glyph: '🐚 ❤️', text: '姉(あね)の かいがら！ ありがとう！', en: "My sister's seashell! Thank you!" },
        { speaker: 'imouto', sprite: 'imouto:trouble', glyph: '🏫 🪑', text: 'この 教(きょう)室(しつ)で、王(おう)さまは いつも ひとりでした。', en: 'The King was always alone in this classroom.' },
        { speaker: 'imouto', sprite: 'imouto:trouble', glyph: '👑 ❓ ✍️', text: '王(おう)さまは 字(じ)が わかりません。だから、字(じ)を 食(た)べました。わたしは そう 思(おも)います。', en: "The King doesn't understand letters. That's why he ate them. That's what I think." },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '王(おう)さまは 字(じ)が わかりません……？', en: "The King doesn't understand letters…?" },
        { speaker: 'imouto', sprite: 'imouto:happy', glyph: '⬆️ 👑', text: '王(おう)さまは いちばん 上(うえ)の 部(へ)屋(や)に います。', en: 'The King is in the room at the very top.' },
      ],
    },
  },
  'moji-5-10': {
    intro: {
      stageId: 'moji-5-10',
      lines: [
        { bg: 'shizuka_castle_top', fx: ['darkclouds'], glyph: '🏯 🌩️', text: 'しろの いちばん 上(うえ)です。天(てん)気(き)は ずっと 悪(わる)いです。', en: 'The very top of the castle. The weather has been bad for a long time.' },
        { glyph: '📖 ⬜ 🎶❌', text: '大(おお)きい 歌(うた)の 本(ほん)が あります。でも、字(じ)が ありません。', en: 'There is a big song book. But it has no letters.' },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '🚪 👑', text: 'また 来(き)ましたね！ 王(おう)さまの 部(へ)屋(や)に 入(はい)らないで ください！', en: "You again! Don't go into the King's room!" },
        { speaker: 'sora', sprite: 'sora:normal', text: 'わたしたちは 王(おう)さまと 話(はな)したいです！', en: 'We want to talk with the King!' },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👑 💬', text: '王(おう)さまは 言(い)いました。「もし 字(じ)が なかったら、みんな 同(おな)じです」。', en: 'The King said, "If there were no letters, everyone would be the same."' },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: '「字(じ)の 意(い)味(み)が わからない 人(ひと)も、かなしく ありません」。わたしも そう 思(おも)います！', en: '"No one would be sad about not knowing what letters mean." I think so too!' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🤔', text: '……もし 字(じ)が なかったら……？', en: '…If there were no letters…?' },
        { text: '歌(うた)、意(い)、味(あじ)、天(てん)、考(かんが)える……かんじが ありませんから、わかりません。', en: 'uta, i, aji, ten, kangaeru… no kanji, so nobody understands.' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-5-10',
      lines: [
        { bg: 'shizuka_castle_top', glyph: '歌(うた) 意(い) 味(み) 天(てん) 考(かんが)', text: 'しろの ふだが ひかります。💡', en: 'The castle signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: '王(おう)さまは わたしが まもります！ 😈', en: 'I will protect the King!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🤔 ✍️', text: '大(おお)モジクイ、考(かんが)えて ください。字(じ)が なかったら、歌(うた)も、名(な)前(まえ)も、手(て)紙(がみ)も ありません！', en: 'Great Mojikui, think about it. Without letters there would be no songs, no names, no letters to send!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-5-10',
      lines: [
        { bg: 'shizuka_castle_top', fx: ['darkclouds'], sprite: 'mojikui_boss:normal', glyph: '👾 💨', text: '大(おお)モジクイは にげます。……でも、止(と)まりました。', en: 'The Great Mojikui starts to flee… but stops.' },
        { fx: ['sparkle'], glyph: '🎶 ✨', text: 'ふだが もどりました！ 歌(うた)の 本(ほん)にも 字(じ)が もどりました！', en: 'The signs came back! The letters came back to the song book too!' },
        { fx: ['spring'], glyph: '🏘️ 🎶', text: '町(まち)の 人(ひと)たちが、歌(うた)を 歌(うた)って います。', en: 'The townspeople are singing.' },
        { glyph: '☁️ ➡️ ⭐', text: '天(てん)気(き)が よく なりました。ほしが きれいです。', en: 'The weather has cleared. The stars are beautiful.' },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '🎶 👑', text: '……この 歌(うた)。王(おう)さまが 好(す)きな 歌(うた)です。', en: "…This song. It's the King's favourite." },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👾 ✍️ ❌', text: '王(おう)さまは 小(ちい)さい とき、字(じ)が わかりませんでした。だれも おしえて くれませんでした。', en: 'When the King was small, he did not understand letters. Nobody taught him.' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '😢', text: 'ずっと ひとりで、さびしかったでしょう……。', en: 'Always alone… he must have been so lonely.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '💡', text: '王(おう)さまに 会(あ)います。ぼくに 考(かんが)えが あります！', en: 'I will meet the King. I have an idea!' },
        { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '🚪 ✨', text: '……どうぞ。王(おう)さまを おねがいします。', en: '…Go on. Please, take care of the King.' },
      ],
    },
  },
};

/**
 * 5章 11話 まとめの ボス（docs/design/20 §3）: しろの いちばん 上の 王の 部屋で モジクイの 王。
 * はじめに 王が「あなたは どう 思いますか？」と 聞き、プレイヤーが こたえる（どちらも 同じ 所へ もどる）。
 * 勝つと 王は 小さく なり、はじめての 字「友」を 書く。字の ない せかいに 朝が 来て、ネクマックスが ★4 に なる。
 * さいごに 小さい かげが スマホの 中へ（6章「ネットに 逃げた モジクイ」への つなぎ）。
 */
export const MOJI5_FINALE: FinaleScript = {
  intro: {
    stageId: 'moji-5-boss',
    lines: [
      { bg: 'shizuka_throne', fx: ['darkclouds'], glyph: '👑 🌑', text: '王(おう)さまの 部(へ)屋(や)です。', en: "The King's room." },
      { glyph: '📚 🪧 📅 🫧', text: 'モジクイが 食(た)べた 字(じ)が、ぜんぶ ここに あります。', en: 'All the letters the Mojikui ate are here.' },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:normal', text: 'よく 来(き)ましたね。字(じ)を 書(か)く 人(ひと)たち。', en: 'So you have come — you who write letters.' },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:normal', glyph: '🌍 ⬜', text: 'もし 字(じ)が なかったら、みんな 同(おな)じです。わからない 人(ひと)も いません。', en: 'If there were no letters, everyone would be the same. No one would be left not understanding.' },
      {
        speaker: 'mojikui_king',
        sprite: 'mojikui_king:normal',
        glyph: '👤 ❓',
        text: 'それが いちばん いいと 思(おも)いませんか？ あなたは どう 思(おも)いますか？',
        en: "Don't you think that is best? What do you think?",
        choices: [
          { label: '字(じ)が あると、たのしいです。', next: 'fun' },
          { label: 'わたしも、はじめは わかりませんでした。', next: 'me' },
        ],
      },
      // The button the player taps is what the player says; the King answers it.
      { label: 'fun', speaker: 'mojikui_king', sprite: 'mojikui_king:normal', glyph: '✍️ 😊 ❓', text: '字(じ)が あると、たのしい……？ わたしは たのしく ありませんでした。', en: 'Letters make things fun…? They were never fun for me.', goto: 'join' },
      { label: 'me', speaker: 'mojikui_king', sprite: 'mojikui_king:normal', glyph: '🔰 ❓', text: 'あなたも、はじめは わからなかった……？', en: "You didn't understand at first either…?" },
      { label: 'join', speaker: 'mojikui_king', sprite: 'mojikui_king:normal', text: '……。では、字(じ)の 力(ちから)を 見(み)せて ください。', en: '…Then show me the power of letters.' },
      { speaker: 'hana', sprite: 'hana:normal', glyph: '👧 👧 🤖', text: 'みんなで 書(か)いた 字(じ)です。まけません！', en: "These are letters we all wrote. We won't lose!" },
      FIGHT,
    ],
  },
  outro: {
    stageId: 'moji-5-boss',
    lines: [
      { bg: 'shizuka_throne', fx: ['sparkle'], glyph: '🫧💥 ✨✨✨', text: 'パチン！ 字(じ)が せかいへ もどります！', en: 'Pop! The letters fly back to the world!' },
      { sprite: 'mojikui_king:small', glyph: '👑 ➡️ 🫧', text: '王(おう)さまが、小(ちい)さく なりました。', en: 'The King became small.' },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:small', text: 'わたしは……字(じ)が わかりませんでした。', en: "I… couldn't understand letters." },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:small', glyph: '👥💬 👾', text: 'みんなは 字(じ)で 話(はな)して いました。わたしは ずっと ひとりでした。', en: 'Everyone talked in letters. I was always alone.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '👤 ✍️', text: 'ぼくの ともだちも、はじめは 字(じ)が わかりませんでした。', en: "My friend here didn't understand letters at first either." },
      { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '✍️ ✍️ ✍️ ➡️ 💡', text: 'でも、毎(まい)日(にち) 書(か)きました。そして、たくさん わかりました！', en: 'But they wrote every day. And now they understand so much!' },
      { speaker: 'sora', sprite: 'sora:happy', glyph: '✉️ 👧', text: 'わたしも、手(て)紙(がみ)を 書(か)いたら、ともだちが できたよ！', en: 'When I wrote a letter, I made a friend!' },
      { speaker: 'hana', sprite: 'hana:happy', glyph: '📝 🍜', text: 'わたしも、メニューの 字(じ)を 書(か)いたら、みんなが 来(き)て くれたよ！', en: 'When I wrote the menu, everyone came to eat!' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '✍️ 👑', text: '王(おう)さまも、いっしょに 書(か)きましょう！', en: "King, let's write together!" },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:small', glyph: '🥺', text: '……わたしも 書(か)いても いいですか？', en: '…May I write too?' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '友(とも)', text: 'はい！ この 字(じ)を 書(か)いて ください。「友(とも)だち」の「友(とも)」です。', en: 'Of course! Please write this letter. It is "tomo" — as in tomodachi, friend.' },
      { sprite: 'mojikui_king:happy', glyph: '✍️ 友(とも) ✨', text: '王(おう)さまは、ゆっくり、ゆっくり 書(か)きました。', en: 'Slowly, very slowly, the King wrote.' },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:happy', text: '友(とも)……。わたしの はじめての 字(じ)です！', en: 'Tomo… My very first letter!' },
      { bg: 'shizuka_dawn', fx: ['spring'], sprite: 'mojikui_king:happy', glyph: '🌅 ✨', text: '夜(よる)が 終(お)わりました。字(じ)の ない せかいに、はじめて 朝(あさ)が 来(き)ました！', en: 'The night is over. For the first time, morning has come to the world without letters!' },
      { glyph: '🏘️ 🪧 🎶 ✨', text: '町(まち)の ふだにも、本(ほん)にも、歌(うた)にも、字(じ)が もどりました。', en: 'Letters came back to the town signs, the books and the songs.' },
      { fx: ['sparkle'], sprite: 'nexmax:think', glyph: '🤖 💛', text: '……あっ！ ネクマックスの むねが、金(きん)いろに ひかります。', en: "…Oh! Nexmax's chest is shining gold." },
      { fx: ['sparkle'], sprite: 'nexmax:star4', glyph: '★★★★', text: 'あなたが 書(か)いた 220字(じ)の ちからで、ネクマックスが ★4に なりました！', en: 'With the power of the 220 letters you wrote, Nexmax became ★4!' },
      { speaker: 'nexmax', sprite: 'nexmax:star4', text: 'みんなが 書(か)いた 字(じ)が、ぼくの ちからです！ ありがとう！', en: 'The letters everyone wrote are my power! Thank you!' },
      { speaker: 'mojikui_king', sprite: 'mojikui_king:happy', glyph: '📚 ✍️', text: 'わたしは この 町(まち)で、字(じ)を 勉(べん)強(きょう)します。また 来(き)て くださいね。', en: 'I will study letters in this town. Please come again.' },
      { fx: ['darkclouds'], sprite: 'nexmax:think', glyph: '📱 👾 💨', text: '……その とき、小(ちい)さい かげが、スマホの 中(なか)へ 入(はい)りました。', en: 'Just then, a tiny shadow slipped into a smartphone.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '📱 ❓', text: 'あれは……？ まだ モジクイが います！', en: 'What was that…? There is still a Mojikui out there!' },
    ],
  },
};
