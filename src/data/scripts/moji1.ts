import type { CastMember, NovelScript } from '../../types/novel';
import { NANIWA_FOLK, NANIWA_NEXMAX } from './naniwaCast';

/**
 * 1章「字(じ)の ない 町(まち)」の 脚本（08 §3.3・§4.2.1）。
 *
 * かな編の あと: 学習者は かなが 読める。ここからは **絵が 主役、文字は 少なく、英語は なるべく 使わない**
 * （2026-09-26「絵をメインで進めて、文字での説明は少なくして、極力英語は減らしていきたい」）。
 *  - 台詞は かなと 漢字（ふりがな記法）。まだ 書いて いない 漢字は 音だけ 残る（KanjiBackText）。
 *    漢字は 1字ずつ 書く: 月(げつ)曜(よう)日(び) → 書いた あとは「月よう日」。
 *  - 意味は 絵文字と 大きな 字（glyph）で 見せる（日 ☀️ 月 🌙 火 🔥 水 💧 木 🌳 …）。
 *  - 英語は EN ボタンを 押した ときだけ（`en`）。
 *  - 文型は 教科書の 課の 順（1〜5課: 〜は 〜です／これ・それ／ここ・そこ／〜ます）。
 *    教科書の 例文・人物は 使わない（08 §2）。山田さんは この 町の ロボットの 住人。
 *
 * 2026-10-02「いきなり 敵が 出てくるのは 意味不明」(08 §3.8): 話ごとに
 *  - intro に 影の 伏線、
 *  - 書いた あと **encounter**（灯った 字に モジクイが 来る。あなたは かく、ぼくは たたかう）、
 *  - outro で モジクイが どこへ 逃げたか を 見せる。
 * 1章 2話の おわりに 山田さんが 漢字やさんへ 案内する（★3 の 字 ふたつで 武器）。
 * 0章を とばした 人には MOJI1_PRELUDE（空港で 名前を 書いた → ナニワタウンへ）。
 */

export const MOJI1_CAST: CastMember[] = [
  NANIWA_NEXMAX,
  {
    id: 'yamada',
    name: '山(やま)田(だ)さん',
    // Her name was eaten: ？？？ until 山 and 田 are written (1章2話).
    nameChars: '山(やま)田(だ)',
    color: '#e2799a',
    sprites: { normal: 'img/chara/cut/ESFJ_f.webp', sad: 'img/chara/naniwa/folk_yamada_sad.webp', happy: 'img/chara/naniwa/folk_yamada_happy.webp' },
  },
  { id: 'mojikui_kid', name: 'モジクイの こども', color: '#7b4bb3', sprites: { normal: 'img/battle/mojikui_kid.webp' } },
  { id: 'mojikui', name: 'モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui.webp' } },
  ...NANIWA_FOLK,
];

interface EpisodeScript {
  intro: NovelScript;
  /** After the writing, before じゅんび: the letters just lit draw the opponent in. */
  encounter: NovelScript;
  outro: NovelScript;
}

/**
 * Before 1章 1話, for a player who skipped 0章 at the end of the prologue
 * (「読める → ナニワタウンへ」): how they met Nexmax, in four lines.
 */
