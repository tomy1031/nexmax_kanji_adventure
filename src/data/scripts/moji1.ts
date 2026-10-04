import type { CastMember, NovelScript } from '../../types/novel';
import type { FinaleScript } from '../mojiFinale';
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
    sprites: { normal: 'img/chara/naniwa/folk_yamada_normal.webp', sad: 'img/chara/naniwa/folk_yamada_sad.webp', happy: 'img/chara/naniwa/folk_yamada_happy.webp' },
  },
  { id: 'mojikui_kid', name: 'モジクイの こども', color: '#7b4bb3', sprites: { normal: 'img/battle/mojikui_kid.webp' } },
  { id: 'mojikui', name: 'モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui.webp' } },
  { id: 'mojikui_clock', name: 'とけいの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_clock.webp' } },
  { id: 'mojikui_gear', name: 'はぐるまの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_gear.webp' } },
  { id: 'mojikui_price', name: 'ねふだの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_price.webp' } },
  { id: 'mojikui_nametag', name: 'なふだの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_nametag.webp' } },
  { id: 'mojikui_book', name: 'ほんの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_book.webp' } },
  { id: 'mojikui_clocktower', name: 'とけいだいの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_clocktower.webp' } },
  { id: 'mojikui_signboard', name: 'かんばんの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_signboard.webp' } },
  { id: 'mojikui_bus', name: 'バスの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_bus.webp' } },
  { id: 'mojikui_station', name: 'えきの モジクイ', color: '#5a2d8c', sprites: { normal: 'img/battle/mojikui_station.webp' } },
  { id: 'mojikui_boss', name: '大(おお)モジクイ', color: '#3b1a66', sprites: { normal: 'img/battle/mojikui_boss.webp' } },
  ...NANIWA_FOLK,
];

