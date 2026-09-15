import type { CastMember, NovelScript } from '../../types/novel';

/**
 * むかし編 の 脚本.
 *
 * Stages 1–6 are the picture book, adapted to a novel scene: the narration is
 * kept close to the original wording, and the causal connectives the book uses
 * (だから / ですから) are kept rather than smoothed away, because they are what
 * carry the reasoning a learner is meant to follow.
 *
 * Stages 7–10 continue past the book's last page. The question it leaves open
 * — how do you climb a tree with no branches? — is answered with the one thing
 * Nexmax carried up from the village: he can write.
 *
 * Every kanji in this file is annotated with its reading. lint checks that.
 * Choices flavour the scene; they are never graded. The drill does the judging.
 */

export const MUKASHI_CAST: CastMember[] = [
  {
    id: 'nexmax',
    name: 'ネクマックス',
    color: '#3aa8f0',
    sprites: {
      normal: 'img/chara/nexmax.webp',
      smile: 'img/chara/cheer.webp',
      think: 'img/chara/book.webp',
      determined: 'img/chara/build.webp',
      hello: 'img/chara/hello.webp',
      guide: 'img/chara/guide.webp',
    },
  },
  {
    id: 'sonchou',
    name: '村長(そんちょう)',
    color: '#b98a53',
    sprites: { normal: 'img/chara/types/ISTJ.webp' },
  },
  {
    id: 'hana',
    name: 'ハナ',
    color: '#5cbf6a',
    sprites: { normal: 'img/chara/types/ISFJ_f.webp' },
  },
];

