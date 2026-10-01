import type { CastMember, NovelLine, NovelScript } from '../../types/novel';
import { NANIWA_FOLK, NANIWA_NEXMAX } from './naniwaCast';

/**
 * かな編 ＝ 0章「はじまりの 空港」の 脚本 (08 §3.4, §3.4.2, §3.7).
 *
 * 2026-10-01: ナニワタウンへ 向かう 前の 話（前日譚）に 語り直した。舞台は
 * 森と 村から、主人公が 降りた ばかりの 空港へ: 展望デッキ → 屋上の 庭 →
 * 待合 → 駅への 連絡通路 → 夜の 滑走路 → 空港の 駅 → 海を わたる 電車。
 * 10話の 終わりで「うえの まち」の 名前「ナニワタウン」が ぜんぶ 読める。
 *
 * 2026-09-26 の 指定で 作り直した:
 *  - ネクマックスは **戻った かなで しか 話せない**。まだ 書いて いない かなは
 *    ムシクイの 穴（□）に なる（KanaText mode="mask"）。1話の 終わりの
 *    「ありがとう」は「あ□□□う」。5話で ぜんぶ 読めて、意味が わかる。
 *  - 地の文は **主人公の 目と 考えで、英語**。ネクマックスの 言葉の かけらを
 *    英語で 解釈しながら 進む（「あお… blue? うえ… up?」）。
 *  - ネクマックスは 絵文字（🙆‍♂️ 🙅 👆 …）でも 気持ちを 伝える。
 *  - 「あお」「うえ」は 伏線: 青い エスカレーター → 青い 電車 →「うえの まち」＝ ナニワタウン（1章の 町）。
 *
 * すじ（§3.4.1）は そのまま: 影（モジクイ）が 言葉と 名前を 食べて 町へ。
 * 朝の 電車より 先に 空港の 駅へ。字は 書くと 戻るが、ネクマックスは 形を 忘れた。
 * kana.test.ts が「ネクマックスの 台詞は かなと 絵文字だけ」「地の文は 英語」を 確かめる。
 */

export const KANA_CAST: CastMember[] = [NANIWA_NEXMAX, ...NANIWA_FOLK];

/** Before his name comes back (kana-9), Nexmax's name plate can only say what he is. */
export const KANA_CAST_NAMELESS: CastMember[] = KANA_CAST.map((c) => (c.id === 'nexmax' ? { ...c, name: 'ロボット' } : c));

type Line = NovelLine;

interface KanaScript {
  intro: NovelScript;
  outro: NovelScript;
}

/** The closing scene opens on the same page as the opening one, unless it says otherwise. */
const script = (id: string, intro: Line[], outro: Line[]): [string, KanaScript] => [
  id,
  {
    intro: { stageId: id, lines: intro },
    outro: { stageId: id, lines: [{ ...outro[0], bg: outro[0].bg ?? intro[0].bg }, ...outro.slice(1)] },
  },
];