export interface EpisodeScript {
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
    { glyph: '✍️ ネクマックス', text: 'あなたが なまえを かきました。', en: 'You can write kana — so you wrote its name back.' },
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
        { glyph: '👀 💨', text: '……あれは？ ちいさい くろい かげ……。', en: 'What was that? Something small and dark slips away behind the calendar.' },
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
        { glyph: '🗺️ 👀', text: 'ちずの うしろに、くろい かげが……。', en: 'Behind the map board, a big dark shadow…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'naniwa_station_square', glyph: '山(やま)田(だ)', text: 'なまえが ひかります。💡', en: "Yamada-san's name lights up." },
        { fx: ['darkclouds'], speaker: 'mojikui', sprite: 'mojikui:normal', text: 'その なまえ、たべます！ 😈', en: "That name — I'll eat it!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ちずの うしろの かげ……モジクイです！', en: 'The shadow behind the map — a Mojikui!' },
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
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🤖 🔨', text: 'だいじょうぶです！ ぼくが つくります！', en: "I'm a NextMake robot. I can work this anvil!" },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ ×10 → ⭐⭐⭐', text: '10かい かいた 字(じ)は、⭐⭐⭐です。', en: 'A letter you have written ten times is ★★★.' },
        { speaker: 'nexmax', glyph: '火(ひ) ＋ 山(やま) → 🔨 → 🌋', text: '⭐⭐⭐の 字(じ)を ふたつ。🔨 ぶきです！', en: 'Two ★★★ letters, hammered together here, make a weapon.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'もっと かきましょう。それから、山(やま)へ いきましょう！ ⛰️', en: "Let's write more — then on to the mountain!" },
      ],
    },
  },
  // 1章 3〜5話（09 §1.2）: 数と お金。2話で モジクイは 山へ 逃げた → ロープウェーで 山の うえの 工場 → ふもとの 市場。
  // 文型は 4〜5課（いま なんじですか・〜へ いきます・いくらですか）。開く もの（毎日の やること・なかま・図鑑）は お話で 知らせる。
  'moji-1-3': {
    intro: {
      stageId: 'moji-1-3',
      lines: [
        { bg: 'naniwa_ropeway', text: '山(やま)の ふもとの ロープウェーの えきです。', en: 'The ropeway station at the foot of the mountain.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '🚡 ⛰️', text: 'これで 山(やま)へ いきます。', en: 'We take this up the mountain — after the Mojikui.' },
        { glyph: '🕐 ❓', text: 'じこくひょうの すうじが、ありません。', en: 'The numbers on the timetable are gone.' },
        { speaker: 'ropeway', sprite: 'ropeway:trouble', text: 'いま なんじですか？ ロープウェーが うごきません……😰', en: "What time is it now? The ropeway won't move…" },
        { text: '一(いち)、二(に)、三(さん)、四(よん)、五(ご)……おとだけ、のこって います。', en: 'Only the sounds are left: ichi, ni, san, yon, go.' },
        { glyph: '🕐 🦷', text: '……ガリガリ。なにかが とけいを かじって います。', en: 'Crunch, crunch. Something is gnawing on the clock.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'すうじが ない。🪧🪧🪧🪧🪧', en: 'No numbers. Five empty signs.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-3',
      lines: [
        { bg: 'naniwa_ropeway', glyph: '一(いち) 二(に) 三(さん) 四(よん) 五(ご)', text: 'じこくひょうが ひかります。💡', en: 'The timetable lights up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_clock', sprite: 'mojikui_clock:normal', text: 'とけいの すうじ、おいしい！ もっと たべます！ 😋', en: 'Clock numbers are delicious! I want more!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'とけいを かじる モジクイです！', en: 'The Mojikui that gnaws on clocks!' },
        { speaker: 'ropeway', sprite: 'ropeway:trouble', text: 'とけいが……！ 😱', en: 'The clock…!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-3',
      lines: [
        { bg: 'naniwa_ropeway', fx: ['darkclouds'], sprite: 'mojikui_clock:normal', glyph: '⛰️ 💨', text: 'モジクイは 山(やま)の うえへ にげました。', en: 'The Mojikui fled up the mountain.' },
        { fx: ['spring'], sprite: 'ropeway:happy', glyph: '一(いち) 二(に) 三(さん) 四(よん) 五(ご)', text: 'じこくひょうに すうじが もどりました！', en: 'The numbers came back to the timetable!' },
        { speaker: 'ropeway', sprite: 'ropeway:happy', glyph: '🕒 🚡', text: 'いま 三(さん)じです。ロープウェーが うごきます！', en: "It's three o'clock now. The ropeway runs again!" },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣', text: '一(いち)、二(に)、三(さん)、四(よん)、五(ご)！', en: 'One, two, three, four, five!' },
        { speaker: 'ropeway', sprite: 'ropeway:happy', glyph: '🎫 ✅⬜⬜⬜⬜', text: 'これを どうぞ。まいにち きて くださいね。', en: 'Here is a stamp card. Please come every day!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '📅 ✍️ → 🎫 → 💎', text: 'まいにち かきます。スタンプと ジェムを もらいます！', en: 'Write every day and you get a stamp — and gems. Daily tasks are open!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🚡 ⛰️', text: 'ロープウェーで 山(やま)の うえへ いきましょう！', en: "Let's ride the ropeway up the mountain!" },
      ],
    },
  },
  'moji-1-4': {
    intro: {
      stageId: 'moji-1-4',
      lines: [
        { bg: 'naniwa_factory', text: '山(やま)の うえの こうばです。', en: 'A workshop on the mountain top.' },
        { glyph: '🤖💤 🤖💤 🤖💤', text: 'ロボットたちが ねむって います。', en: 'The robots are all asleep.' },
        { speaker: 'worker', sprite: 'worker:sleep', text: '……ぼくの ばんごうが……ない……💤', en: "…My number… it's gone… (he talks in his sleep)" },
        { text: '六(ろく)、七(なな)、八(はち)、九(きゅう)、十(じゅう)……おとだけ、のこって います。', en: 'Only the sounds are left: roku, nana, hachi, kyuu, juu.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🔢 ❌ → 🤖💤', text: 'ばんごうが ありません。ロボットは おきません。', en: "Without their numbers, robots don't wake up." },
        { glyph: '⚙️ 👀', text: '……ギシ、ギシ。はぐるまの うしろに、かげが……。', en: 'Creak, creak. Behind the gears, a shadow…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-4',
      lines: [
        { bg: 'naniwa_factory', glyph: '六(ろく) 七(なな) 八(はち) 九(きゅう) 十(じゅう)', text: 'ばんごうが ひかります。💡', en: 'The numbers light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_gear', sprite: 'mojikui_gear:normal', text: 'ばんごうも はぐるまも、ぜんぶ わたしの もの！ 😈', en: 'Numbers and gears — all mine!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'はぐるまの モジクイです！', en: 'The gear Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-4',
      lines: [
        { bg: 'naniwa_factory', fx: ['darkclouds'], sprite: 'mojikui_gear:normal', glyph: '⬇️ 💨', text: 'モジクイは 山(やま)の したへ にげました。', en: 'The Mojikui fled down the mountain.' },
        { fx: ['spring'], sprite: 'worker:awake', glyph: '🤖✨ 🤖✨ 🤖✨', text: 'ロボットたちが おきました！', en: 'The robots woke up!' },
        { speaker: 'worker', sprite: 'worker:awake', text: 'おはようございます！ ぼくは 七(なな)ばんです。', en: "Good morning! I'm Number Seven." },
        { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックスです。', en: "I'm Nexmax." },
        { speaker: 'worker', sprite: 'worker:awake', glyph: '🤖 ＝ 🤖', text: 'ぼくも ネクマックスです。まじめな ネクマックスです！', en: "I'm a Nexmax too — the serious one. I always finish what I start!" },
        { speaker: 'worker', sprite: 'worker:awake', glyph: '🤖 ＋ 🤖', text: 'いっしょに いきます！ まじめに はたらきます！', en: "I'll come with you! I'll work hard!" },
        { glyph: '🤝 ✨', text: '七(なな)ばんが、なかまに なりました！', en: 'Number Seven joined you!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '💎 → 🤖❓', text: 'ジェムで、ほかの なかまを よびます！', en: 'With gems, you can call other companions too.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '⬇️ 🏮', text: 'モジクイは ふもとの いちばへ。いきましょう！', en: "The Mojikui went to the market at the foot of the mountain. Let's go!" },
      ],
    },
  },
  'moji-1-5': {
    intro: {
      stageId: 'moji-1-5',
      lines: [
        { bg: 'naniwa_market', text: '山(やま)の ふもとの いちばです。', en: 'The market at the foot of the mountain.' },
        { glyph: '🏷️ ❓', text: 'ねふだの じが、ありません。', en: 'The letters on the price tags are gone.' },
        { speaker: 'vendor', sprite: 'vendor:trouble', text: 'いくらですか？ わたしも わかりません……💦', en: "How much is it? Even I don't know…" },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🍎 ❓ 🪙', text: 'これは いくらですか？', en: 'How much is this?' },
        { text: '百(ひゃく)、千(せん)、万(まん)、円(えん)……おとだけ、のこって います。', en: 'Only the sounds are left: hyaku, sen, man, en.' },
        { glyph: '🏷️ 👀', text: '……ムシャ、ムシャ。ねふだを たべる かげが……。', en: 'Munch, munch. A shadow is eating the price tags…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-5',
      lines: [
        { bg: 'naniwa_market', glyph: '百(ひゃく) 千(せん) 万(まん) 円(えん)', text: 'ねふだが ひかります。💡', en: 'The price tags light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_price', sprite: 'mojikui_price:normal', text: 'ねふだは ただ！ ぜんぶ たべます！ 😋', en: "Price tags are free! I'll eat them all!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ねふだの モジクイです！', en: 'The price-tag Mojikui!' },
        { speaker: 'vendor', sprite: 'vendor:trouble', text: 'やめて ください！ 😱', en: 'Please stop!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-5',
      lines: [
        { bg: 'naniwa_market', fx: ['darkclouds'], sprite: 'mojikui_price:normal', glyph: '🌉 💨', text: 'モジクイは つぎの まちへ にげました。', en: 'The Mojikui fled to the next district.' },
        { fx: ['spring'], sprite: 'vendor:happy', glyph: '百(ひゃく) 千(せん) 万(まん) 円(えん)', text: 'ねふだが もどりました！', en: 'The price tags came back!' },
        { speaker: 'vendor', sprite: 'vendor:happy', glyph: '🍎 = 百(ひゃく)円(えん)', text: 'りんごは 百(ひゃく)円(えん)です！', en: 'Apples are 100 yen!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'いくらですか？ ……百(ひゃく)円(えん)！ よめました！ 🙆‍♂️', en: 'How much? …100 yen! I can read it!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '📖 ✨', text: 'ずかんに、ぶきと なかまが あります！', en: 'The collection is open: your weapons and companions are in the picture book!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🌉 👉', text: 'モジクイを おいかけましょう！', en: "Let's chase the Mojikui!" },
      ],
    },
  },
  // 1章 6〜11話（10 §2）: 名札 → 病院 → 時計台 → 商店街 → バス停 → 駅の 奥（モジクイの 巣。12話 まとめの ボスへ）。
  'moji-1-6': {
    intro: {
      stageId: 'moji-1-6',
      lines: [
        { bg: 'naniwa_school', text: 'はしの むこうに、ちいさな にほんごの がっこうが あります。', en: 'Across the bridge stands a small Japanese-language school.' },
        { glyph: '🏫 🪧❓', text: 'いりぐちの なふだの じが、ありません。', en: 'The letters on the name plates at the entrance are gone.' },
        { speaker: 'teacher', sprite: 'teacher:trouble', text: 'あなたは だれですか？ わたしは……だれですか？ 😰', en: 'Who are you? And who… am I?' },
        { speaker: 'office', sprite: 'office:trouble', glyph: '💼 🪧❓', text: 'わたしの なふだも ありません……', en: 'My name plate is gone too…' },
        { text: '学(がく)生(せい)、先(せん)生(せい)、会(かい)社(しゃ)員(いん)……おとだけ、のこって います。', en: 'Only the sounds are left: gakusei, sensei, kaishain.' },
        { glyph: '🪧 👀', text: '……カリカリ。なふだを かじる おとが します。', en: 'Scritch, scratch. Something is nibbling the name plates.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🙇 ❓', text: 'なまえが ありません。「はじめまして」……？', en: "Without names, nobody can say 'nice to meet you'." },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-6',
      lines: [
        { bg: 'naniwa_school', glyph: '学(がく) 生(せい) 先(せん) 会(かい) 社(しゃ) 員(いん)', text: 'なふだが ひかります。💡', en: 'The name plates light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_nametag', sprite: 'mojikui_nametag:normal', text: 'なまえは おいしい！ もう だれも わかりません！ 😈', en: 'Names are tasty! Now nobody knows who anybody is!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'なふだの モジクイです！', en: 'The name-plate Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-6',
      lines: [
        { bg: 'naniwa_school', fx: ['darkclouds'], sprite: 'mojikui_nametag:normal', glyph: '🏥 💨', text: 'モジクイは となりの びょういんへ にげました。', en: 'The Mojikui fled to the clinic next door.' },
        { fx: ['spring'], sprite: 'teacher:happy', glyph: '学(がく)生(せい) 先(せん)生(せい) 会(かい)社(しゃ)員(いん)', text: 'なふだが もどりました！', en: 'The name plates came back!' },
        { speaker: 'teacher', sprite: 'teacher:happy', glyph: '👩‍🏫', text: 'はじめまして。わたしは 先(せん)生(せい)です。', en: "Nice to meet you. I'm the teacher here." },
        { speaker: 'office', sprite: 'office:happy', glyph: '💼 🙇', text: 'はじめまして。わたしは 会(かい)社(しゃ)員(いん)です。よろしく おねがいします。', en: "Nice to meet you. I'm an office worker — I study here in the evenings." },
        { speaker: 'nexmax', sprite: 'nexmax:hello', glyph: '🧑‍🎓 🤖', text: 'はじめまして。ぼくは ネクマックスです。学(がく)生(せい)です！', en: "Nice to meet you. I'm Nexmax — a student!" },
        { speaker: 'teacher', sprite: 'teacher:happy', glyph: '🫵 🧑‍🎓', text: 'あなたも 学(がく)生(せい)ですね。', en: "And you're a student too." },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏥 👉', text: 'びょういんへ いきましょう！', en: "Let's go to the clinic!" },
      ],
    },
  },
  'moji-1-7': {
    intro: {
      stageId: 'moji-1-7',
      lines: [
        { bg: 'naniwa_clinic', text: 'がっこうの となりの びょういんです。', en: 'The clinic next to the school.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🤖 😵‍💫', text: 'あたまが ぐるぐる します……じしょの データが ありません……', en: 'My head is spinning… some of my dictionary data is missing…' },
        { glyph: '🚪 📕 ❓', text: 'ドアの ふだも、ほんの じも、ありません。', en: 'The plate on the door and the words in the books are gone.' },
        { speaker: 'doctor', sprite: 'doctor:trouble', glyph: '🩺 📕❓', text: 'この ほんが よめません。くすりが わかりません……😰', en: "I can't read this book, so I can't tell which medicine to give…" },
        { speaker: 'rin', sprite: 'rin:trouble', glyph: '📕 🔍', text: 'すみません。わたしの ほんは どこですか？', en: 'Excuse me. Where is my book?' },
        { text: '医(い)者(しゃ)、本(ほん)、中(ちゅう)国(ごく)、人(じん)……おとだけ、のこって います。', en: 'Only the sounds are left: isha, hon, chuugoku, jin.' },
        { glyph: '📚 👀', text: '……ペラペラ。ほんだなの うしろで、なにかが ページを たべて います。', en: 'Flip, flip. Behind the bookshelf something is eating pages.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-7',
      lines: [
        { bg: 'naniwa_clinic', glyph: '医(い) 者(しゃ) 本(ほん) 中(ちゅう) 国(ごく) 人(じん)', text: 'ふだと ほんが ひかります。💡', en: 'The door plate and the books light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_book', sprite: 'mojikui_book:normal', text: 'ほんの じは ごちそう！ ぜんぶ たべます！ 😋', en: "Words in books are a feast! I'll eat them all!" },
        { speaker: 'rin', sprite: 'rin:trouble', text: 'わたしの ほん……！ 😱', en: 'My book…!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ほんの モジクイです！', en: 'The book Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-7',
      lines: [
        { bg: 'naniwa_clinic', fx: ['darkclouds'], sprite: 'mojikui_book:normal', glyph: '🕰️ 💨', text: 'モジクイは まちの とけいだいへ にげました。', en: 'The Mojikui fled to the town clock tower.' },
        { fx: ['spring'], sprite: 'doctor:happy', glyph: '医(い)者(しゃ) 📕 本(ほん)', text: 'ふだと ほんの じが もどりました！', en: 'The door plate and the words in the books came back!' },
        { speaker: 'doctor', sprite: 'doctor:happy', glyph: '🩺 💊 🤖', text: 'わたしは 医(い)者(しゃ)です。この くすりを どうぞ。', en: "I'm the doctor. Here, take this medicine." },
        { fx: ['heal'], speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🤖 ✨', text: 'あたまが すっきり！ なおりました！', en: 'My head is clear! I feel better!' },
        { speaker: 'rin', sprite: 'rin:happy', glyph: '📕 💕', text: 'わたしの 本(ほん)です！ ありがとう ございます。', en: "That's my book! Thank you so much." },
        { speaker: 'rin', sprite: 'rin:happy', glyph: '🌏 → 🏙️', text: 'はじめまして。わたしは リンです。中(ちゅう)国(ごく)人(じん)です。', en: "Nice to meet you. I'm Rin. I'm from China." },
        { speaker: 'rin', sprite: 'rin:happy', glyph: '🧑‍🎓 🏫', text: '中(ちゅう)国(ごく)から きました。がっこうの 学(がく)生(せい)です。', en: "I came from China. I'm a student at the school." },
        { speaker: 'nexmax', sprite: 'nexmax:hello', glyph: '🤖 🤝 🧑‍🎓', text: 'ぼくは ネクマックスです。日(に)本(ほん)の ロボットです！', en: "I'm Nexmax, a robot from Japan!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🕰️ 👉', text: 'とけいだいへ いきましょう！', en: "Let's go to the clock tower!" },
      ],
    },
  },
  'moji-1-8': {
    intro: {
      stageId: 'moji-1-8',
      lines: [
        { bg: 'naniwa_clocktower', text: 'まちの ひろばの、おおきな とけいだいです。', en: 'The big clock tower in the town square.' },
        { glyph: '🕰️ ❓ 🌙', text: 'もじばんの じが ありません。はりが とまって います。', en: 'The numbers on the dial are gone. The hands have stopped.' },
        { speaker: 'keeper', sprite: 'keeper:trouble', glyph: '⌚ ❓', text: '今(いま) 何(なん)時(じ)ですか？ あさが きません……😰', en: "What time is it now? Morning won't come…" },
        { glyph: '🌅 ☀️ 🌙 ❓', text: 'あさ？ ひる？ ばん？ だれも わかりません。', en: 'Morning? Noon? Night? Nobody can tell.' },
        { text: '今(いま)、朝(あさ)、昼(ひる)、晩(ばん)、時(じ)、分(ふん)、半(はん)……おとだけ、のこって います。', en: 'Only the sounds are left: ima, asa, hiru, ban, ji, fun, han.' },
        { glyph: '⚙️ 👀', text: '……チク、タク、ガブッ。とけいの なかに、おおきな かげが……。', en: 'Tick, tock, chomp. A big shadow inside the clock…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-8',
      lines: [
        { bg: 'naniwa_clocktower', glyph: '今(いま) 朝(あさ) 昼(ひる) 晩(ばん) 時(じ) 分(ふん) 半(はん)', text: 'もじばんが ひかります。💡', en: 'The clock face lights up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_clocktower', sprite: 'mojikui_clocktower:normal', text: 'じかんは わたしが たべます！ ずっと よるです！ 🌙😈', en: 'If I eat time, it stays night forever!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'おおきい……！ とけいだいの モジクイです！', en: "It's huge…! The clock-tower Mojikui!" },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-8',
      lines: [
        { bg: 'naniwa_clocktower', fx: ['darkclouds'], sprite: 'mojikui_clocktower:normal', glyph: '🏪 💨', text: 'モジクイは しょうてんがいへ にげました。', en: 'The Mojikui fled to the shopping arcade.' },
        { fx: ['spring'], sprite: 'keeper:happy', glyph: '🕰️ ✨ 🌅', text: 'とけいが うごきました！ まちに 朝(あさ)が きました。', en: 'The clock moves again! Morning comes to the town.' },
        { speaker: 'keeper', sprite: 'keeper:happy', glyph: '🕢', text: '今(いま) 七(しち)時(じ)半(はん)です！', en: "It's half past seven!" },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🌅 🍞', text: '朝(あさ)ですね！ おはようございます！', en: "It's morning! Good morning!" },
        { speaker: 'keeper', sprite: 'keeper:happy', glyph: '🌅 ☀️ 🌙', text: '朝(あさ)、昼(ひる)、晩(ばん)。もう だいじょうぶです。', en: 'Morning, noon and night — all back in order.' },
        { speaker: 'keeper', sprite: 'keeper:trouble', glyph: '🏪 🚪❓', text: 'でも、しょうてんがいの おみせが あきません……', en: "But the shops in the arcade won't open…" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🏪 👉', text: 'しょうてんがいへ いきましょう！', en: "Let's go to the arcade!" },
      ],
    },
  },
  'moji-1-9': {
    intro: {
      stageId: 'moji-1-9',
      lines: [
        { bg: 'naniwa_shopstreet', text: 'まちの しょうてんがいです。', en: "The town's covered shopping arcade." },
        { glyph: '🏪 🪧❓', text: 'おみせの ふだの じが、ありません。', en: "The letters on the shops' signs are gone." },
        { speaker: 'baker', sprite: 'baker:trouble', glyph: '🍞 🚪❓', text: 'きょうは 休(やす)みですか？ わたしも わかりません……💦', en: "Are we closed today? Even I don't know…" },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🕘 ➡️ 🕔 ❓', text: '何(なん)時(じ)から 何(なん)時(じ)までですか？', en: 'From what time until what time are you open?' },
        { text: '午(ご)前(ぜん)、午(ご)後(ご)、休(やす)み、毎(まい)日(にち)、何(なん)……おとだけ、のこって います。', en: 'Only the sounds are left: gozen, gogo, yasumi, mainichi, nan.' },
        { glyph: '🪧 👀', text: '……バリッ。かんばんを かじる おとが……。', en: 'Crack! The sound of something biting a signboard…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-9',
      lines: [
        { bg: 'naniwa_shopstreet', glyph: '午(ご) 前(ぜん) 後(ご) 休(やす) 毎(まい) 何(なん)', text: 'ふだが ひかります。💡', en: 'The signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_signboard', sprite: 'mojikui_signboard:normal', text: 'おみせは ずっと 休(やす)み！ パンは わたしが たべます！ 😋', en: "The shops stay closed forever! I'll eat the bread!" },
        { speaker: 'baker', sprite: 'baker:trouble', text: 'わたしの パン……！ 😱', en: 'My bread…!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かんばんの モジクイです！', en: 'The signboard Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-9',
      lines: [
        { bg: 'naniwa_shopstreet', fx: ['darkclouds'], sprite: 'mojikui_signboard:normal', glyph: '🚏 💨', text: 'モジクイは バスていの ほうへ にげました。', en: 'The Mojikui fled toward the bus stop.' },
        { fx: ['spring'], sprite: 'baker:happy', glyph: '🏪 ✨ 🍞', text: 'ふだが もどって、おみせが あきました！', en: 'The signs came back, and the shops opened!' },
        { speaker: 'baker', sprite: 'baker:happy', glyph: '🕗 ➡️ 🕕', text: '午(ご)前(ぜん) 八(はち)時(じ)から 午(ご)後(ご) 六(ろく)時(じ)までです。', en: "We're open from 8 a.m. to 6 p.m." },
        { speaker: 'baker', sprite: 'baker:happy', glyph: '📅 ✅', text: '毎(まい)日(にち) やって います。休(やす)みは ありません！', en: "We're open every day — no days off!" },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '🍞 😋', text: 'これは 何(なん)ですか？ ……おいしい！', en: 'What is this? …Delicious!' },
        { speaker: 'baker', sprite: 'baker:happy', glyph: '🚏 👀 🌑', text: 'けさ、バスていで くろい かげを みましたよ。', en: 'This morning I saw a black shadow at the bus stop.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🚏 👉', text: 'バスていへ いきましょう！', en: "Let's go to the bus stop!" },
      ],
    },
  },
  'moji-1-10': {
    intro: {
      stageId: 'moji-1-10',
      lines: [
        { bg: 'naniwa_bus_stop', text: 'がっこうの まえの バスていです。', en: 'The bus stop in front of the school.' },
        { glyph: '🚌 🪧❓', text: 'バスの いきさきの じが、ありません。', en: "The bus's destination sign is blank." },
        { speaker: 'driver', sprite: 'driver:trouble', glyph: '🚌 ❓', text: 'この バスは どこへ いきますか？ わたしも わかりません……😰', en: "Where does this bus go? Even I don't know…" },
        { speaker: 'rin', sprite: 'rin:trouble', glyph: '📅 ❓', text: 'がっこうの よていひょうも ありません。来(らい)週(しゅう)は 何(なん)ですか？', en: "The school's schedule is blank too. What's on next week?" },
        { text: '行(い)く、来(く)る、校(こう)、週(しゅう)、去(きょ)年(ねん)……おとだけ、のこって います。', en: 'Only the sounds are left: iku, kuru, kou, shuu, kyonen.' },
        { glyph: '🚏 👀', text: '……ギギギ。バスていの ふだを まげる かげが……。', en: 'Creak… a shadow is bending the bus-stop sign…' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-10',
      lines: [
        { bg: 'naniwa_bus_stop', glyph: '行(い) 来(く) 校(こう) 週(しゅう) 去(きょ) 年(ねん)', text: 'バスの ふだが ひかります。💡', en: "The bus's sign lights up." },
        { fx: ['darkclouds'], speaker: 'mojikui_bus', sprite: 'mojikui_bus:normal', text: 'バスは どこへも いきません！ ブルルン！ 😈', en: 'The bus goes nowhere! Vroom!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'バスの モジクイです！', en: 'The bus Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-10',
      lines: [
        { bg: 'naniwa_bus_stop', fx: ['darkclouds'], sprite: 'mojikui_bus:normal', glyph: '🚉 💨', text: 'モジクイは えきへ にげました。', en: 'The Mojikui fled to the station.' },
        { fx: ['spring'], sprite: 'driver:happy', glyph: '🚌 ✨', text: 'いきさきが もどって、バスが うごきます！', en: 'The destination is back — the bus can run!' },
        { speaker: 'driver', sprite: 'driver:happy', glyph: '🚌 → 🏫', text: 'この バスは 学(がっ)校(こう)へ 行(い)きます！', en: 'This bus goes to the school!' },
        { speaker: 'rin', sprite: 'rin:happy', glyph: '🌏 → 🗾', text: 'わたしは 去(きょ)年(ねん) 日(に)本(ほん)へ 来(き)ました。', en: 'I came to Japan last year.' },
        { speaker: 'rin', sprite: 'rin:happy', glyph: '🧑‍🎓 🏫', text: '毎(まい)日(にち) 学(がっ)校(こう)へ 行(い)きます。', en: 'I go to school every day.' },
        { speaker: 'teacher', sprite: 'teacher:happy', glyph: '📅 ➡️ 🏫', text: '来(らい)週(しゅう)も 学(がっ)校(こう)へ 来(き)て くださいね。', en: 'Please come to school next week too.' },
        { speaker: 'driver', sprite: 'driver:happy', glyph: '🚌 → 🚉', text: 'えきまで のって ください！', en: "Hop on — I'll take you to the station!" },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🚉 👉', text: 'えきへ 行(い)きましょう！', en: "Let's go to the station!" },
      ],
    },
  },
  'moji-1-11': {
    intro: {
      stageId: 'moji-1-11',
      lines: [
        { bg: 'naniwa_station_deep', text: 'まちの えきの、いちばん おくです。', en: 'The farthest end of the town station.' },
        { glyph: '🚉 🪧❓', text: 'えきの なまえも、でんしゃの ふだも、ありません。', en: "The station's name and the trains' signs are gone." },
        { speaker: 'staff', sprite: 'staff:trouble', glyph: '🚃 ❌', text: 'でんしゃが うごきません。まちの あしが とまりました……😰', en: "The trains won't move. The whole town is stuck…" },
        { glyph: '🌑 🕳️', text: 'トンネルの おくから、くろい けむりが でて います。', en: 'Black smoke is seeping out of the tunnel.' },
        { text: '駅(えき)、電(でん)車(しゃ)、自(じ)転(てん)車(しゃ)……おとだけ、のこって います。', en: 'Only the sounds are left: eki, densha, jitensha.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🚃 ❌ → 🚲 ❓', text: 'でんしゃは ありません……じてんしゃで いきますか？', en: "If the trains are down… shall we go by bicycle?" },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！', en: "Let's write!" },
      ],
    },
    encounter: {
      stageId: 'moji-1-11',
      lines: [
        { bg: 'naniwa_station_deep', glyph: '駅(えき) 電(でん) 車(しゃ) 自(じ) 転(てん)', text: 'えきの ふだが ひかります。💡', en: 'The station signs light up.' },
        { fx: ['darkclouds'], speaker: 'mojikui_station', sprite: 'mojikui_station:normal', text: 'この さきは わたしたちの す！ だれも とおしません！ 😈', en: 'Beyond here is our nest! No one gets through!' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'えきの モジクイです！', en: 'The station Mojikui!' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
      ],
    },
    outro: {
      stageId: 'moji-1-11',
      lines: [
        { bg: 'naniwa_station_deep', fx: ['darkclouds'], sprite: 'mojikui_station:normal', glyph: '🕳️ 💨', text: 'モジクイは トンネルの おくへ にげました。', en: 'The Mojikui fled deep into the tunnel.' },
        { fx: ['spring'], sprite: 'staff:happy', glyph: '🚉 🚃 ✨', text: '駅(えき)の なまえが もどって、電(でん)車(しゃ)が うごきます！', en: "The station's name is back, and the trains run again!" },
        { speaker: 'staff', sprite: 'staff:happy', glyph: '🚲 🚲', text: 'トンネルの おくへは、この 自(じ)転(てん)車(しゃ)で 行(い)って ください！', en: 'Take these bicycles into the tunnel!' },
        { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🕳️ 👾👾👾', text: 'あの おくが、モジクイの すです。', en: "Deep in there is the Mojikui's nest." },
        { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '🚲 💨 🕳️', text: '自(じ)転(てん)車(しゃ)で 行(い)きましょう！ ✊', en: "Let's go by bicycle!" },
      ],
    },
  },
};

/**
 * 1章 12話 まとめの ボス（10 §2・§3, data/mojiFinale.ts）: 11話の あと、自転車で トンネルの 奥の 巣へ。
 * intro は 大モジクイと 向き合って 終わる（そのあと じゅんび・たたかい）。outro は 町の 灯りが
 * ぜんぶ 戻り、海の むこうの 町（2章）が 霧に かくれて いる。1章の 字は もう 書いて あるので 漢字で 出る。
 */
export const MOJI1_FINALE: FinaleScript = {
  intro: {
    stageId: 'moji-1-boss',
    lines: [
      { bg: 'naniwa_nest', glyph: '🚲 💨 🕳️', text: '自(じ)転(てん)車(しゃ)で、トンネルの おくへ きました。', en: 'We rode the bicycles deep into the tunnel.' },
      { glyph: '🪧 🕰️ 📕 🏷️', text: 'かんばん、とけい、本(ほん)、ねふだ……ぜんぶ ここに あります！', en: 'The eaten signs, clocks, books and price tags — they are all here.' },
      { glyph: '🫧 ✨', text: 'あわの なかに、じが あります。', en: 'Letters are trapped inside the bubbles.' },
      { fx: ['darkclouds'], speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', text: 'よく きました。わたしが 大(おお)モジクイです！ 😈', en: 'So you made it. I am the Great Mojikui!' },
      { speaker: 'mojikui_boss', sprite: 'mojikui_boss:normal', glyph: '👀 ✍️ ❓', text: 'あなたの にがてな じは どれですか？ その じから たべます！', en: "Which letters are you weakest at? I'll eat those first!" },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '✍️ 6️⃣0️⃣', text: 'にがてな じは ありません！ ぜんぶ かきます！', en: 'No weak letters here! We can write every letter we brought back to the town!' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '✍️ → 💡 → 🤖', text: 'あなたは かきます。ぼくが たたかいます！', en: "You write. I'll fight!" },
    ],
  },
  outro: {
    stageId: 'moji-1-boss',
    lines: [
      { bg: 'naniwa_nest', fx: ['sparkle'], glyph: '🫧💥 ✨✨✨', text: 'あわが われました！ じが そとへ とびます！', en: 'The bubbles burst, and the letters fly out!' },
      { fx: ['darkclouds'], sprite: 'mojikui_boss:normal', glyph: '🌊 💨', text: '大(おお)モジクイは、うみの むこうへ にげました。', en: 'The Great Mojikui fled across the sea.' },
      { bg: 'naniwa_lights_back', fx: ['spring'], sprite: 'yamada:happy', glyph: '🏙️ 💡💡💡', text: 'ナニワタウンの あかりが、ぜんぶ もどりました！', en: "All of Naniwa Town's lights are back on!" },
      { speaker: 'yamada', sprite: 'yamada:happy', glyph: '💐', text: '山(やま)田(だ)です。ありがとう ございます！', en: "It's Yamada. Thank you so much!" },
      { speaker: 'rin', sprite: 'rin:happy', glyph: '🧑‍🎓 🏫', text: '来(らい)週(しゅう)も 学(がっ)校(こう)で あいましょう！', en: 'See you at school next week!' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '✍️ 🎉', text: 'ありがとう！ あなたの じで、まちが もどりました。', en: 'Thank you! Your writing brought the town back.' },
      { speaker: 'rin', sprite: 'rin:happy', glyph: '✍️ 🆚 ✍️', text: 'こんどは、じを かいて しょうぶ しましょう！', en: "Next time, let's have a writing match!" },
      { speaker: 'nexmax', sprite: 'nexmax:guide', glyph: '⚔️ ✍️ 🧑‍🤝‍🧑', text: '「たいせん」が ひらきました！ ほかの 人(ひと)と じで しょうぶ します！', en: 'Versus is open: race other players to write the same letters!' },
      { glyph: '🌊 🌫️ 🏙️ ❓', text: 'でも……うみの むこうの まちが、きりで みえません。', en: 'But… the town across the sea is hidden in fog.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', glyph: '🌫️ 👾', text: 'あそこにも、モジクイが います……？', en: 'There may be Mojikui over there too.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', glyph: '⛴️ 👉 🌫️', text: 'つぎは あの まちへ 行(い)きましょう！', en: "Next, let's go to that town!" },
    ],
  },
};