export const MOJI1_PRELUDE: NovelScript = {
  stageId: 'moji-1-1',
  lines: [
    { bg: 'naniwa_airport', glyph: '🤖 □□□□□□', text: 'くうこうに、ロボットが います。なまえが ありません。', en: 'At the airport there is a little robot. Its name has been eaten.' },
    { glyph: '✍️ ネクマックス', text: 'あなたは かなが かけます。なまえを かきました。', en: 'You can write kana — so you wrote its name back.' },
    { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックスです。ありがとう！', en: "I'm Nexmax. Thank you!" },
    { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🚃 → 🏙️', text: 'モジクイは ナニワタウンへ いきました。いきましょう！', en: "The Mojikui went to Naniwa Town — the town on the hill. Let's go!" },
  ],
};

export const MOJI1_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-1-1': {
    intro: {
      stageId: 'moji-1-1',
      lines: [
        { bg: 'naniwa_town_station', text: 'でんしゃが、ナニワタウンに つきました。', en: 'The train arrives in Naniwa Town, the town on the hill.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ここは えきです。', en: 'This is the station.' },
        { glyph: '📅 ❓', text: 'えきの カレンダーの じが、ありません。', en: 'The letters on the station calendar are gone.' },
        { speaker: 'announcer', sprite: 'announcer:trouble', text: 'きょうは なんようび？ だれも わかりません……😰', en: 'What day is it today? Nobody can tell…' },
        { text: '日(にち)、月(げつ)、火(か)、水(すい)、木(もく)……おとだけ、のこって います。', en: 'Only the sounds are left: nichi, getsu, ka, sui, moku.' },
        { glyph: '👀 💨', text: '……あれは？', en: 'What was that? Something small and dark slips away behind the calendar.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'かんじが ない。🪧🪧🪧🪧🪧', en: 'No kanji. Five empty signs.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-1',
      lines: [
        { bg: 'naniwa_town_station', glyph: '日(にち) 月(げつ) 火(か) 水(すい) 木(もく)', text: 'カレンダーが ひかります。💡', en: 'The calendar lights up.' },
        { fx: ['darkclouds'], text: '……！ 🌫️🌫️', en: 'Black ink-mist pours out from behind the calendar.' },
        { speaker: 'mojikui_kid', sprite: 'mojikui_kid:normal', text: 'じ！ じ！ たべます！ 😋', en: 'Letters! Letters! Yum!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイの こどもです！', en: 'A little Mojikui — one of its young!' },
        { speaker: 'nexmax', text: 'だめです！ 🙅 この 字(じ)は、まちの 字(じ)です。', en: 'No! These letters belong to the town.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくは たたかいます！', en: 'You write — the light of your letters is my strength. I fight!' },
      ],
    },
    outro: {
      stageId: 'moji-1-1',
      lines: [
        { bg: 'naniwa_town_station', fx: ['darkclouds'], speaker: 'mojikui_kid', sprite: 'mojikui_kid:normal', text: '……💦 にげます！', en: 'The little Mojikui runs away!' },
        { fx: ['spring'], sprite: 'nexmax:smile', glyph: '日(にち) 月(げつ) 火(か) 水(すい) 木(もく)', text: 'カレンダーに かんじが もどりました！', en: 'The kanji came back to the calendar!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '☀️ 🌙 🔥 💧 🌳', text: '日(ひ)、月(つき)、火(ひ)、水(みず)、木(き)。', en: 'Sun, moon, fire, water, tree.' },
        { speaker: 'nexmax', text: 'きょうは 月(げつ)曜(よう)日(び)です。', en: 'Today is Monday.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '金(きん)曜(よう)日(び)と 土(ど)曜(よう)日(び)は？', en: 'What about Friday and Saturday?' },
        { glyph: '金(きん) 土(ど)', text: 'まだ、おとだけです。', en: 'Still only sounds.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '👉 🚉', text: 'こどもは、えきの そとへ いきました。', en: 'The little one ran out of the station.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いきましょう！', en: "Let's go!" },
      ],
    },
  },
  'moji-1-2': {
    intro: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'naniwa_station_square', text: 'えきの まえに、ロボットが います。', en: 'A robot stands in front of the station.' },
        { speaker: 'yamada', sprite: 'yamada:normal', text: 'はじめまして。わたしは 山(やま)田(だ)です。', en: 'Nice to meet you. I am Yamada.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'はじめまして。ぼくは ネクマックスです。', en: 'Nice to meet you. I am Nexmax.' },
        { speaker: 'yamada', sprite: 'yamada:sad', glyph: '山(やま)田(だ)', text: 'わたしの なまえの かんじが きえました。😢', en: 'The kanji of my name disappeared.' },
        { speaker: 'yamada', text: 'まちの ちずも……。', en: 'The town map too...' },
        { glyph: '山(やま) 川(かわ) 田(た)', text: '⛰️ 🏞️ 🌾', en: 'Mountain, river, rice field.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '金(きん)曜(よう)日(び)、土(ど)曜(よう)日(び)も ありません。', en: 'Friday and Saturday are missing too.' },
        { glyph: '🗺️ 👀', text: 'ちずの うしろに、くろい かげが……。', en: 'Behind the map board, a big dark shadow…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'naniwa_station_square', glyph: '山(やま)田(だ)', text: 'なまえが ひかります。💡', en: "Yamada-san's name lights up." },
        { fx: ['darkclouds'], speaker: 'mojikui', sprite: 'mojikui:normal', text: 'その なまえ、たべます！ 😈', en: "That name — I'll eat it!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'でんしゃの モジクイです！', en: 'The Mojikui from the train!' },
        { speaker: 'yamada', sprite: 'yamada:sad', text: '……！ 😱', en: 'Yamada-san freezes.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight — I'll protect you!" },
      ],
    },
    outro: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'naniwa_station_square', fx: ['darkclouds'], sprite: 'mojikui:normal', glyph: '⛰️ 💨', text: 'モジクイは にげました。', en: 'The Mojikui fled — toward the mountain behind the town.' },
        { fx: ['spring'], speaker: 'yamada', sprite: 'yamada:happy', glyph: '山(やま)田(だ)', text: 'わたしの なまえ！ ありがとう！', en: 'My name! Thank you!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '⛰️ 🏞️ 🌾', text: '山(やま)、川(かわ)、田(た)。', en: 'Mountain, river, rice field.' },
        { speaker: 'nexmax', glyph: '金(きん) 土(ど)', text: '金(きん)曜(よう)日(び)、土(ど)曜(よう)日(び)。', en: 'Friday, Saturday.' },
        { speaker: 'yamada', sprite: 'yamada:normal', text: 'モジクイは 山(やま)の ほうへ いきました。👉', en: 'The Mojikui went toward the mountain.' },
        { speaker: 'yamada', text: 'その まえに、こちらへ どうぞ。👉', en: 'Before you go — this way, please.' },
        { bg: 'naniwa_kanjiyasan', speaker: 'yamada', sprite: 'yamada:normal', glyph: '🔨', text: 'ここは 漢字(かんじ)やさんです。', en: 'This is the Kanji Shop — a forge for letters.' },
        { speaker: 'yamada', text: 'でも、いまは だれも いません。😢', en: 'But nobody works here now.' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🤖 🔨', text: 'ぼくは ネクストメイクの ロボットです。だいじょうぶです！', en: "I'm a NextMake robot. I can work this anvil!" },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ ×10 → ⭐⭐⭐', text: '10かい かいた 字(じ)は、⭐⭐⭐です。', en: 'A letter you have written ten times is ★★★.' },
        { speaker: 'nexmax', glyph: '⭐⭐⭐ 🙅 😋', text: '⭐⭐⭐の 字(じ)は、モジクイも たべません。', en: 'Not even the Mojikui can eat a ★★★ letter — it is written too firmly.' },
        { speaker: 'nexmax', glyph: '火(ひ) ＋ 山(やま) → 🔨 → 🌋', text: '⭐⭐⭐の 字(じ)を ふたつ。🔨 ぶきです！', en: 'Two ★★★ letters, hammered together here, make a weapon.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'もっと かきましょう。それから、山(やま)へ いきましょう！ ⛰️', en: "Let's write more — then on to the mountain!" },
      ],
    },
  },
};