export const KANA_SCRIPTS: Record<string, KanaScript> = Object.fromEntries([
  script(
    'kana-1',
    [
      { bg: 'naniwa_airport', text: 'My plane has just landed. Out on the observation deck, a falling star crashes down in front of me. Boom! It is a little robot — the one whose name was eaten.', ja: 'ひこうきが ついた ばかり。てんぼうデッキに でると、めの まえに ながれぼしが おちて きた。ドーン！ ちいさな ロボットだ。なまえを たべられた ロボット。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'たすけて。ことばを たべられた。' },
      { text: "It's trying to talk, but its words come out full of holes.", ja: 'なにか はなそうと して いる。でも ことばが あなだらけだ。' },
      { speaker: 'nexmax', text: '🙅 だめだ……' },
      { text: 'Five arrival signs hang over the deck. All of them are blank — only the ghost of a letter shows through the dark glass.', ja: 'デッキの うえに、とうちゃくの かんばんが いつつ。どれも まっくらで、くらい ガラスの おくに もじの かげが うっすら みえる だけ。' },
      { speaker: 'traveler', sprite: 'traveler:trouble', text: 'ゲートは どこ？ よめない……😰', en: "Where is my gate? I can't read anything…" },
      { text: 'The traveler next to me is lost too. Without letters, nobody here can find the way.', ja: 'となりの たびの ひとも まよって いる。もじが ないと、ここでは だれも みちが わからない。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🗣️ → 🐛 → 🪧' },
      { text: 'Words… eaten, and the signs went dark? The words it lost left these blank signs behind?', ja: 'ことばを たべられて、かんばんが きえた？ なくした ことばが、この からっぽの かんばんに なったの？' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '✍️ → 💡🪧 → 🗣️' },
      { text: 'Write — the sign lights up — it can speak again. If I write the letter on the sign, it comes back on.', ja: 'かく、かんばんが ひかる、また はなせる。かんばんに もじを かけば、あかりが もどるんだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👉🪧 🙏' },
      { text: 'Okay. Let me try.', ja: 'よし。やって みよう。' },
    ],
    [
      { text: 'The last sign comes on. Its glow pours out of it — into the robot\'s chest — and its lamp flickers on.', ja: 'さいごの かんばんが ひかった。その ひかりが ロボットの むねに ながれこんで、ランプが ちかちかと ともる。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: '「あ□□□う」 a… … … u! Only two sounds got through — the rest is holes.', ja: '「あ□□□う」 あ…… う！ きこえたのは ふたつの おとだけ。のこりは あなだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……？ 🙅' },
      { text: 'It frowns. Then it tries again — using only the letters I just wrote.', ja: 'ロボットは かおを しかめた。それから もう いちど。いま わたしが かいた もじだけで。' },
      { speaker: 'nexmax', text: 'あ、い、う、え、お！' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あお！ ☝️' },
      { text: 'あお ao… It points at the sky. Blue? Does あお mean blue?', ja: 'あお…… そらを ゆびさして いる。あおって、そらの いろの こと？' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえ！ 👆' },
      { text: 'うえ ue… and it points up. Up?', ja: 'うえ…… こんどは うえを さした。うえの ほう？' },
      { text: 'Inside, the terminal splits two ways: a red escalator going down, and a blue one going up.', ja: 'ターミナルの なかは ふたつに わかれて いる。したへ いく あかい エスカレーターと、うえへ いく あおい エスカレーター。' },
      { speaker: 'nexmax', text: 'あお、うえ！ 🙆‍♂️ あか 🙅' },
      { text: 'Blue, up — not red. We should take the blue escalator up!', ja: 'あおで、うえ。あかじゃ ない。あおい エスカレーターで うえへ いこう！' },
    ],
  ),
  script(
    'kana-2',
    [
      { bg: 'naniwa_sky_garden', text: 'The blue escalator carries us up to a garden on the roof. In the middle stands an old cherry tree — no blossoms, no leaves.', ja: 'あおい エスカレーターで おくじょうの にわへ。まんなかに ふるい さくらの き。はなも はっぱも ない。' },
      { text: 'Something black slips between the planters — a shadow, munching on something. Letters?', ja: 'うえきの あいだを くろい ものが すりぬけた。かげだ。なにかを むしゃむしゃ たべて いる。もじ？' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'え？ え？ 🤔' },
      { text: "The old tree's face has been eaten away.", ja: 'ふるい きの かおが、たべられて なくなって いる。' },
      { speaker: 'nexmax', text: 'き！ かお！' },
      { text: '「□！ □お！」 …o? I can\'t make it out.', ja: '「□！ □お！」 ……お？ よく わからない。' },
      { text: 'Dark signs hang from the branches — the pieces of its face, eaten blank.', ja: 'えだに くらい かんばんが さがって いる。たべられて からっぽに なった、かおの かけらだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かいて！' },
      { text: 'Same as before: write, the signs light up, and the words come back.', ja: 'さっきと おなじ。かけば かんばんが ひかって、ことばが もどる。' },
    ],
    [
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'き！ かお！' },
      { text: 'き ki… かお kao. He points at the tree, then at its face. き — tree. かお — face!', ja: 'き…… かお。ロボットは きを さして、それから その かおを さした。「き」は この き。「かお」は かお！' },
      { text: 'The bark shifts. Two eyes open, and a few pink blossoms burst out. The tree has a face again.', ja: 'みきが うごいた。めが ふたつ ひらいて、ピンクの はなが ぽんっと さいた。きに かおが もどった。' },
      { text: '「えき。 あそこ。」' },
      { text: 'えき eki… a station? あそこ asoko — over there? A branch points across the terminal, to the airport station.', ja: 'えき？ あそこ？ えだが ターミナルの むこうの、くうこうの えきを さして いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'えき！ いこう！ 🙆‍♂️' },
      { text: 'いこう ikou — let\'s go. The shadow is heading for the station.', ja: 'いこう。かげは えきへ むかって いる。' },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'naniwa_lounge', text: 'The way to the station runs through the waiting lounge. It is silent. Nobody is calling anybody.', ja: 'えきへの みちは まちあいしつを とおる。しーんと して いる。だれも だれかを よんで いない。' },
      { text: 'A girl sits by the gate, holding an empty dog collar.', ja: 'ゲートの そばに おんなのこが すわって いる。からっぽの くびわを にぎって。' },
      { speaker: 'girl', sprite: 'girl:sad', text: 'いぬが いない……😢', en: 'My dog is gone…' },
      { text: 'Her words are full of holes too.', ja: 'おんなのこの ことばも、あなだらけだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……😢' },
      { text: 'On the lost-and-found board, every name tag is blank.', ja: 'おとしものの ボードの なふだは、ぜんぶ からっぽ。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かく！' },
      { text: 'かく kaku — write. Now that he has か and く back, he says it the short way.', ja: 'かく。「か」と「く」が もどったから、みじかく いえるように なった。' },
    ],
    [
      { speaker: 'girl', sprite: 'girl:sad', text: 'いぬが いない……😢', en: 'My dog is gone…' },
      { text: 'いぬが いない inu ga inai. A collar… いぬ must be dog. The dog is not here.', ja: 'いぬが いない。くびわ…… そうか、いぬだ。いぬが いなく なったんだ。' },
      { glyph: 'なな', text: 'The name tag on the collar fills back in.', ja: 'くびわの なふだに、なまえが もどった。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'なな！ いぬ、なな！' },
      { speaker: 'girl', sprite: 'girl:sad', text: 'ななー！', en: 'Nana!' },
      { fx: ['sparkle'], text: 'She calls the name, and a little dog comes running out from behind the suitcases.', ja: 'おんなのこが なまえを よぶと、スーツケースの うしろから ちいさな いぬが はしって きた。' },
      { speaker: 'girl', sprite: 'girl:happy', text: 'なな！ よかった……！ ありがとう！ 🐶', en: 'Nana! Thank goodness… thank you!' },
      { text: 'Nana sniffs the air, then barks at the long walkway to the station. Woof!', ja: 'ナナは くんくん においを かいで、えきへの ながい つうろに むかって ほえた。ワン！' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あっち！ 👉' },
      { text: 'あっち acchi — that way. The shadow went down the walkway.', ja: 'あっち。かげは つうろの さきへ いったんだ。' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'naniwa_walkway', fx: ['darkclouds'], text: 'Nana leads us onto the long walkway to the station. Then black smoke pours in — the shadow\'s smoke.', ja: 'ナナの あとに ついて、えきへの ながい つうろへ。すると くろい けむりが ながれこんで きた。かげの けむりだ。' },
      { text: 'The arrows on the floor are fading one by one. I can barely see which way to go.', ja: 'ゆかの やじるしが ひとつずつ きえて いく。どっちへ いけば いいのか、ほとんど わからない。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'みちが……！' },
      { text: '「□ちが」 …chi ga? Something about the arrows.', ja: '「□ちが」 ……ちが？ やじるしの ことかな。' },
      { text: 'The guide signs over the walkway are blank now — dark where the letters used to glow.', ja: 'つうろの あんないの かんばんも からっぽ。もじが ひかって いた ところが まっくらだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '✍️💡🪧 かく！' },
    ],
    [
      { fx: [], speaker: 'nexmax', sprite: 'nexmax:smile', text: 'みち！ 🙆‍♂️' },
      { text: 'みち michi — the way. The arrows glow again, and the smoke scatters.', ja: 'みち。やじるしが また ひかって、けむりが ちって いく。' },
      { text: 'Through the glass I can see the sea, a long bridge, and a town on a high hill across the bay.', ja: 'ガラスの むこうに、うみと ながい はし。わんの むこうの たかい おかに、まちが みえる。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえの まち！ 👆' },
      { text: 'うえの まち ue no machi — the town up there. まち means town!', ja: 'うえの まち。うえの ほうに ある まち。あそこの まちの ことだ！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'あの まちに、かげが いく。' },
      { text: 'かげ kage — the shadow. It is going to that town.', ja: 'かげ。かげは あの まちへ いくんだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いそいで！' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'naniwa_runway_night', text: 'Night falls before we reach the station. The runway lights have gone dark, one after another.', ja: 'えきに つく まえに、よるに なった。かっそうろの あかりが、つぎつぎに きえて いく。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。' },
      { text: 'ほし hoshi… が ない ga nai. No stars. The shadow ate them too — and the runway lights.', ja: 'ほし…… が ない。ほしが ない。かげが ほしも たべたんだ。かっそうろの あかりも。' },
      { speaker: 'nexmax', text: 'みちが みえない。よるは こわい。' },
      { text: 'みちが みえない michi ga mienai — we can\'t see the path. The rest is eaten, but I can tell he is scared.', ja: 'みちが みえない。のこりは たべられて いるけど、こわがって いるのは わかる。' },
      { text: 'Dark signs lie along the runway where the lights went out. They glow faintly, like coals.', ja: 'あかりが きえた かっそうろに そって、くらい かんばんが ならんで いる。すみの ように うっすら ひかって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
      { text: 'かきます kakimasu — the polite way to say "write". That is how they say it in class.', ja: 'かきます。「かく」の ていねいな いいかた。じゅぎょうでは こう いうんだ。' },
    ],
    [
      { fx: ['sparkle'], text: 'Stars bloom across the sky, one by one, and the runway lights come back on.', ja: 'そらに ほしが ひとつずつ さいて、かっそうろの あかりも もどった。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'よるの ほし、きれい！' },
      { text: 'よるの ほし yoru no hoshi — stars at night. きれい kirei — beautiful.', ja: 'よるの ほし。きれい。ほんとうに きれいだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: 'ありがとう arigatou. That is what he tried to say at the very beginning. Thank you.', ja: 'ありがとう。いちばん さいしょに いおうと して いた ことばだ。' },
      { speaker: 'nexmax', text: 'でんしゃは あさ。' },
      { text: 'で de — that is て with two little dots. でんしゃ densha… the train, in the morning.', ja: 'で。「て」に ちいさな てんが ふたつ。でんしゃ…… あさの でんしゃだ。' },
      { text: 'At dawn we reach the airport station. But every sign here is written in sharper, different letters.', ja: 'よあけに くうこうの えきに ついた。でも ここの かんばんは、かくかくした べつの もじで かいて ある。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ここは カタカナの えき。' },
      { text: 'ここは …の えき koko wa …no eki. This is the something station. Letters I can\'t read yet.', ja: 'ここは ……の えき。なにかの えきだ。まだ よめない もじが ある。' },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'naniwa_station', text: 'The airport station is covered in signs, and every one of them is full of holes.', ja: 'くうこうの えきは かんばんだらけ。どれも あなだらけだ。' },
      { glyph: 'ネクマックス', text: "There is a badge on the robot's chest. It is full of holes too.", ja: 'ロボットの むねに バッジが ある。それも あなだらけだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ぼくの なまえも、カタカナ だった。' },
      { text: 'ぼくの なまえも boku no namae mo… his name was written in these letters. That is why he can\'t say it.', ja: 'ぼくの なまえも…… ロボットの なまえは、この もじで かいて あったんだ。だから いえないんだ。' },
      { text: 'In the station hall, every sign is blank.', ja: 'えきの ホールの かんばんは、ぜんぶ からっぽ。' },
      { speaker: 'kiosk', sprite: 'kiosk:trouble', text: 'メニューが きえて、なにも うれないの……💦', en: "My menu went blank. I can't sell anything…" },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'A kiosk sign fills back in: ココア.', ja: 'ばいてんの かんばんに もじが もどった。ココア。' },
      { speaker: 'kiosk', sprite: 'kiosk:happy', text: 'ココア、どうぞ！ ☕☕', en: 'Here — have some cocoa!' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ココア！ あたたかい！ ✌️' },
      { text: 'ココア kokoa — cocoa! Two warm cups.', ja: 'ココア！ あたたかい カップが ふたつ。' },
      { glyph: 'ネクマックス', text: 'Two letters come back on his badge.', ja: 'バッジに もじが ふたつ もどった。' },
      { speaker: 'nexmax', text: 'あと すこし！' },
      { text: 'あと すこし ato sukoshi — almost there.', ja: 'あと すこし。もう すぐだ。' },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'naniwa_station', text: 'A ticket machine. Its screen is blank.', ja: 'きっぷの きかい。がめんは からっぽだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'キップを かいたい。どこを おす？ 🤔' },
      { text: 'かいたい kaitai — he wants to buy something. どこを おす doko o osu — where do I press?', ja: 'かいたい。なにかを かいたいんだ。どこを おす？ どこを おせば いいの？' },
      { text: "The ticket machine's buttons are blank — one dark square after another.", ja: 'きかいの ボタンは からっぽ。くらい しかくが ならんで いる だけ。' },
      { speaker: 'staff', sprite: 'staff:trouble', text: 'きかいが よめない…… きっぷが うれない。💦', en: "I can't read the machine… I can't sell tickets." },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'Letters appear on the screen: スタート.', ja: 'がめんに もじが でた。スタート。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'スタート！ 👉' },
      { text: 'スタート sutāto — start! The long mark ー stretches the sound. I press it.', ja: 'スタート！「ー」は おとを のばす しるし。ボタンを おした。' },
      { text: 'The next screen says: キップ. Still one letter short.', ja: 'つぎの がめんは キップ。でも まだ もじが ひとつ たりない。' },
      { glyph: 'ネクマックス', text: 'More of his badge comes back — even the little ッ.', ja: 'バッジの もじが また もどった。ちいさい「ッ」まで。' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'naniwa_station', text: 'A train is coming. I can hear it on the tracks.', ja: 'でんしゃが くる。せんろの おとが きこえる。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'キップが ないと、のれない！' },
      { text: 'のれない norenai — without a ticket we can\'t get on!', ja: 'のれない。キップが ないと のれない！' },
      { text: 'The sign over the platform gate has gone dark.', ja: 'ホームの ゲートの うえの かんばんが、くらく なって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'A ticket slides out: キップ kippu! The little ○ on フ makes プ.', ja: 'キップが でて きた！「フ」に ちいさな まるを つけると「プ」に なる。' },
      { text: 'Two trains stand at the platform: a red one and a blue one.', ja: 'ホームに でんしゃが ふたつ。あかい でんしゃと、あおい でんしゃ。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あお！ うえの まち！ 👆' },
      { text: 'The blue one crosses the bridge to the town up on the hill. Blue and up — just like the blue escalator.', ja: 'あおい でんしゃは はしを わたって、おかの うえの まちへ いく。あおで、うえ。あの あおい エスカレーターと おなじだ。' },
      { text: 'A black shadow slides into the last car of the blue train.', ja: 'くろい かげが、あおい でんしゃの さいごの しゃりょうに すべりこんだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かげ！ いそいで！' },
      { glyph: 'ネクマックス', text: 'Only one hole is left on his badge.', ja: 'バッジの あなは、あと ひとつ だけ。' },
    ],
  ),
  script(
    'kana-9',
    [
      { bg: 'naniwa_train', text: 'The blue train runs out over the long bridge across the bay, toward the town on the hill. The shadow waits in the last car.', ja: 'あおい でんしゃは、わんの うえの ながい はしを はしる。おかの うえの まちへ。かげは さいごの しゃりょうで まって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'なまえが ないと、ちからが でない。' },
      { text: 'なまえが ないと namae ga nai to… ちからが でない chikara ga denai. Without his name, he has no strength.', ja: 'なまえが ないと、ちからが でない。なまえが ないと、つよく なれないんだ。' },
      { text: 'Dark, blank signs hang all along the aisle to the last car.', ja: 'さいごの しゃりょうまで、くらい からっぽの かんばんが ずらりと さがって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { glyph: 'ネクマックス', text: 'The last hole on the badge fills in.', ja: 'バッジの さいごの あなが うまった。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックス！' },
      { text: 'ネクマックス Nekumakkusu. Nexmax. His name — whole again.', ja: 'ネクマックス。ロボットの なまえが、ぜんぶ もどった。' },
      { speaker: 'nexmax', text: 'よめた？ 🙆‍♂️' },
      { text: 'At the end of the car there is a door, and a name is written on it: モジクイ.', ja: 'しゃりょうの はしに ドアが ある。そこに なまえが かいて ある。モジクイ。' },
      { text: 'モジ moji — letters. クイ kui — eater. モジクイ. So that is the shadow.', ja: 'モジは もじ。クイは たべる もの。モジクイ。あの かげの なまえだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイ！ いこう！' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'naniwa_last_car', fx: ['sparkle'], text: 'Behind the door: a whirlpool of letters. In the middle, the Mojikui is slurping them up like ramen.', ja: 'ドアの むこうは もじの うずまき。まんなかで モジクイが、ラーメンみたいに もじを すすって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かえして！ ぜんぶ かえして！' },
      { text: 'かえして kaeshite — give them back!', ja: 'かえして！ もじを かえして！' },
      { text: 'The last blank signs spin in the whirlpool.', ja: 'うずまきの なかで、さいごの からっぽの かんばんが まわって いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！ さいごの カタカナ！' },
    ],
    [
      { fx: ['heal'], text: 'The Mojikui chokes, and kana burst out of it like confetti.', ja: 'モジクイが むせた。かなが かみふぶきの ように とびだす。' },
      { text: 'But it leaps through the window and flees ahead, into the town on the hill.', ja: 'でも モジクイは まどから とびだして、おかの うえの まちへ にげて いった。' },
      { bg: 'naniwa_train', glyph: 'ナニワタウン', text: 'The train comes off the bridge. Over the station ahead hangs a big sign — and I can read every letter of it.', ja: 'でんしゃが はしを わたりきった。さきの えきに おおきな かんばん。もう ぜんぶの もじが よめる。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'うえの まちは、ナニワタウン！' },
      { text: 'ナニワタウン Naniwa Taun — Naniwa Town. That is the town up on the hill.', ja: 'ナニワタウン。あれが おかの うえの まちだ。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ナニワタウンで、かんじが きえて いる。' },
      { text: 'In Naniwa Town, the kanji are disappearing.', ja: 'ナニワタウンでは、かんじが きえて いる。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あなたは もう、ひらがなも カタカナも よめる。' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは かんじ！ 🙆‍♂️' },
      { text: 'ありがとう. This time I understood every word.', ja: 'ありがとう。こんどは ぜんぶの ことばが わかった。' },
    ],
  ),
]);
