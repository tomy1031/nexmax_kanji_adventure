import type { CastMember, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * 現代編 の 脚本 — 「夢を信じたネクマックス 〜暗黒の社会人デビュー編〜」#1.
 *
 * Adapted from the original manga (docs/design/現代編の構成メモ.md §2), one
 * stage per scene. Two rules, both decided with the client:
 *
 *   - **No violence is shown** (2026-09-23). The late trio in #1 is struck on
 *     the head in the original; here they are shouted at, and the fear is
 *     carried by the room — the clock, the faceless seniors, the silence.
 *     The push-ups that follow in the original are left out too.
 *   - **The one scolded is never a named character.** The latecomers are
 *     「新人(しんじん)の 三人(さんにん)」, as in the original, and the seniors are
 *     「影(かげ)の 先輩(せんぱい)」, drawn as a silhouette with no face.
 *
 * The heart of the episode is stage 6: not knowing what is happening, and
 * finding that the people next to you do not know either. 「おれたちも
 * 一緒(いっしょ)だよ」.
 *
 * Every kanji carries its reading; the test checks it, and checks that every
 * annotated word has an English gloss for the ことば button.
 */

export const GENDAI_CAST: CastMember[] = [
  MUKASHI_CAST.find((c) => c.id === 'nexmax')!,
  {
    id: 'midori',
    name: 'ミドリ',
    color: '#3e9b3a',
    sprites: { normal: 'img/chara/cut/INTJ.webp' },
  },
  {
    id: 'kii',
    name: 'キイ',
    color: '#d9a400',
    sprites: { normal: 'img/chara/cut/ESFP_f.webp' },
  },
  {
    id: 'senpai',
    name: '影(かげ)の 先輩(せんぱい)',
    color: '#3a2f4a',
    sprites: { normal: 'img/chara/cut/ESTJ.webp' },
    silhouette: true,
  },
  {
    id: 'okami',
    name: 'おかみさん',
    color: '#b0584a',
    sprites: { normal: 'img/chara/cut/ESFJ_f.webp' },
  },
];

export const GENDAI_SCRIPTS: NovelScript[] = [
  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-1',
    lines: [
      { bg: 'gendai_hall', fx: ['cheer'], text: '春(はる)。ネクマックスは 会社(かいしゃ)に 入(はい)りました。' },
      { text: '今日(きょう)は 入社式(にゅうしゃしき)。新(あたら)しい 社員(しゃいん)が 五十人(ごじゅうにん) 集(あつ)まって います。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: '今日(きょう)から、ぼくも 社会人(しゃかいじん)だ！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'むかし 村(むら)で 字(じ)を おぼえた ロボットが、いまは 会社(かいしゃ)で はたらく。……ちょっと ふしぎだな。' },
      { speaker: null, sprite: 'none', fx: [], text: '式(しき)が 終(お)わると、アナウンスが ありました。' },
      { text: '「新人(しんじん)は このまま バスに 乗(の)って ください。研修(けんしゅう)に 出発(しゅっぱつ)します」' },
      { speaker: 'kii', sprite: 'kii:normal', text: 'ねえ、研修(けんしゅう)って 何日(なんにち)？' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: '九十日(きゅうじゅうにち)だって。' },
      {
        speaker: 'kii',
        sprite: 'kii:normal',
        text: '九十日(きゅうじゅうにち)！？ ……でも、なかまも できるよね。',
        choices: [
          { label: 'きっと 楽(たの)しいよ', next: 'fun' },
          { label: 'ちょっと ふあんだな', next: 'worry' },
        ],
      },
      { label: 'fun', speaker: 'nexmax', sprite: 'nexmax:smile', text: 'きっと 楽(たの)しいよ。いろいろな 人(ひと)と 話(はな)せる。', goto: 'join' },
      { label: 'worry', speaker: 'nexmax', sprite: 'nexmax:think', text: 'ちょっと ふあんだな。でも、みんな 同(おな)じ 一年目(いちねんめ)だ。' },
      { label: 'join', speaker: null, sprite: 'none', text: 'みんな、ワクワク して いました。' },
      { text: '——この ときは、まだ。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-2',
    lines: [
      { bg: 'gendai_bus', text: 'バスは 高速道路(こうそくどうろ)を 走(はし)って います。' },
      { text: '行(い)き先(さき)は、静岡県(しずおかけん)の 富士山(ふじさん)の ふもとです。' },
      { speaker: 'midori', sprite: 'midori:normal', text: '……となり、いい？ おれは ミドリ。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ネクマックスです。よろしく！' },
      { speaker: 'midori', sprite: 'midori:normal', text: '前(まえ)の 席(せき)、見(み)て。' },
      { speaker: null, sprite: 'none', text: '前(まえ)の 席(せき)には、黒(くろ)い スーツの 人(ひと)が 三人(さんにん) すわって いました。' },
      { text: 'だれも 話(はな)しません。バスの 中(なか)は、しんと して います。' },
      { speaker: 'kii', sprite: 'kii:normal', text: 'あの 人(ひと)たち、先輩(せんぱい)かな……。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'うしろからじゃ、顔(かお)が 見(み)えないね。' },
      { speaker: null, sprite: 'none', fx: ['dusk'], text: '窓(まど)の 外(そと)に、大(おお)きな 富士山(ふじさん)が 見(み)えて きました。' },
      { text: '道(みち)は だんだん 細(ほそ)く なり、町(まち)の 明(あ)かりが 見(み)えなく なりました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-3',
    lines: [
      { bg: 'gendai_forest', fx: ['gloom'], text: 'バスが 止(と)まったのは、深(ふか)い 森(もり)の 中(なか)でした。' },
      { text: 'まわりには 何(なに)も ありません。店(みせ)も、駅(えき)も、家(いえ)も。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ここが 研修所(けんしゅうじょ)……？' },
      { speaker: 'okami', sprite: 'okami:normal', text: '……いらっしゃい。' },
      { speaker: null, sprite: 'none', text: '宿(やど)の おかみさんたちは、みんな 暗(くら)い 顔(かお)を して いました。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（どうして みんな、こんなに 暗(くら)い 顔(かお)を して いるんだろう）' },
      { speaker: 'senpai', sprite: 'senpai:normal', text: '早(はや)く 着(き)がえて こい！ 五分(ごふん)いないだ！' },
      { speaker: 'kii', sprite: 'kii:normal', text: '五分(ごふん)！？ 早(はや)すぎるよ……！' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-4',
    lines: [
      { bg: 'gendai_dining', fx: ['tension'], text: '部屋(へや)に もどる 時間(じかん)は ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'トイレだけ 行(い)って、食堂(しょくどう)へ 走(はし)ろう！' },
      { speaker: null, sprite: 'none', fx: ['seniors', 'tension'], text: '食堂(しょくどう)には、もう 先輩(せんぱい)たちが 待(ま)って いました。' },
      { text: 'バスに いた 三人(さんにん)。そして、おくに すわって いる 人(ひと)たち。' },
      { speaker: 'midori', sprite: 'midori:normal', text: '……たぶん、あれが いちばん 上(うえ)の 人(ひと)たちだ。' },
      { speaker: null, sprite: 'none', text: '時計(とけい)の 音(おと)だけが、カチ、カチ、と ひびいて います。' },
      { speaker: 'kii', sprite: 'kii:normal', text: 'まだ 来(き)て いない 人(ひと)が いる……。' },
      { speaker: null, sprite: 'none', text: '集合(しゅうごう)時間(じかん)を すぎて、新人(しんじん)が 三人(さんにん)、走(はし)って 入(はい)って きました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-5',
    lines: [
      { bg: 'gendai_dining', fx: ['seniors', 'tension', 'shout'], speaker: 'senpai', sprite: 'senpai:normal', text: '何(なに)を して いたんだ！？' },
      { speaker: null, sprite: 'none', fx: ['seniors', 'tension'], text: '大(おお)きな 声(こえ)が、食堂(しょくどう)じゅうに ひびきました。' },
      { text: '新人(しんじん)の 三人(さんにん)の 一人(ひとり)が、小(ちい)さな 声(こえ)で 答(こた)えました。「ト、トイレです……」' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['seniors', 'tension', 'shout'], text: '集合(しゅうごう)時間(じかん)に 間(ま)に合(あ)わないなら、がまん しろ！' },
      { speaker: null, sprite: 'none', fx: ['seniors', 'tension'], text: 'だれも 動(うご)けません。息(いき)を する 音(おと)さえ 聞(き)こえそうです。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（えげつないな……）' },
      { speaker: 'nexmax', text: '（ルールが あるのは 分(わ)かる。でも、何(なに)が 正(ただ)しいのか、ぼくには まだ 分(わ)からない）' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['seniors', 'shout'], text: 'よーし、ならべ！ 今(いま)から 名前(なまえ)を 呼(よ)んで いく！' },
      { speaker: null, sprite: 'none', fx: ['seniors'], text: '名前(なまえ)を 呼(よ)ばれた 人(ひと)から、ならんで いきます。' },
      { fx: [], text: 'ネクマックスたちの チームは、先(さき)に 部屋(へや)へ もどって いいと 言(い)われました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'gendai-6',
    lines: [
      { bg: 'gendai_room', text: '部屋(へや)に もどって、やっと 少(すこ)し ホッと しました。' },
      { speaker: 'midori', sprite: 'midori:normal', text: '……自己紹介(じこしょうかい)、しようか。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ネクマックスです。村(むら)の 出身(しゅっしん)です。' },
      { speaker: 'kii', sprite: 'kii:normal', text: 'キイです！ 小(ちい)さな 町(まち)の 出身(しゅっしん)。兄(あに)が 一人(ひとり) います。' },
      { speaker: 'midori', sprite: 'midori:normal', text: 'ミドリ。東京(とうきょう)から 来(き)た。家族(かぞく)は 父(ちち)と 母(はは)と 妹(いもうと)。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……正直(しょうじき)に 言(い)うね。何(なに)が 起(お)きて いるのか 分(わ)からなくて、とまどって いるんだ。' },
      { speaker: 'midori', sprite: 'midori:normal', fx: ['warm'], text: 'おれたちも 一緒(いっしょ)だよ。' },
      {
        speaker: 'kii',
        sprite: 'kii:normal',
        text: 'これが 一(いっ)か月(げつ) つづくのかな……。社会人(しゃかいじん)って、こんなに きびしいのかな……。',
        choices: [
          { label: '一人(ひとり)じゃ ないから、だいじょうぶ', next: 'together' },
          { label: '分(わ)からない ことは、聞(き)いて いこう', next: 'ask' },
        ],
      },
      { label: 'together', speaker: 'nexmax', sprite: 'nexmax:smile', text: '一人(ひとり)じゃ ないから、だいじょうぶ。三人(さんにん)で がんばろう。', goto: 'join' },
      { label: 'ask', speaker: 'nexmax', sprite: 'nexmax:determined', text: '分(わ)からない ことは、聞(き)いて いこう。言葉(ことば)で 聞(き)けば、きっと 分(わ)かる。' },
      { label: 'join', speaker: null, sprite: 'none', text: '分(わ)からない ことは、まだ たくさん あります。' },
      { text: 'でも、同(おな)じ 気持(きも)ちの なかまが いる。それだけで、少(すこ)し 楽(らく)に なりました。' },
      { text: '〈現代編(げんだいへん) 6話(わ)まで。つづきは じゅんび中(ちゅう)〉' },
    ],
  },
];