export const MUKASHI_SCRIPTS: NovelScript[] = [
  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-1',
    lines: [
      { bg: 'mukashi_village', text: 'むかし むかし、ある ところに、とても 農業(のうぎょう)が さかんな 村(むら)が ありました。' },
      { text: '村(むら)の 人(ひと)たちは、農作(のうさく)を しながら、しずかに、ゆっくりと 生活(せいかつ)して いました。' },
      { speaker: 'nexmax', sprite: 'nexmax:hello', text: 'おはよう！ 今日(きょう)も いい 天気(てんき)だね。' },
      { speaker: 'hana', sprite: 'hana:normal', text: 'ネクマックス、おはよう。きょうも 田(た)んぼを 手伝(てつだ)って くれる？' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'うん！ ぼくは 人(ひと)より 力(ちから)が あるから。' },
      {
        speaker: 'hana',
        text: 'ありがとう。……ねえ、ネクマックス。この 村(むら)は 好(す)き？',
        choices: [
          { label: '大好(だいす)き。ここが ぼくの 家(いえ)だから。', next: 'a' },
          { label: 'みんなが いるから、好(す)き。', next: 'b' },
        ],
      },
      { label: 'a', speaker: 'nexmax', sprite: 'nexmax:smile', text: '大好(だいす)き。ここが ぼくの 家(いえ)だから。', goto: 'join' },
      { label: 'b', speaker: 'nexmax', sprite: 'nexmax:smile', text: 'みんなが いるから、好(す)き。一人(ひとり)だったら、ただの 田(た)んぼだよ。' },
      { label: 'join', speaker: 'hana', text: 'ふふ。へんな ロボット。' },
      { speaker: null, sprite: 'none', text: 'この 日(ひ)の 村(むら)は、いつもと 同(おな)じでした。' },
      { text: 'いつもと 同(おな)じ 日(ひ)が、いちばん 大(だい)じだと 気(き)づくのは、\nいつも あとに なってからです。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-2',
    lines: [
      { bg: 'mukashi_village', text: '何日(なんにち)か たって、村(むら)の 人(ひと)が 一人(ひとり)、たおれました。' },
      { text: 'つぎの 日(ひ)は 二人(ふたり)。その つぎの 日(ひ)は 四人(よにん)。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……どうして？ きのうまで 元気(げんき)だったのに。' },
      { speaker: 'sonchou', sprite: 'sonchou:normal', text: 'やまいだ。わしらの 目(め)には 見(み)えん。だから ふせぎようが ない。' },
      { speaker: 'sonchou', text: 'ネクマックス。むかしから、あの 山(やま)の むこうに 高(たか)い 高(たか)い 木(き)が ある。' },
      { speaker: 'sonchou', text: 'その てっぺんの 葉(は)っぱ「生命草(せいめいそう)」は、太陽(たいよう)と 雨(あめ)の めぐみを あびて いて、どんな やまいにも きいて 直(なお)して くれる。' },
      { speaker: 'sonchou', text: 'あれさえ とれれば、きっと 村(むら)は 治(なお)るだろう。' },
      { speaker: 'sonchou', text: 'ですが、ふつうの 人間(にんげん)では 行(い)けない。どうか、あの 葉(は)っぱを とって きて くれないか？' },
      {
        speaker: null,
        sprite: 'none',
        text: 'ネクマックスは、村(むら)の 人(ひと)たちの 顔(かお)を 見(み)ました。',
        choices: [
          { label: 'すぐに 「行(い)く」と 言(い)う', next: 'now' },
          { label: '少(すこ)し 考(かんが)えてから 答(こた)える', next: 'wait' },
        ],
      },
      { label: 'now', speaker: 'nexmax', sprite: 'nexmax:determined', text: '分(わ)かった。とって くるよ！', goto: 'join' },
      { label: 'wait', speaker: 'nexmax', sprite: 'nexmax:think', text: '……ぼくが 行(い)っても、帰(かえ)って こられるか 分(わ)からない。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'でも、ここに いても 村(むら)は 治(なお)らない。だから 行(い)く。分(わ)かった、とって くるよ！' },
      { label: 'join', speaker: 'sonchou', text: '……すまん。ほんとうに すまん。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-3',
    lines: [
      { bg: 'mukashi_mountain', text: 'ネクマックスは、村(むら)を すくう ため、けわしい 山(やま)へと 旅立(たびだ)ちました。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '山(やま)を こえて、川(かわ)を わたって、それから……' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……それから、どうしよう。地図(ちず)が ないや。' },
      { sprite: 'none', text: '空(そら)の 上(うえ)には、黒(くろ)い 雲(くも)が 出(で)て いました。' },
      { text: '雨(あめ)が ふれば、土(つち)は ぬかるみます。火(ひ)を おこすのも むずかしく なります。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'でも、待(ま)って いる 時間(じかん)は ない。' },
      { text: '川(かわ)の 水(みず)は つめたく、思(おも)ったより 深(ふか)い ものでした。' },
      { speaker: null, text: 'ネクマックスは 川(かわ)に 入(はい)りました。そして、何(なん)とか むこう岸(ぎし)へ 出(で)ました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-4',
    lines: [
      { bg: 'mukashi_wildpath', text: '道(みち)は とても 困難(こんなん)でした。' },
      { text: '旅(たび)の とちゅう、イノシシに つっこまれたり、足(あし)を ふみ外(はず)して がけから 落(お)ちたり、' },
      { text: '見(み)た ことも ない ような 巨大(きょだい)な ハチに さされたり——' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'いたい……！ でも、まだ 歩(ある)ける。' },
      { text: '大(おお)けがを しながらも、ネクマックスは 歩(あゆ)みを 止(と)めません。' },
      {
        speaker: null,
        text: '虫(むし)の 羽(はね)の 音(おと)が、また 近(ちか)づいて きます。',
        choices: [
          { label: 'かくれて やりすごす', next: 'hide' },
          { label: '正面(しょうめん)から むかう', next: 'face' },
        ],
      },
      { label: 'hide', speaker: 'nexmax', sprite: 'nexmax:think', text: '……体(からだ)が もう もたない。いまは かくれよう。', goto: 'join' },
      { label: 'face', speaker: 'nexmax', sprite: 'nexmax:determined', text: 'にげたら、また 追(お)いかけて くる。ここで 決(き)める！' },
      { label: 'join', sprite: 'none', text: 'なんと、彼(かれ)は 自分(じぶん)で けがを 治(なお)す ことが できるのです。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-5',
    lines: [
      { bg: 'mukashi_portal', text: 'ネクマックスは 心(こころ)も 体(からだ)も ボロボロに なると、' },
      { text: '胸(むね)の マークから 不思議(ふしぎ)な 光(ひかり)を 放(はな)ち、何(なに)も ない 空間(くうかん)に 光(ひかり)の 入(い)り口(ぐち)を 作(つく)る ことが できます。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……いくよ。' },
      { sprite: 'none', text: 'そこから 異空間(いくうかん)に 入(はい)り、自分自身(じぶんじしん)を 治癒(ちゆ)します。' },
      { text: '異空間(いくうかん)に 入(はい)った 瞬間(しゅんかん)に 入(い)り口(ぐち)は なくなり、外(そと)からは 誰(だれ)にも 見(み)つかりません。' },
      { text: 'その 中(なか)は、しずかでした。音(おと)も、光(ひかり)も、時間(じかん)さえ 止(と)まって いる ように 見(み)えます。' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: 'ここに いれば、いたくない。' },
      { speaker: 'nexmax', text: '……でも、ここに いても、誰(だれ)も 治(なお)らない。' },
      { sprite: 'none', text: 'ネクマックスは、光(ひかり)の 中(なか)で 目(め)を あけました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-6',
    lines: [
      { bg: 'mukashi_forest', text: 'しばらくして 光(ひかり)の あなから 出(で)て きた ネクマックスは 元気(げんき)いっぱい！ 傷(きず)も すっかり 治(なお)って います。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'よし！ 行(い)ける！' },
      { sprite: 'none', text: 'イノシシや 巨大(きょだい)バチ、足元(あしもと)にも 注意(ちゅうい)しながら さらに 先(さき)へと 進(すす)む ことが できたのです。' },
      { text: '村(むら)を 出(で)てから、もう 何日(なんにち)たったでしょうか。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '一日(いちにち)、二日(ふつか)……分(わ)からなく なって きた。' },
      { speaker: 'nexmax', text: 'みんな、まだ 生(い)きて いるかな。' },
      { sprite: 'none', text: '毎日(まいにち) 同(おな)じ 森(もり)の 中(なか)を 歩(ある)いて いると、時間(じかん)の 感覚(かんかく)が なくなります。' },
      { text: 'それでも、午前(ごぜん)に 東(ひがし)から のぼった 日(ひ)は、午後(ごご)には 西(にし)に かたむきます。' },
      { text: 'ネクマックスは、その 半分(はんぶん)を 目印(めじるし)に して、まっすぐ 進(すす)み つづけました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-7',
    lines: [
      { bg: 'mukashi_greattree', text: 'そして ついに、ネクマックスは 目的地(もくてきち)である 木(き)の ふもとへと たどり着(つ)きました。' },
      { text: '目(め)の 前(まえ)には、とんでもなく 巨大(きょだい)な 大木(たいぼく)が 立(た)ちはだかって いました。' },
      { text: 'それは あまりにも 大(おお)きく、木(き)の てっぺんは 下(した)からは 見(み)えない ほどです。' },
      { text: 'しかも、登(のぼ)る ための 枝(えだ)（ひっかける ところ）も ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……つるつるだ。右(みぎ)にも 左(ひだり)にも、手(て)を かける ところが ない。' },
      { speaker: 'nexmax', text: '北(きた)がわに まわって みても、南(みなみ)がわに まわって みても、おなじ。' },
      { sprite: 'none', text: 'ネクマックスは、この 巨大(きょだい)な 木(き)を どうやって 登(のぼ)るのでしょうか——' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: '……道具(どうぐ)も ない。力(ちから)だけでは 無理(むり)だ。' },
      {
        speaker: null,
        text: '外(そと)は もう 夕方(ゆうがた)です。ネクマックスは 木(き)の 前(まえ)に すわりました。',
        choices: [
          { label: '今日(きょう)は 休(やす)んで、明日(あした) 考(かんが)える', next: 'rest' },
          { label: 'あきらめずに、いま 考(かんが)える', next: 'think' },
        ],
      },
      { label: 'rest', speaker: 'nexmax', text: '……つかれた。少(すこ)し 休(やす)もう。考(かんが)えるのは、それから。', goto: 'join' },
      { label: 'think', speaker: 'nexmax', sprite: 'nexmax:determined', text: '村(むら)の みんなは、いま この 時間(じかん)も 待(ま)って いる。' },
      { label: 'join', sprite: 'none', text: 'ネクマックスは、ふと 自分(じぶん)の 手(て)を 見(み)ました。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-8',
    lines: [
      { bg: 'mukashi_greattree', text: '村(むら)に いた ころ、ネクマックスは 子(こ)どもたちと 学(まな)んで いました。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ハナが、木(き)の 校舎(こうしゃ)で 字(じ)を 教(おし)えて くれた。' },
      { speaker: 'hana', sprite: 'hana:normal', text: '——ネクマックス、字(じ)は ね、話(はな)す ことを 形(かたち)に して のこす ものなの。' },
      { speaker: 'hana', text: '——声(こえ)は 消(き)えるけど、書(か)いた 字(じ)は のこる。だから、読(よ)む ことが できる。' },
      { sprite: 'none', text: 'ネクマックスは 立(た)ち上(あ)がりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'そうか。……のこるんだ。' },
      { text: 'ネクマックスは、指先(ゆびさき)に 力(ちから)を こめて、みきに 一(ひと)つ 字(じ)を きざみました。' },
      { text: '「山(やま)」。' },
      { text: 'きざんだ ところが へこみ、そこに 足(あし)が かかりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '……登(のぼ)れる！' },
      { sprite: 'none', text: '一(ひと)つ 書(か)けば、一歩(いっぽ)。' },
      { text: 'ネクマックスは、村(むら)で おぼえた 字(じ)を、一(ひと)つ ずつ 思(おも)い出(だ)しながら きざんで いきました。' },
      { text: '知(し)って いる 字(じ)の 数(かず)だけ、上(うえ)へ 行(い)ける。それが この 木(き)の のぼりかたでした。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-9',
    lines: [
      { bg: 'mukashi_portal', text: '雨(あめ)が ふって きました。みきは すべりやすく なります。' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: '……手(て)が つめたい。字(じ)が うまく きざめない。' },
      { text: 'それでも ネクマックスは 登(のぼ)りつづけ、やがて 雲(くも)の 中(なか)に 入(はい)りました。' },
      { text: '雲(くも)の 中(なか)は 白(しろ)く、上(うえ)も 下(した)も 分(わ)からなく なります。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'どっちが 上(うえ)だ？ ……いや、きざんだ 字(じ)を 数(かぞ)えれば いい。' },
      { text: '自分(じぶん)が 書(か)いた 字(じ)が、そのまま 道(みち)の しるしに なって いました。' },
      { sprite: 'none', text: 'そして、雲(くも)を ぬけました。' },
      { text: '上(うえ)には 朝(あさ)の 光(ひかり)。下(した)には、白(しろ)い 雲(くも)の 海(うみ)が 国(くに)の ように 広(ひろ)がって います。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '……村(むら)が、あんなに 小(ちい)さい。' },
      { speaker: 'nexmax', text: 'でも、ちゃんと そこに ある。' },
    ],
  },

  // -------------------------------------------------------------------------
  {
    stageId: 'mukashi-10',
    lines: [
      { bg: 'mukashi_greattree', text: 'てっぺんには、一枚(いちまい)の 葉(は)っぱが ありました。' },
      { text: '太陽(たいよう)と 雨(あめ)の めぐみを あびて、金色(きんいろ)に 光(ひか)って います。' },
      { speaker: 'nexmax', sprite: 'nexmax:normal', text: '生命草(せいめいそう)……。' },
      {
        speaker: null,
        text: '手(て)を のばせば、とどきます。',
        choices: [
          { label: 'そっと 一枚(いちまい)だけ とる', next: 'one' },
          { label: '村(むら)の 人数(にんずう)ぶん とる', next: 'many' },
        ],
      },
      { label: 'one', speaker: 'nexmax', sprite: 'nexmax:think', text: '……一枚(いちまい)で いい。また 生(は)えて くるように。', goto: 'join' },
      { label: 'many', speaker: 'nexmax', sprite: 'nexmax:think', text: '……いや。ぜんぶ とったら、つぎに こまる 村(むら)が 困(こま)る。一枚(いちまい)だけ。' },
      { label: 'join', sprite: 'none', text: 'ネクマックスは、葉(は)っぱを 胸(むね)の マークの 中(なか)に しまいました。' },
      { text: '——そして、下(した)を 見(み)ました。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '帰(かえ)ろう。父(ちち)さんも 母(かあ)さんも いない ぼくに、友(とも)だちを くれた 村(むら)へ。' },
      { text: '男(おとこ)の 人(ひと)も、女(おんな)の 人(ひと)も、子(こ)どもも、みんな 待(ま)って います。' },
      { text: '何(なに)が できる ロボットかと 聞(き)かれたら、ネクマックスは こう 答(こた)えるでしょう。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: '——学(まな)ぶ ことが できる ロボットだよ。' },
      { sprite: 'none', text: 'まなぶほど、ぼくは つよく なる。' },
      { text: '〈むかし編(へん) おわり〉' },
    ],
  },
];
