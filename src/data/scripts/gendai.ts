import type { CastMember, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * 現代編 の 脚本 — 「夢を信じたネクマックス 〜暗黒の社会人デビュー編①〜」#1〜#5.
 *
 * Adapted from the original manga (docs/design/現代編の構成メモ.md §2), in the
 * order it was published. Rules, all decided with the client:
 *
 *   - **No violence is shown** (2026-09-23). The late trio in #1 is struck on
 *     the head in the original; here they are shouted at, and the fear is
 *     carried by the room — the clock, the faceless seniors, the silence.
 *     The push-ups (#1), the thrown object and the kneeling / bucket
 *     punishments (#2, #4) are left out too, and so is the senior lost in
 *     the forest (#4).
 *   - **The one scolded is never a named character.** The latecomers are
 *     「新人(しんじん)の 三人(さんにん)」, as in the original, and the seniors are
 *     「影(かげ)の 先輩(せんぱい)」, drawn as a silhouette with no face. The
 *     quarrelling pair in #2/#4 are an unnamed team.
 *   - **The team is the original's**: ソネ (沖縄), ナラ and イグーチ. Nexmax is
 *     from 大阪 and studied at a robot-contest university.
 *   - The 専務 is modelled on a real person and appears only in narration,
 *     as the original draws him: warm, and the reason Nexmax joined.
 *
 * The heart of #1 is stage 6: not knowing what is happening, and finding
 * that the people next to you do not know either. 「おれたちも 一緒(いっしょ)だよ」.
 * The original stops at #5 on 「分(わ)かったぞ！」 — so does stage 10.
 *
 * Every kanji carries its reading; the test checks it, and checks that every
 * annotated word has an English gloss for the ことば button.
 */

export const GENDAI_CAST: CastMember[] = [
  MUKASHI_CAST.find((c) => c.id === 'nexmax')!,
  {
    id: 'sone',
    name: 'ソネ',
    color: '#d9a400',
    sprites: { normal: 'img/chara/cut/ESFP.webp' },
  },
  {
    id: 'nara',
    name: 'ナラ',
    color: '#3e9b3a',
    sprites: { normal: 'img/chara/cut/INTP.webp' },
  },
  {
    id: 'iguchi',
    name: 'イグーチ',
    color: '#d0508a',
    sprites: { normal: 'img/chara/cut/ENFJ.webp' },
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
  // #1 — 入社式が 終わり、バスへ
  {
    stageId: 'gendai-1',
    lines: [
      { bg: 'gendai_hall', fx: ['cheer'], text: '春(はる)。入社式(にゅうしゃしき)が 終(お)わりました。' },
      { text: '新(あたら)しい 社員(しゃいん)は 五十人(ごじゅうにん)。みんな 同(おな)じ 一年目(いちねんめ)です。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: '今日(きょう)から、ぼくも 社会人(しゃかいじん)だ！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '大阪(おおさか)から 出(で)て きて、自分(じぶん)の 仕事(しごと)を 始(はじ)める。……ドキドキするな。' },
      { speaker: null, sprite: 'none', fx: [], text: '式(しき)の あと、アナウンスが ありました。' },
      { text: '「新入社員(しんにゅうしゃいん)は このまま バスに 乗(の)って ください。研修(けんしゅう)に 出発(しゅっぱつ)します」' },
      { speaker: 'sone', sprite: 'sone:normal', text: 'ねえ、研修(けんしゅう)って 何日(なんにち)？' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: '九十日(きゅうじゅうにち)だって。毎年(まいとし)の 合宿(がっしゅく)らしいよ。' },
      {
        speaker: 'sone',
        sprite: 'sone:normal',
        text: '九十日(きゅうじゅうにち)！？ ……でも、なかまも できるさぁ。',
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
      { speaker: 'nara', sprite: 'nara:normal', text: '……となり、いい？ おれは ナラ。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ネクマックスです。よろしく！' },
      { speaker: 'nara', sprite: 'nara:normal', text: '前(まえ)の 席(せき)、見(み)て。' },
      { speaker: null, sprite: 'none', text: '前(まえ)の 席(せき)には、黒(くろ)い スーツの 人(ひと)が 三人(さんにん) すわって いました。' },
      { text: 'だれも 話(はな)しません。バスの 中(なか)は、しんと して います。' },
      { speaker: 'sone', sprite: 'sone:normal', text: 'あの 人(ひと)たち、先輩(せんぱい)かな……。' },
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
      { speaker: 'sone', sprite: 'sone:normal', text: '五分(ごふん)！？ 早(はや)すぎるさぁ……！' },
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
      { speaker: 'iguchi', sprite: 'iguchi:normal', text: '……たぶん、あれが いちばん 上(うえ)の 人(ひと)たちだ。' },
      { speaker: null, sprite: 'none', text: '時計(とけい)の 音(おと)だけが、カチ、カチ、と ひびいて います。' },
      { speaker: 'nara', sprite: 'nara:normal', text: 'まだ 来(き)て いない 人(ひと)が いる……。' },
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
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'とりあえず、今日(きょう)は つかれたね……。' },
      { speaker: 'nara', sprite: 'nara:normal', text: 'まさか、まだ 合宿(がっしゅく)の 一日目(いちにちめ)なのかよ！' },
      { speaker: 'iguchi', sprite: 'iguchi:normal', text: 'ねる 前(まえ)に、自己紹介(じこしょうかい)しようか。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'あらためて よろしく！ ぼくは ネクマックス。大阪(おおさか)から 来(き)たんだ。' },
      { speaker: 'sone', sprite: 'sone:normal', text: 'おれは ソネさぁ！ 沖縄(おきなわ)から 来(き)たんだ！' },
      { speaker: 'sone', sprite: 'sone:normal', text: '「なんくるないさぁ」って 言(い)いたい ところだけど、なかなか 大変(たいへん)さぁ……。' },
      { speaker: null, sprite: 'none', text: '（「なんくるないさぁ」は 沖縄(おきなわ)の 言葉(ことば)で、「なんとか なるよ」と いう 意味(いみ)です）' },
      { speaker: 'nara', sprite: 'nara:normal', text: 'おれは ナラ！ 家族(かぞく)は 父(ちち)と 母(はは)と 妹(いもうと)。' },
      { speaker: 'iguchi', sprite: 'iguchi:normal', text: 'おれは イグーチだよ！ 兄(あに)と 姉(あね)が いる。歌(うた)が 好(す)きなんだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……正直(しょうじき)に 言(い)うね。何(なに)が 起(お)こって いるのか 分(わ)からなくて、とまどって いるんだ。' },
      { speaker: 'iguchi', sprite: 'iguchi:normal', fx: ['warm'], text: 'おれたちも 一緒(いっしょ)だよ。' },
      { speaker: 'nara', sprite: 'nara:normal', text: 'これが まずは 一(いっ)か月(げつ) つづくのかな……。' },
      {
        speaker: 'sone',
        sprite: 'sone:normal',
        text: '社会人(しゃかいじん)って、こんなに きびしいのかな……。',
        choices: [
          { label: '一人(ひとり)じゃ ないから、だいじょうぶ', next: 'together' },
          { label: '分(わ)からない ことは、聞(き)いて いこう', next: 'ask' },
        ],
      },
      { label: 'together', speaker: 'nexmax', sprite: 'nexmax:smile', text: '一人(ひとり)じゃ ないから、だいじょうぶ。四人(よにん)で がんばろう。', goto: 'join' },
      { label: 'ask', speaker: 'nexmax', sprite: 'nexmax:determined', text: '分(わ)からない ことは、聞(き)いて いこう。言葉(ことば)で 聞(き)けば、きっと 分(わ)かる。' },
      { label: 'join', speaker: null, sprite: 'none', text: '分(わ)からない ことは、まだ たくさん あります。' },
      { text: 'でも、同(おな)じ 気持(きも)ちの なかまが いる。それだけで、少(すこ)し 楽(らく)に なりました。' },
    ],
  },

  // -------------------------------------------------------------------------
  // #2 前半 — 湖に むかって 意気込みを さけぶ
  {
    stageId: 'gendai-7',
    lines: [
      { bg: 'gendai_lake', text: '夜(よる)が 明(あ)けました。' },
      { text: '研修所(けんしゅうじょ)の 近(ちか)くの 湖(みずうみ)に、新人(しんじん)が 集(あつ)められました。' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: 'よーし、一人(ひとり)ずつ 湖(みずうみ)に むかって、社会人(しゃかいじん)の 意気込(いきご)みを さけべ！' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: [], text: 'おい、おまえからだ！ 自己紹介(じこしょうかい)もな！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（ええっ、ぼくから！？）' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', fx: ['shout'], text: 'ロボコン大学(だいがく)の ネクマックスと 申(もう)します！ 今日(きょう)から がんばります！' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: '何(なに)を がんばるんだ！ もっと くわしく 言(い)え！' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: [], text: 'ふざけたら、連帯責任(れんたいせきにん)だぞ！' },
      { speaker: null, sprite: 'none', text: '「連帯責任(れんたいせきにん)」は、一人(ひとり)が 失敗(しっぱい)すると、チーム みんなが 罰(ばつ)を うける ルールです。' },
      {
        speaker: 'nexmax',
        sprite: 'nexmax:think',
        text: '（何(なに)を、どう がんばるのか。そこまで 言(い)わないと、つたわらないんだ。……もう 一度(いちど)！）',
        choices: [
          { label: 'とにかく、ぜんぶ がんばります！', next: 'vague' },
          { label: '毎日(まいにち) プログラムを 書(か)いて、三(さん)か月(げつ)で アプリを 一(ひと)つ 作(つく)ります！', next: 'clear' },
        ],
      },
      { label: 'vague', speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: 'だから、何(なに)を だ！ 「ぜんぶ」では 何(なに)も 分(わ)からん！' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', fx: [], text: '毎日(まいにち) プログラムを 書(か)いて、三(さん)か月(げつ)で アプリを 一(ひと)つ 作(つく)ります！' },
      { label: 'clear', speaker: 'senpai', sprite: 'senpai:normal', fx: [], text: '……よし。つぎ！' },
      { speaker: null, sprite: 'none', text: '何(なに)を、いつまでに、どれだけ。くわしく 言(い)うと、聞(き)く 人(ひと)に つたわります。' },
      { text: 'それから 毎朝(まいあさ)、長(なが)い 道(みち)を 走(はし)る 競争(きょうそう)が ありました。負(ま)けた チームには 罰(ばつ)が あります。' },
      { fx: ['gloom'], text: 'だんだん、チームの 中(なか)で 言(い)い合(あ)いが 多(おお)く なりました。' },
      { text: 'となりの チームから、大(おお)きな 声(こえ)が 聞(き)こえます。「おまえの せいで 負(ま)けたんだ！」「そっちこそ！」' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（心(こころ)も 身(み)も、もう くたくただ……）' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（こんな はずじゃ なかった……）' },
    ],
  },

  // -------------------------------------------------------------------------
  // #2 後半 — 一年前、就活の ネクマックス
  {
    stageId: 'gendai-8',
    lines: [
      { bg: 'gendai_office', fx: ['memory'], text: '一年前(いちねんまえ)。' },
      { text: 'ネクマックスは 大学(だいがく)四年生(よねんせい)。就活(しゅうかつ)の まっさいちゅう でした。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ネクマックスと 申(もう)します！' },
      { speaker: null, sprite: 'none', text: '面接(めんせつ)を する 人(ひと)たちは、だまって ネクマックスの 頭(あたま)を 見(み)て います。' },
      { text: 'その 髪(かみ)は、明(あか)るい 茶色(ちゃいろ)でした。' },
      { text: '後日(ごじつ)。けっかは 不採用(ふさいよう)。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（ご縁(えん)が なかったか……）' },
      { bg: 'gendai_city', fx: ['memory'], speaker: null, sprite: 'none', text: 'また ある 日(ひ)は——' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'わっ、もう こんな 時間(じかん)！？ 大(だい)ちこくだ！ でも、行(い)くしか ない！' },
      { speaker: null, sprite: 'none', text: '面接(めんせつ)に おくれて、けっかは もちろん 不採用(ふさいよう)。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（とりあえず、髪(かみ)は 黒(くろ)に もどそうか……）' },
      { speaker: null, sprite: 'none', text: '次(つぎ)の 日(ひ)、大学(だいがく)で。友(とも)だちが 笑(わら)います。「はじめて 見(み)る ノーマル バージョン！」「似合(にあ)わないね！」' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'ぼくだって、こんなの したく なかったんだよ……。' },
      { speaker: null, sprite: 'none', text: 'ただ、それから 就活(しゅうかつ)は 一気(いっき)に 進(すす)み出(だ)しました。四(よん)社(しゃ)ほど、同時(どうじ)に 進(すす)みました。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（髪(かみ)の 色(いろ)だけで、こんなにも ちがうのか……）' },
      { bg: 'gendai_office', fx: ['memory', 'warm'], speaker: null, sprite: 'none', text: 'そして、最終面接(さいしゅうめんせつ)。' },
      { text: '「ネクマックスくんですね！ 今日(きょう)は よろしく お願(ねが)いします！」' },
      { text: 'この 方(かた)は 専務(せんむ)。会社(かいしゃ)の ナンバー2 でした。' },
      { text: '現場(げんば)を 大切(たいせつ)に する 方(かた)で、この 日(ひ)も 学生(がくせい)と 話(はな)したくて、面接(めんせつ)に 出(で)て いたのです。' },
      { text: '温(あたた)かい 人(ひと)がらの 会社(かいしゃ)で、世(よ)の中(なか)を よく して いきたい——。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '（ここまで 強(つよ)く 「そうだ」と 思(おも)ったのは、生(う)まれて はじめてだ）' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '（この 方(かた)の 下(もと)で はたらきたい）' },
      { speaker: null, sprite: 'none', text: 'そして 後日(ごじつ)——。' },
    ],
  },

  // -------------------------------------------------------------------------
  // #3 — 採用、代表スピーチ、そして バスへ
  {
    stageId: 'gendai-9',
    lines: [
      { bg: 'gendai_city', fx: ['spring'], text: 'とどいた 紙(かみ)には、「採用(さいよう)」と 書(か)いて ありました。' },
      { text: 'しかも、入社式(にゅうしゃしき)で 新入社員(しんにゅうしゃいん)の 代表(だいひょう)として スピーチを して ほしい、と 言(い)われました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '代表(だいひょう)で スピーチか。大役(たいやく)を いただけて、ありがたいな。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ぼくにも ついに、春(はる)が 来(き)た！' },
      { speaker: null, sprite: 'none', text: '——そして、次(つぎ)の 年(とし)の 四月(しがつ)。ホー、ホケキョ。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'ついに 今日(きょう)から、社会人(しゃかいじん)の 生活(せいかつ)が 始(はじ)まる！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（あの 専務(せんむ)のような 人(ひと)に、ぼくは なりたい）' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '入社式(にゅうしゃしき)の すぐ あとに、研修(けんしゅう)合宿(がっしゅく)か。代表(だいひょう)スピーチも ある。最初(さいしょ)から 最高(さいこう)の スタートを 切(き)るぞ！' },
      { bg: 'gendai_hall', speaker: null, sprite: 'none', text: '会場(かいじょう)は、有名(ゆうめい)な ホテルの 一室(いっしつ)でした。' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'スーツは まだ 着(き)なれないな。でも、気持(きも)ちが 引(ひ)きしまる。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '（専務(せんむ)も いらっしゃる。いい ところを 見(み)せるぞ！）' },
      { speaker: null, sprite: 'none', text: '入社式(にゅうしゃしき)は、きびしい ふんいきの 中(なか)で 進(すす)んで いきます。' },
      { text: 'ネクマックスは 台(だい)の 前(まえ)に 立(た)ちました。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', fx: ['cheer'], text: '一人(ひとり)でも 多(おお)くの 方(かた)を 幸(しあわ)せに できるよう——！' },
      { speaker: null, sprite: 'none', fx: [], text: 'あっと いう 間(ま)に、スピーチは 終(お)わりました。' },
      { text: '同期(どうき)たちから 「よかったよ！」と ほめられて、とても うれしかった。' },
      { text: '「みんな、移動(いどう)だー！」 ホテルの 外(そと)では、もう バスが 待(ま)って います。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（よいんに ひたる ひまも ないな）' },
      { speaker: null, sprite: 'none', text: '専務(せんむ)が 手(て)を ふって います。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '（ぼくは、あなたみたいに なるぞ！ 研修(けんしゅう)合宿(がっしゅく)も がんばるぞ！）' },
      { speaker: null, sprite: 'none', text: 'これから、九十日間(きゅうじゅうにちかん)の 研修(けんしゅう)合宿(がっしゅく)が 始(はじ)まる。' },
      { text: '——こんな はずじゃ なかった。' },
    ],
  },

  // -------------------------------------------------------------------------
  // #4〜#5 — スポーツ大会（シャトルラン）
  {
    stageId: 'gendai-10',
    lines: [
      { bg: 'gendai_ground', fx: ['tension'], text: '研修(けんしゅう)は 三(さん)か月(げつ) つづきます。' },
      { text: '富士山(ふじさん)の ふもとで 三十日(さんじゅうにち)。東京(とうきょう)と 福岡(ふくおか)に 分(わ)かれて 三十日(さんじゅうにち)。そして また 富士山(ふじさん)の ふもとで 三十日(さんじゅうにち)。' },
      { text: 'にげたくても、にげられない 三(さん)か月(げつ)です。' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: 'おい、全員(ぜんいん)！ 今日(きょう)は スポーツ大会(たいかい)だ！' },
      { speaker: 'sone', sprite: 'sone:normal', fx: [], text: 'スポーツ大会(たいかい)！？' },
      { speaker: 'nara', sprite: 'nara:normal', text: '（先輩(せんぱい)、はちまき してるぞ……）' },
      { speaker: 'senpai', sprite: 'senpai:normal', text: 'ルールを 説明(せつめい)する。白(しろ)い 線(せん)と 線(せん)の 間(あいだ)は 二十五(にじゅうご)メートル。行(い)って もどって、五十(ごじゅう)メートルだ！' },
      { speaker: 'senpai', sprite: 'senpai:normal', text: '合図(あいず)で スタート。白(しろ)い 線(せん)に タッチしたら、スタートの 場所(ばしょ)まで もどって 来(こ)い！' },
      { speaker: 'senpai', sprite: 'senpai:normal', text: '上(うえ)から 五位(ごい)までに 入(はい)ったら、この 「ゲーム」は クリアだ。入(はい)れなかったら……ずっと 走(はし)りつづける ことに なる！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（おいおい、まさに 終(お)わりの ない シャトルランだな……）' },
      { speaker: 'senpai', sprite: 'senpai:normal', text: '休(やす)みの 時間(じかん)は 短(みじか)い！ 一回(いっかい)でも 早(はや)く ぬけられるように しろ！ それと、わすれるな。' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: '連帯責任(れんたいせきにん)だ。最後(さいご)まで のこった チームは、罰(ばつ)ゲームだからな！' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', fx: [], text: '（ぜったい まっさきに 五位(ごい)までに 入(はい)って やる！）' },
      { speaker: null, sprite: 'none', fx: ['run'], text: '位置(いち)に ついて、よーい……どん！' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '（おりかえしだ！ どうだ、ぼくの クイックターン！）' },
      { speaker: null, sprite: 'none', text: '……はやい！ 前(まえ)の 人(ひと)たちが、どんどん 先(さき)へ 行(い)きます。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', fx: [], text: '（くやしい！ 五位(ごい)までに 入(はい)れなかった……）' },
      { speaker: 'senpai', sprite: 'senpai:normal', fx: ['shout'], text: 'さあ、位置(いち)に つけ！ すぐに 二回目(にかいめ)が 始(はじ)まるぞ！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', fx: ['run'], text: '（まじか！？ 休(やす)みは こんなに 短(みじか)いのか！）' },
      { speaker: null, sprite: 'none', fx: ['run', 'tension'], text: '体(からだ)は 正直(しょうじき)です。すぐに 体力(たいりょく)が なくなり、息(いき)は あらく、足(あし)の 筋肉(きんにく)が 悲鳴(ひめい)を あげました。' },
      { fx: ['tension'], text: '後(あと)で 知(し)ったのですが——新人(しんじん)の 中(なか)には、マラソンの 国体(こくたい)の 選手(せんしゅ)や、バスケットボールの インターハイの 選手(せんしゅ)も いたのです。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（そんな 人(ひと)たちに、勝(か)てる わけが ない。この 種目(しゅもく)は、ぼくには かなり 不利(ふり)だ……）' },
      { speaker: 'nexmax', sprite: 'nexmax:think', fx: [], text: '（ん？ 待(ま)てよ……）' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '（のこって いる みんなも、つらいのは 同(おな)じ はずだよな……）' },
      { speaker: null, sprite: 'none', text: 'となりで、ほかの 新人(しんじん)が 言(い)いました。「きつい……。体力(たいりょく)の 使(つか)い方(かた)を 考(かんが)えないと、最後(さいご)まで もたないな……」' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', fx: ['idea'], text: 'そうか！ 分(わ)かったぞ！' },
      { speaker: null, sprite: 'none', fx: ['idea'], text: '〈現代編(げんだいへん) ここまで。原作(げんさく)の つづきを 待(ま)とう〉' },
    ],
  },
];
