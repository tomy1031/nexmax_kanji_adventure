import type { CastMember } from '../../types/novel';
import type { EpisodeScript } from './moji1';
import type { FinaleScript } from '../mojiFinale';
import { NANIWA_NEXMAX } from './naniwaCast';
import { MOJI2_CAST } from './moji2';
import { MOJI3_CAST } from './moji3';

/**
 * 4章「町を 回る」の 脚本（docs/design/15）。
 *
 * 3章の まとめの ボスの あと、大モジクイは 電車で となりの 大きい 町 京(みやこ)タウンへ 逃げた。
 * 町の 名前も 食べられて いて、5話で「京」を 書くまで 音だけ。決まりは 1〜3章と 同じ:
 *  - 絵が 主役。意味は 絵文字と 大きな 字（glyph）で 見せる。英語は EN ボタンだけ（`en`）。
 *  - 漢字は 1字ずつ ふりがな記法。まだ 書いて いない 漢字は 音（かな）で 出る（KanjiBackText）。
 *  - 文型は 20課まで。1話に 1つ: て形で つなぐ（16）・ない形（17）・辞書形（18）・た形（19）・ふつうの 言い方（20）。
 *    受け身・可能形・ば・なら・と（条件）・たら・意向形・かもしれません・〜ていく は 使わない（docs/constraints.md）。
 *  - 5話から ともだちどうしは ふつうの 言い方。町の 人と ネクマックスは です・ます。
 * ソラ（2章）は 1話で 手紙を 読んで 来る。ハナ（3章）と 3人で 町を 回る。
 */

const folk = (name: string) => `img/chara/naniwa/folk_${name}.webp`;
const enemy = (id: string, name: string): CastMember => ({ id, name, color: '#5a2d8c', sprites: { normal: `img/battle/${id}.webp` } });
const townsperson = (id: string, name: string, color: string): CastMember => ({
  id,
  name,
  color,
  sprites: { normal: folk(`${id}_trouble`), trouble: folk(`${id}_trouble`), happy: folk(`${id}_happy`) },
});
/** The friends from 2章 and 3章: the same people, with the same pictures. */
const friend = (cast: CastMember[], id: string): CastMember => cast.find((c) => c.id === id)!;

export const MOJI4_CAST: CastMember[] = [
  NANIWA_NEXMAX,
  friend(MOJI2_CAST, 'sora'),
  friend(MOJI3_CAST, 'hana'),
  enemy('mojikui_bulb', 'でんきゅうの モジクイ'),
  enemy('mojikui_escalator', 'エスカレーターの モジクイ'),
  enemy('mojikui_vending', 'じはんきの モジクイ'),
  enemy('mojikui_mole', 'ちかてつの モジクイ'),
  enemy('mojikui_map', 'ちずの モジクイ'),
  enemy('mojikui_mouth', 'おおぐちの モジクイ'),
  enemy('mojikui_telescope', 'ぼうえんきょうの モジクイ'),
  { id: 'mojikui_boss', name: '大(おお)モジクイ', color: '#3b1a66', sprites: { normal: 'img/battle/mojikui_boss.webp' } },
  townsperson('guide', 'えきの あんないの ひと', '#b8323a'),
  townsperson('granny', 'おばあさん', '#8a6aa8'),
  townsperson('konbini', 'コンビニの てんいん', '#2f9a5a'),
  townsperson('conductor', 'ちかてつの しゃしょう', '#2f4f8f'),
  townsperson('yatai', 'やたいの ひと', '#a0522d'),
];

