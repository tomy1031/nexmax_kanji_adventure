import type { CastMember, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

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
 */

export const MOJI1_CAST: CastMember[] = [
  ...MUKASHI_CAST.filter((c) => c.id === 'nexmax'),
  { id: 'yamada', name: '山(やま)田(だ)さん', color: '#e2799a', sprites: { normal: 'img/chara/cut/ESFJ_f.webp' } },
];

interface EpisodeScript {
  intro: NovelScript;
  outro: NovelScript;
}

export const MOJI1_SCRIPTS: Record<string, EpisodeScript> = {
  'moji-1-1': {
    intro: {
      stageId: 'moji-1-1',
      lines: [
        { bg: 'gendai_city', text: 'でんしゃが、うえの まちに つきました。', en: 'The train arrives in the upper town.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ここは えきです。', en: 'This is the station.' },
        { glyph: '📅 ❓', text: 'えきの カレンダーの じが、ありません。', en: 'The letters on the station calendar are gone.' },
        { text: '日(にち)、月(げつ)、火(か)、水(すい)、木(もく)……おとだけ、のこって います。', en: 'Only the sounds are left: nichi, getsu, ka, sui, moku.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'かんじが ない。🪨🪨🪨🪨🪨', en: 'No kanji. Five rocks.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！', en: "Let's write!" },
      ],
    },
    outro: {
      stageId: 'moji-1-1',
      lines: [
        { bg: 'gendai_city', fx: ['spring'], glyph: '日(にち) 月(げつ) 火(か) 水(すい) 木(もく)', text: 'カレンダーに かんじが もどりました！', en: 'The kanji came back to the calendar!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '☀️ 🌙 🔥 💧 🌳', text: '日(ひ)、月(つき)、火(ひ)、水(みず)、木(き)。', en: 'Sun, moon, fire, water, tree.' },
        { speaker: 'nexmax', text: 'きょうは 月(げつ)曜(よう)日(び)です。', en: 'Today is Monday.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '金(きん)曜(よう)日(び)と 土(ど)曜(よう)日(び)は？', en: 'What about Friday and Saturday?' },
        { glyph: '金(きん) 土(ど)', text: 'まだ、おとだけです。', en: 'Still only sounds.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いきましょう！', en: "Let's go!" },
      ],
    },
  },
  'moji-1-2': {
    intro: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'gendai_city', text: 'えきの まえに、ロボットが います。', en: 'A robot stands in front of the station.' },
        { speaker: 'yamada', sprite: 'yamada:normal', text: 'はじめまして。わたしは 山(やま)田(だ)です。', en: 'Nice to meet you. I am Yamada.' },
        { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'はじめまして。ぼくは ネクマックスです。', en: 'Nice to meet you. I am Nexmax.' },
        { speaker: 'yamada', sprite: 'yamada:normal', glyph: '山(やま)田(だ)', text: 'わたしの なまえの かんじが きえました。😢', en: 'The kanji of my name disappeared.' },
        { speaker: 'yamada', text: 'まちの ちずも……。', en: 'The town map too...' },
        { glyph: '山(やま) 川(かわ) 田(た)', text: '⛰️ 🏞️ 🌾', en: 'Mountain, river, rice field.' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: '金(きん)曜(よう)日(び)、土(ど)曜(よう)日(び)も ありません。', en: 'Friday and Saturday are missing too.' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！', en: "Let's write!" },
      ],
    },
    outro: {
      stageId: 'moji-1-2',
      lines: [
        { bg: 'gendai_city', fx: ['spring'], speaker: 'yamada', sprite: 'yamada:normal', glyph: '山(やま)田(だ)', text: 'わたしの なまえ！ ありがとう！', en: 'My name! Thank you!' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', glyph: '⛰️ 🏞️ 🌾', text: '山(やま)、川(かわ)、田(た)。', en: 'Mountain, river, rice field.' },
        { speaker: 'nexmax', glyph: '金(きん) 土(ど)', text: '金(きん)曜(よう)日(び)、土(ど)曜(よう)日(び)。', en: 'Friday, Saturday.' },
        { speaker: 'yamada', sprite: 'yamada:normal', text: 'モジクイは 山(やま)の ほうへ いきました。👉', en: 'The Mojikui went toward the mountain.' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いきましょう、山(やま)田(だ)さん！', en: "Let's go, Yamada-san!" },
      ],
    },
  },
};