const WRITE = { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" } as const;
const FIGHT = { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" } as const;

export const MOJI4_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-4-1': {
    intro: {
      stageId: 'moji-4-1',
      lines: [
        { bg: 'miyako_station', fx: ['darkclouds'], glyph: '🚃 🏙️', text: '電(でん)車(しゃ)が、となりの 大(おお)きい 町(まち)に つきました。', en: 'The train arrives at the big city next door.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ここは 京(みやこ)タウンです。とても 大(おお)きい 町(まち)です。', en: 'This is Miyako Town. A very big city.' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🌑 😨', text: 'えきは くらくて、ひろくて、こわいです……。', en: 'The station is dark and huge and scary…' },
        { speaker: 'guide', sprite: 'guide:trouble', text: 'あかりの ふだの 字(じ)が ありません。でんきが つきません……😰', en: "The letters on the light signs are gone. The lights won't come on…" },
        { text: '明(あか)るい、暗(くら)い、広(ひろ)い、多(おお)い、少(すく)ない……かんじが ありませんから、わかりません。', en: 'akarui, kurai, hiroi, ooi, sukunai… no kanji, so nobody understands.' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '👧 👋 ✉️', text: 'ネクマックス！ 手(て)紙(がみ)を 読(よ)んで、ふねと 電(でん)車(しゃ)で 来(き)ました！', en: 'Nexmax! I read your letter and came by boat and train!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ソラ！ ようこそ！', en: 'Sora! Welcome!' },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '👧 🤝 👧', text: 'はじめまして。花(はな)です。', en: "Nice to meet you. I'm Hana." },
        { speaker: 'sora', sprite: 'sora:normal', text: 'ソラです。どうぞ よろしく！', en: "I'm Sora. Pleased to meet you!" },
        { glyph: '💡 👀', text: '……チカチカ。でんきゅうの 中(なか)で、あかりを 食(た)べる かげが……。', en: 'Flicker, flicker. Inside a light bulb, a shadow is eating the light…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-1',
      lines: [
        { bg: 'miyako_station', glyph: '明(あか) 暗(くら) 広(ひろ) 多(おお) 少(すく)', text: 'えきの ふだが ひかります。💡', en: 'The station signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_bulb', sprite: 'mojikui_bulb:normal', text: 'あかりは いりません！ くらい ほうが 好(す)きです！ 😈', en: 'No lights! I like it dark!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'でんきゅうの モジクイです！', en: 'The light-bulb Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-1',
      lines: [
        { bg: 'miyako_station', fx: ['darkclouds'], sprite: 'mojikui_bulb:normal', glyph: '↗️ 💨', text: 'モジクイは ながい エスカレーターの ほうへ にげました。', en: 'The Mojikui fled toward the long escalator.' },
        { fx: ['spring'], sprite: 'none', glyph: '💡💡💡 ✨', text: 'あかりが つきました！ えきが 明(あか)るいです！', en: 'The lights came on! The station is bright!' },
        { speaker: 'guide', sprite: 'guide:happy', glyph: '🏢 ✨', text: 'この えきは 広(ひろ)くて、明(あか)るくて、きれいです。', en: 'This station is big, bright and beautiful.' },
        { speaker: 'guide', sprite: 'guide:happy', glyph: '🏙️ 🔄', text: 'この 町(まち)を 回(まわ)って、字(じ)を さがして ください。', en: 'Please go round the town and look for the letters.' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '👧 👧 🤖', text: 'みんなで いっしょに 回(まわ)りましょう！', en: "Let's all go round together!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '↗️ 👉', text: 'まず、エスカレーターへ！', en: 'First, the escalator!' },
      ],
    },
  },
  'moji-4-2': {
    intro: {
      stageId: 'moji-4-2',
      lines: [
        { bg: 'miyako_escalator', glyph: '↗️ ↗️', text: 'ながい ながい エスカレーターです。', en: 'A very, very long escalator.' },
        { glyph: '🪧❓ 🏃🏃', text: 'ふだの 字(じ)が ありません。みんな はしって います。', en: 'The signs have lost their letters. Everyone is running.' },
        { speaker: 'granny', sprite: 'granny:trouble', glyph: '🧳 💦', text: 'にもつが 重(おも)いです。エスカレーターは はやくて、こわいです……😰', en: 'My bags are heavy. The escalator is fast and scary…' },
        { glyph: '⬆️⬇️ 🌀', text: 'エスカレーターが、上(うえ)へ 行(い)ったり 下(した)へ 行(い)ったり します。', en: 'The escalator keeps going up and down, up and down.' },
        { text: '長(なが)い、短(みじか)い、悪(わる)い、重(おも)い、軽(かる)い、早(はや)い……かんじが ありませんから、わかりません。', en: 'nagai, mijikai, warui, omoi, karui, hayai… no kanji, so nobody understands.' },
        { glyph: '↗️ 👀', text: '……ギギギ。エスカレーターを うごかす かげが……。', en: 'Creak… A shadow is working the escalator…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-2',
      lines: [
        { bg: 'miyako_escalator', glyph: '長(なが) 短(みじか) 悪(わる) 重(おも) 軽(かる) 早(はや)', text: 'エスカレーターの ふだが ひかります。💡', en: 'The escalator signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_escalator', sprite: 'mojikui_escalator:normal', text: 'はやく、はやく！ もっと はやく！ みんな ころんで ください！ 😈', en: 'Faster, faster! Even faster! Everybody, fall over!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'エスカレーターの モジクイです！ いじわるです！', en: 'The escalator Mojikui! What a meanie!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-2',
      lines: [
        { bg: 'miyako_escalator', fx: ['darkclouds'], sprite: 'mojikui_escalator:normal', glyph: '🏪 💨', text: 'モジクイは えきの コンビニへ にげました。', en: 'The Mojikui fled into the station convenience store.' },
        { fx: ['spring'], sprite: 'none', glyph: '↗️ ✨', text: 'ふだが もどりました！', en: 'The signs came back!' },
        { speaker: 'granny', sprite: 'granny:happy', glyph: '🚫🏃', text: 'みなさん、エスカレーターで はしらないで くださいね。', en: "Everyone, please don't run on the escalator." },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🧳 💪', text: 'おばあさん、にもつを もちましょうか。', en: 'Shall I carry your bags, granny?' },
        { speaker: 'granny', sprite: 'granny:happy', glyph: '🧳 ➡️ 🪶', text: 'ありがとう。重(おも)い にもつが 軽(かる)く なりました。', en: 'Thank you. My heavy bags feel light now.' },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '⏰ 🏪', text: '早(はや)く コンビニへ 行(い)かなければ なりません！', en: 'We have to hurry to the convenience store!' },
      ],
    },
  },
  'moji-4-3': {
    intro: {
      stageId: 'moji-4-3',
      lines: [
        { bg: 'miyako_konbini', glyph: '🏪 💡', text: 'えきの 中(なか)の コンビニです。', en: 'The convenience store inside the station.' },
        { glyph: '🍙 🧃 🪧❓', text: 'たなの ふだに、字(じ)が ありません。', en: 'The shelf labels have no letters.' },
        { speaker: 'konbini', sprite: 'konbini:trouble', text: 'いらっしゃいませ！……あれ？ どれが なにですか？ わかりません！ 😰', en: "Welcome! …Huh? Which is which? I can't tell!" },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🧃 ❓', text: '元(げん)気(き)ドリンクは どれですか？', en: 'Which one is the energy drink?' },
        { text: '便(べん)利(り)、元(げん)気(き)、親(おや)……かんじが ありませんから、わかりません。', en: 'benri, genki, oya… no kanji, so nobody understands.' },
        { glyph: '🥤 👀', text: '……ガコン。じはんきの 中(なか)で、ふだを 食(た)べる かげが……。', en: 'Clunk. Inside the vending machine, a shadow is eating the labels…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-3',
      lines: [
        { bg: 'miyako_konbini', glyph: '便(べん) 利(り) 元(げん) 気(き) 親(おや)', text: 'コンビニの ふだが ひかります。💡', en: 'The shop labels light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_vending', sprite: 'mojikui_vending:normal', text: 'なにが 出(で)ますか？ わたしも わかりません！ ガコン！ 😈', en: "What will come out? Even I don't know! Clunk!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'じはんきの モジクイです！ きまぐれです！', en: 'The vending-machine Mojikui! So fickle!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-3',
      lines: [
        { bg: 'miyako_konbini', fx: ['darkclouds'], sprite: 'mojikui_vending:normal', glyph: '🚇 💨', text: 'モジクイは ちかてつの ほうへ にげました。', en: 'The Mojikui fled toward the subway.' },
        { fx: ['spring'], sprite: 'none', glyph: '🍙 🧃 ✨', text: 'ふだが もどりました！', en: 'The labels came back!' },
        { speaker: 'konbini', sprite: 'konbini:happy', glyph: '🍙 🧃 ✉️', text: 'この 店(みせ)で なんでも 買(か)う ことが できます。手(て)紙(がみ)を 送(おく)る ことも できます。', en: 'You can buy anything at this shop. You can even send letters.' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🏪 👍', text: '便(べん)利(り)ですね！ 店(てん)員(いん)さんも 親(しん)切(せつ)です。', en: 'How handy! And the clerk is kind, too.' },
        { speaker: 'konbini', sprite: 'konbini:happy', glyph: '🧃 💪', text: 'はい、元(げん)気(き)ドリンク！ どうぞ。', en: 'Here — an energy drink! On the house.' },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '🚇 🍙', text: '地(ち)下(か)鉄(てつ)に 乗(の)る まえに、おにぎりを 買(か)いましょう。', en: "Before we get on the subway, let's buy rice balls." },
      ],
    },
  },
  'moji-4-4': {
    intro: {
      stageId: 'moji-4-4',
      lines: [
        { bg: 'miyako_subway', glyph: '🚇 ⬇️', text: 'えきの 下(した)の、地(ち)下(か)鉄(てつ)の ホームです。', en: 'The subway platform under the station.' },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🚇 ❓', text: '花(はな)ちゃん、地(ち)下(か)鉄(てつ)に 乗(の)った ことが ありますか？', en: 'Hana, have you ever ridden the subway?' },
        { speaker: 'hana', sprite: 'hana:happy', text: 'いいえ、ありません。はじめてです！', en: 'No, never. This is my first time!' },
        { glyph: '🗺️⬜ 🚇🐢', text: 'でも、電(でん)車(しゃ)の ちずの 字(じ)が ありません。電(でん)車(しゃ)も とても おそいです。', en: 'But the route map has lost its letters. And the trains are very slow.' },
        { speaker: 'conductor', sprite: 'conductor:trouble', text: '仕(し)事(ごと)に 行(い)く 人(ひと)が たくさん います。でも、電(でん)車(しゃ)が 来(き)ません……😰', en: "Lots of people are going to work. But the trains don't come…" },
        { text: '有(ゆう)名(めい)、地(ち)、鉄(てつ)、仕(し)事(ごと)……かんじが ありませんから、わかりません。', en: 'yuumei, chi, tetsu, shigoto… no kanji, so nobody understands.' },
        { glyph: '🕳️ 👀', text: '……ノロノロ。トンネルの 中(なか)を、ゆっくり ほる かげが……。', en: 'Plod, plod. In the tunnel, a shadow is slowly digging…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-4',
      lines: [
        { bg: 'miyako_subway', glyph: '有(ゆう) 名(めい) 地(ち) 鉄(てつ) 仕(し) 事(ごと)', text: 'ホームの ふだが ひかります。💡', en: 'The platform signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_mole', sprite: 'mojikui_mole:normal', text: 'いそがない、いそがない……。仕(し)事(ごと)は あしたで いいです……ふぁ〜。😈', en: 'No rush, no rush… Work can wait till tomorrow… yawn.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ちかてつの モジクイです！', en: 'The subway Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-4',
      lines: [
        { bg: 'miyako_subway', fx: ['darkclouds'], sprite: 'mojikui_mole:normal', glyph: '🧭 💨', text: 'モジクイは えきの 出(で)口(ぐち)の ほうへ にげました。', en: 'The Mojikui fled toward the station exits.' },
        { fx: ['spring'], sprite: 'none', glyph: '🚇💨 ✨', text: '地(ち)下(か)鉄(てつ)が はしります！', en: 'The subway is running!' },
        { speaker: 'conductor', sprite: 'conductor:happy', glyph: '🚇 🏢', text: 'みなさん、仕(し)事(ごと)に まにあいます！ ありがとう ございます。', en: 'Everyone will make it to work! Thank you so much.' },
        { speaker: 'conductor', sprite: 'conductor:happy', glyph: '🗼 ⭐', text: 'この 町(まち)には 有(ゆう)名(めい)な タワーが あります。行(い)った ことが ありますか？', en: 'This town has a famous tower. Have you ever been?' },
        { speaker: 'conductor', sprite: 'conductor:happy', glyph: '🗼 👾', text: 'ゆうべ、タワーの 上(うえ)に 大(おお)きい くろい かげが いました。', en: 'Last night there was a big black shadow on top of the tower.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🗼 👾', text: '大(おお)モジクイです！ 出(で)口(ぐち)へ 行(い)きましょう！', en: "That's the Great Mojikui! Let's head for the exit!" },
      ],
    },
  },
  'moji-4-5': {
    intro: {
      stageId: 'moji-4-5',
      lines: [
        { bg: 'miyako_exit', glyph: '🧭 🏙️', text: 'えきの そとの ひろばです。', en: 'The square outside the station.' },
        { glyph: '🪧❓ 🪧❓ 🪧❓ 🪧❓', text: '東(ひがし)口(ぐち)、西(にし)口(ぐち)、南(みなみ)口(ぐち)、北(きた)口(ぐち)……ふだの 字(じ)が ありません。', en: 'East exit, west exit, south exit, north exit… the signs have lost their letters.' },
        { glyph: '🏙️ 🪧⬜', text: '大(おお)きい かんばんの 町(まち)の なまえも ありません。', en: "Even the town's name on the big signboard is gone." },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🗼 ❓', text: 'ねえ、タワーは どっち？', en: 'Hey, which way is the tower?' },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🗺️ ⬜', text: 'わからない。ちずにも 字(じ)が ない。', en: "Don't know. The map has no letters either." },
        { text: '東(ひがし)、西(にし)、南(みなみ)、北(きた)、京(きょう)……かんじが ありませんから、わかりません。', en: 'higashi, nishi, minami, kita, kyou… no kanji, so nobody understands.' },
        { glyph: '🗺️ 👀', text: '……クスクス。ちずの うしろで、わらう かげが……。', en: 'Hee hee. Behind the map, a shadow is giggling…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-5',
      lines: [
        { bg: 'miyako_exit', glyph: '東(ひがし) 西(にし) 南(みなみ) 北(きた) 京(きょう)', text: 'ひろばの ふだが ひかります。💡', en: 'The signs in the square light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_map', sprite: 'mojikui_map:normal', text: 'タワーは 南(みなみ)だよ。……うそ！ 西(にし)だよ。……うそ！ 😈', en: "The tower's to the south. …Lie! It's west. …Lie!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ちずの モジクイです！ うそつきです！', en: 'The map Mojikui! What a liar!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-5',
      lines: [
        { bg: 'miyako_exit', fx: ['darkclouds'], sprite: 'mojikui_map:normal', glyph: '🏮 💨', text: 'モジクイは タワーの 下(した)の やたいの ほうへ にげました。', en: 'The Mojikui fled toward the food stalls at the foot of the tower.' },
        { fx: ['spring'], sprite: 'none', glyph: '🧭 ✨', text: 'ふだが もどりました！ かんばんは「京(みやこ)タウン」です。', en: 'The signs came back! The big sign says "Miyako Town".' },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🗼 ⬆️', text: 'タワーは 北(きた)だ！ 北(きた)口(ぐち)から 出(で)る！', en: "The tower's north! We go out the north exit!" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '😋 💭', text: 'おなか すいた……。', en: "I'm hungry…" },
        { speaker: 'sora', sprite: 'sora:normal', glyph: '🏮 🍢', text: 'タワーの 下(した)に やたいが ある。いっしょに 食(た)べる？', en: 'There are food stalls under the tower. Want to eat together?' },
        { speaker: 'hana', sprite: 'hana:happy', text: 'うん、食(た)べる！', en: "Yeah, let's eat!" },
      ],
    },
  },
  'moji-4-6': {
    intro: {
      stageId: 'moji-4-6',
      lines: [
        { bg: 'miyako_yatai', glyph: '🌃 🏮', text: '夜(よる)に なりました。タワーの 下(した)の やたいです。', en: 'Night has fallen. The food stalls under the tower.' },
        { glyph: '🍢 🪧❓', text: 'やたいの ふだに、字(じ)が ありません。', en: 'The stall signs have no letters.' },
        { speaker: 'yatai', sprite: 'yatai:trouble', text: 'きょうの 料(りょう)理(り)は なんですか？ わたしも わかりません……😰', en: "What's today's dish? Even I don't know…" },
        { speaker: 'hana', sprite: 'hana:trouble', glyph: '🥶 🍲', text: 'さむく なりましたね。あたたかい 料(りょう)理(り)が 食(た)べたいです。', en: "It's got cold. I want something warm to eat." },
        { text: '夜(よる)、料(りょう)、理(り)、口(くち)……かんじが ありませんから、わかりません。', en: 'yoru, ryou, ri, kuchi… no kanji, so nobody understands.' },
        { glyph: '👄 👀', text: '……ペチャクチャ。大(おお)きい 口(くち)で、しゃべったり 食(た)べたり する かげが……。', en: 'Chatter, chatter. A shadow with a huge mouth, talking and eating, talking and eating…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-6',
      lines: [
        { bg: 'miyako_yatai', glyph: '夜(よる) 料(りょう) 理(り) 口(くち)', text: 'やたいの ふだが ひかります。💡', en: 'The stall signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_mouth', sprite: 'mojikui_mouth:normal', text: 'しゃべって、食(た)べて、しゃべって、食(た)べて！ 夜(よる)は ながいですよ〜！ 😈', en: 'Talk, eat, talk, eat! The night is long!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'おおぐちの モジクイです！', en: 'The big-mouth Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-6',
      lines: [
        { bg: 'miyako_yatai', fx: ['darkclouds'], sprite: 'mojikui_mouth:normal', glyph: '🗼 💨', text: 'モジクイは タワーの 入(いり)口(ぐち)へ にげました。', en: "The Mojikui fled to the tower's entrance." },
        { fx: ['spring'], sprite: 'none', glyph: '🍢 ✨', text: 'ふだが もどりました！ やたいが 明(あか)るく なりました。', en: 'The signs came back! The stalls are bright again.' },
        { speaker: 'yatai', sprite: 'yatai:happy', glyph: '🍢 🍲', text: 'きょうの 料(りょう)理(り)は おでんです！ どうぞ！', en: "Today's dish is oden! Help yourselves!" },
        { speaker: 'hana', sprite: 'hana:cook', glyph: '👩‍🍳 ✨', text: 'わたしも てつだいます！', en: "I'll help!" },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '😋 ❤️', text: 'おいしい！ からだが あたたかく なった！', en: "Yummy! I'm all warm now!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🗼 ⬆️', text: 'タワーの 入(いり)口(ぐち)は あそこです。行(い)きましょう！', en: "The tower's entrance is over there. Let's go!" },
      ],
    },
  },
  'moji-4-7': {
    intro: {
      stageId: 'moji-4-7',
      lines: [
        { bg: 'miyako_tower', glyph: '🗼 🛗❌', text: 'タワーの 中(なか)です。エレベーターが うごきません。', en: "Inside the tower. The elevator won't move." },
        { glyph: '📅 🪧❓', text: 'カレンダーの ふだも ありません。きょうは なん曜(よう)日(び)ですか？', en: 'The calendar sign is gone too. What day is it today?' },
        { speaker: 'sora', sprite: 'sora:trouble', glyph: '🪜 🦵', text: 'かいだんを 足(あし)で のぼる？ たいへんだね……。', en: "Climb the stairs on foot? That's tough…" },
        { speaker: 'hana', sprite: 'hana:normal', glyph: '💪', text: 'だいじょうぶ！ みんなで のぼりましょう！', en: "It's fine! Let's all climb together!" },
        { text: '目(め)、足(あし)、曜(よう)……かんじが ありませんから、わかりません。', en: 'me, ashi, you… no kanji, so nobody understands.' },
        { glyph: '🔭 👀', text: '……ジロジロ。ぼうえんきょうで 町(まち)を 見(み)る かげが……。', en: 'Stare, stare. A shadow is watching the town through a telescope…' },
        WRITE,
      ],
    },
    encounter: {
      stageId: 'moji-4-7',
      lines: [
        { bg: 'miyako_tower', glyph: '目(め) 足(あし) 曜(よう)', text: 'タワーの ふだが ひかります。💡', en: 'The tower signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_telescope', sprite: 'mojikui_telescope:normal', text: 'みんなの ひみつ、ぜんぶ 見(み)ました！ つぎは あなたの 字(じ)です！ 😈', en: "I've seen everyone's secrets! Your letters are next!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ぼうえんきょうの モジクイです！', en: 'The telescope Mojikui!' },
        FIGHT,
      ],
    },
    outro: {
      stageId: 'moji-4-7',
      lines: [
        { bg: 'miyako_tower', fx: ['darkclouds'], sprite: 'mojikui_telescope:normal', glyph: '⬆️ 💨', text: 'モジクイは タワーの いちばん 上(うえ)へ にげました。', en: 'The Mojikui fled to the very top of the tower.' },
        { fx: ['spring'], sprite: 'none', glyph: '📅 ✨', text: 'ふだが もどりました！ きょうは 土(ど)曜(よう)日(び)です。', en: "The signs came back! Today is Saturday." },
        { speaker: 'sora', sprite: 'sora:happy', glyph: '🪜 🏙️', text: 'かいだんを 歩(ある)いたり、まどから 町(まち)を 見(み)たり しました。たのしい！', en: 'We walked up the stairs and looked at the town from the windows. Fun!' },
        { speaker: 'hana', sprite: 'hana:happy', glyph: '👀 🌃', text: '目(め)の 下(した)に、町(まち)の あかりが いっぱい！', en: 'Below us, the town is full of lights!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '👾 ⬆️', text: '大(おお)モジクイは、この 上(うえ)です！', en: 'The Great Mojikui is just above!' },
      ],
    },
  },
};

/**
 * 4章 8話 まとめの ボス（docs/design/15 §3）: タワーの いちばん 上で 大モジクイ。勝つと 町の 明かりと 字が 戻る。
 * その とき モジクイの 王の 声が して、大モジクイを 連れて 消える → つづく（5章「モジクイの 王」）。王の 絵は 5章で 作る。
 */
export const MOJI4_FINALE: FinaleScript = {
  intro: {
    stageId: 'moji-4-boss',
    lines: [
      { bg: 'miyako_tower_top', glyph: '🗼 🌌', text: 'タワーの いちばん 上(うえ)です。', en: 'The very top of the tower.' },
      { glyph: '🪧 🗺️ 📅 💡', text: 'ふだ、ちず、カレンダー、あかり……ぜんぶ ここに あります！', en: 'Signs, maps, calendars, lights — they are all here!' },
      { fx: ['darkclouds'], speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: 'しつこいですね！ この 町(まち)の 字(じ)も、わたしの ものです！ 😈', en: "You don't give up, do you! This town's letters are mine too!" },
      { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👀 ✍️ ❓', text: 'あなたの にがてな 字(じ)は どれ？ その 字(じ)から 食(た)べる！', en: "Which letters are you weakest at? I'll eat those first!" },
      { speaker: 'sora', sprite: 'sora:normal', glyph: '👧 👧 🤖', text: 'わたしたちも いっしょだよ！', en: "We're with you!" },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏙️ 🔄 ✍️', text: 'みんなで 町(まち)を 回(まわ)って、ぜんぶ 書(か)きました。まけません！', en: "We went all round the town and wrote every letter. We won't lose!" },
      FIGHT,
    ],
  },
  outro: {
    stageId: 'moji-4-boss',
    lines: [
      { bg: 'miyako_tower_top', fx: ['sparkle'], glyph: '🫧💥 ✨✨✨', text: 'あわが われて、字(じ)が 町(まち)へ とびます！', en: 'The letters burst from the bubbles and fly out over the town!' },
      { bg: 'miyako_lights_back', fx: ['spring'], sprite: 'sora:happy', glyph: '🌃 ✨', text: '町(まち)じゅうの あかりと 字(じ)が もどりました！', en: 'The lights and letters came back all over town!' },
      { fx: ['darkclouds'], sprite: 'sora:trouble', glyph: '🌑 🌑 🌑', text: '……その とき、そらが まっくらに なりました。', en: '…Just then, the sky went pitch black.' },
      { glyph: '👑 👤', text: '「大(おお)モジクイ、かえりましょう。字(じ)の ない せかいへ……。」ひくい こえです。', en: '"Great Mojikui, let us go home. To a world without letters…" A low voice.' },
      { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: 'お、王(おう)さま！ 😱', en: 'Y-your Majesty!' },
      { sprite: 'nexmax:think', glyph: '👾 👑 💨', text: '大(おお)モジクイは、くろい かげと いっしょに きえました。', en: 'The Great Mojikui vanished with the black shadow.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '👑 ❓', text: 'モジクイの 王(おう)……？ 字(じ)の ない せかい……？', en: 'The Mojikui King…? A world without letters…?' },
      { speaker: 'hana', sprite: 'hana:happy', glyph: '👧 👧 🤖', text: 'みんなで 行(い)きましょう！', en: "Let's all go together!" },
    ],
  },
};
