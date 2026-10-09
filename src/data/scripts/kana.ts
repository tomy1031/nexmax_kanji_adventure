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

/**
 * Nexmax's name was eaten: his plate says ？？？ (with his face) until every
 * letter of ネクマックス is written — at the end of kana-9.
 */
export const KANA_CAST: CastMember[] = [{ ...NANIWA_NEXMAX, nameChars: 'ネクマックス' }, ...NANIWA_FOLK];

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
      { bg: 'naniwa_airport', text: 'My plane has just landed. Out on the observation deck, a falling star crashes down in front of me. Boom! It is a little robot — the one whose name was eaten.', ja: 'ひこうきで くうこうに きました。そらから ほしが……ドーン！ ちいさい ロボットです。なまえが ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'たすけて。だれかが ことばを たべた。' },
      { text: "It's trying to talk, but its words come out full of holes.", ja: 'ロボットが はなします。でも、ことばに あなが たくさん あります。' },
      { speaker: 'nexmax', text: '🙅 だめだ……' },
      { text: 'Five arrival signs hang over the deck. All of them are blank — only the ghost of a letter shows through the dark glass.', ja: 'かんばんが いつつ あります。でも、ぜんぶ くらいです。もじが ありません。' },
      { speaker: 'traveler', sprite: 'traveler:trouble', text: 'ゲートは どこ？ わからない……😰', en: "Where is my gate? I can't read anything…" },
      { text: 'The traveler next to me is lost too. Without letters, nobody here can find the way.', ja: 'となりの ひとも みちが わかりません。もじが ありませんから、だれも わかりません。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🗣️ → 🐛 → 🪧' },
      { text: 'Words… eaten, and the signs went dark? The words it lost left these blank signs behind?', ja: 'だれかが ことばを たべましたか？ それで、かんばんの もじが ありませんか？' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '✍️ → 💡🪧 → 🗣️' },
      { text: 'Write — the sign lights up — it can speak again. If I write the letter on the sign, it comes back on.', ja: 'もじを かきます。かんばんが ひかります。ことばが もどります！' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👉🪧 🙏' },
      { text: 'Okay. Let me try.', ja: 'よし。かきましょう。' },
    ],
    [
      { text: 'The last sign comes on. Its glow pours out of it — into the robot\'s chest — and its lamp flickers on.', ja: 'さいごの かんばんが ひかりました。ロボットの ランプも ひかりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: '「あ□□□う」 a… … … u! Only two sounds got through — the rest is holes.', ja: '「あ□□□う」 あ…… う！ おとは ふたつだけです。ほかは あなです。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……？ 🙅' },
      { text: 'It frowns. Then it tries again — using only the letters I just wrote.', ja: 'ロボットは もう いちど はなします。わたしの もじだけで。' },
      { speaker: 'nexmax', text: 'あ、い、う、え、お！' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あお！ ☝️' },
      { text: 'あお ao… It points at the sky. Blue? Does あお mean blue?', ja: 'あお…… ロボットは そらを みて います。あおは そらの いろですか？' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえ！ 👆' },
      { text: 'うえ ue… and it points up. Up?', ja: 'うえ…… つぎは うえを みて います。うえですか？' },
      { text: 'Inside, the terminal splits two ways: a red escalator going down, and a blue one going up.', ja: 'エスカレーターが ふたつ あります。あかい エスカレーターは したへ、あおい エスカレーターは うえへ いきます。' },
      { speaker: 'nexmax', text: 'あお、うえ！ 🙆‍♂️ あか 🙅' },
      { text: 'Blue, up — not red. We should take the blue escalator up!', ja: 'あおで、うえ。あかじゃ ありません。あおい エスカレーターで うえへ いきましょう！' },
    ],
  ),
  script(
    'kana-2',
    [
      { bg: 'naniwa_sky_garden', text: 'The blue escalator carries us up to a garden on the roof. In the middle stands an old cherry tree — no blossoms, no leaves.', ja: 'あおい エスカレーターで うえの にわへ いきました。ふるい さくらの きが あります。でも、はなが ありません。' },
      { text: 'Something black slips between the planters — a shadow, munching on something. Letters?', ja: 'くろい ものが います。かげです。なにかを たべて います。もじですか？' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'え？ え？ 🤔' },
      { text: "The old tree's face has been eaten away.", ja: 'ふるい きの かおが ありません。だれかが たべました。' },
      { speaker: 'nexmax', text: 'き！ かお！' },
      { text: '「□！ □お！」 …o? I can\'t make it out.', ja: '「□！ □お！」 ……お？ よく わかりません。' },
      { text: 'Dark signs hang from the branches — the pieces of its face, eaten blank.', ja: 'きに くらい かんばんが あります。きの かおの かんばんです。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かいて！' },
      { text: 'Same as before: write, the signs light up, and the words come back.', ja: 'まえと おなじです。もじを かきます。かんばんが ひかります。ことばが もどります。' },
    ],
    [
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'き！ かお！' },
      { text: 'き ki… かお kao. He points at the tree, then at its face. き — tree. かお — face!', ja: 'き…… かお。ロボットは きを みて、それから かおを みました。「き」は この き。「かお」は かお！' },
      { text: 'The bark shifts. Two eyes open, and a few pink blossoms burst out. The tree has a face again.', ja: 'きに めが ふたつ。ピンクの はなも。きに かおが もどりました！' },
      { text: '「えき。 あそこ。」' },
      { text: 'えき eki… a station? あそこ asoko — over there? A branch points across the terminal, to the airport station.', ja: 'えき？ あそこ？ あそこに くうこうの えきが あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'えき！ いこう！ 🙆‍♂️' },
      { text: 'いこう ikou — let\'s go. The shadow is heading for the station.', ja: 'いこう。かげは えきへ いきます。' },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'naniwa_lounge', text: 'The way to the station runs through the waiting lounge. It is silent. Nobody is calling anybody.', ja: 'えきへの みちです。とても しずかです。だれも はなしません。' },
      { text: 'A girl sits by the gate, holding an empty dog collar.', ja: 'ゲートの ちかくに おんなのこが います。いぬの くびわを もって います。いぬは いません。' },
      { speaker: 'girl', sprite: 'girl:sad', text: 'いぬが いない……😢', en: 'My dog is gone…' },
      { text: 'Her words are full of holes too.', ja: 'おんなのこの ことばにも、あなが たくさん あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……😢' },
      { text: 'On the lost-and-found board, every name tag is blank.', ja: 'なふだの もじも、ぜんぶ ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かく！' },
      { text: 'かく kaku — write. Now that he has か and く back, he says it the short way.', ja: 'かく。「か」と「く」が もどりました。ですから、みじかく「かく」です。' },
    ],
    [
      { speaker: 'girl', sprite: 'girl:sad', text: 'いぬが いない……😢', en: 'My dog is gone…' },
      { text: 'いぬが いない inu ga inai. A collar… いぬ must be dog. The dog is not here.', ja: 'いぬが いない。くびわ…… そうです、いぬです。いぬが いません。' },
      { glyph: 'なな', text: 'The name tag on the collar fills back in.', ja: 'くびわの なふだに、なまえが もどりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'なな！ いぬ、なな！' },
      { speaker: 'girl', sprite: 'girl:sad', text: 'ななー！', en: 'Nana!' },
      { fx: ['sparkle'], text: 'She calls the name, and a little dog comes running out from behind the suitcases.', ja: 'おんなのこが なまえを よびました。スーツケースの うしろから ちいさい いぬが きました！' },
      { speaker: 'girl', sprite: 'girl:happy', text: 'なな！ よかった……！ ありがとう！ 🐶', en: 'Nana! Thank goodness… thank you!' },
      { text: 'Nana sniffs the air, then barks at the long walkway to the station. Woof!', ja: 'ナナは えきへの ながい みちを みて……ワン！' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あっち！ 👉' },
      { text: 'あっち acchi — that way. The shadow went down the walkway.', ja: 'あっち。かげは あっちへ いきました。' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'naniwa_walkway', fx: ['darkclouds'], text: 'Nana leads us onto the long walkway to the station. Then black smoke pours in — the shadow\'s smoke.', ja: 'ナナと いっしょに、えきへの みちを いきます。くろい けむりが きました。かげの けむりです。' },
      { text: 'The arrows on the floor are fading one by one. I can barely see which way to go.', ja: 'みちの ➡️が ひとつずつ ありません。どっちですか？ わかりません。' },
      { speaker: 'traveler', sprite: 'traveler:trouble', text: 'どっちへ いくの？ 😰', en: 'Which way do I go?' },
      { text: 'The traveler from the deck is lost in the smoke too.', ja: 'あの ひとも、けむりの なかで みちが わかりません。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'みちが……！' },
      { text: '「□ちが」 …chi ga? Something about the arrows.', ja: '「□ちが」 ……ちが？ ➡️の ことですか？' },
      { text: 'The guide signs over the walkway are blank now — dark where the letters used to glow.', ja: 'みちの かんばんも くらいです。もじが ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '✍️💡🪧 かく！' },
    ],
    [
      { fx: [], speaker: 'nexmax', sprite: 'nexmax:smile', text: 'みち！ 🙆‍♂️' },
      { text: 'みち michi — the way. The arrows glow again, and the smoke scatters.', ja: 'みち。➡️が また ひかります。けむりは もう ありません。' },
      { speaker: 'traveler', sprite: 'traveler:happy', text: 'みちが わかった！ ありがとう！ 👍', en: 'Now I know the way. Thank you!' },
      { text: 'Through the glass I can see the sea, a long bridge, and a town on a high hill across the bay.', ja: 'まどの そとに 🌊と ながい はしが あります。たかい ところに、まちが あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえの まち！ 👆' },
      { text: 'うえの まち ue no machi — the town up there. まち means town!', ja: 'うえの まち。うえの ほうの まち。あの まちの ことです！' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'あの まちに、かげが いく。' },
      { text: 'かげ kage — the shadow. It is going to that town.', ja: 'かげ。かげは あの まちへ いきます。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いそいで！' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'naniwa_runway_night', text: 'Night falls before we reach the station. The runway lights have gone dark, one after another.', ja: 'よるに なりました。ひこうきの みちの でんきが、ひとつずつ くらく なります。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。' },
      { text: 'ほし hoshi… が ない ga nai. No stars. The shadow ate them too — and the runway lights.', ja: 'ほし…… が ない。ほしが ありません。かげが ほしも たべました。ひこうきの みちの でんきも。' },
      { speaker: 'nexmax', text: 'みちが みえない。よるは こわい。' },
      { text: 'みちが みえない michi ga mienai — we can\'t see the path. The rest is eaten, but I can tell he is scared.', ja: 'みちが みえない。ほかの ことばは ありません。でも、ロボットの かおは 😨です。' },
      { text: 'Dark signs lie along the runway where the lights went out. They glow faintly, like coals.', ja: 'ひこうきの みちに、くらい かんばんが たくさん あります。すこし ひかって います。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
      { text: 'かきます kakimasu — the polite way to say "write". That is how they say it in class.', ja: 'かきます。「かく」の ていねいな いいかたです。がっこうでは こう いいます。' },
    ],
    [
      { fx: ['sparkle'], text: 'Stars bloom across the sky, one by one, and the runway lights come back on.', ja: 'そらに ほしが ひとつずつ でました。ひこうきの みちの でんきも もどりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'よるの ほし、きれい！' },
      { text: 'よるの ほし yoru no hoshi — stars at night. きれい kirei — beautiful.', ja: 'よるの ほし。きれい。ほんとうに きれいです。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: 'ありがとう arigatou. That is what he tried to say at the very beginning. Thank you.', ja: 'ありがとう。いちばん はじめの「あ□□□う」です。' },
      { speaker: 'nexmax', text: 'でんしゃは あさ。' },
      { text: 'で de — that is て with two little dots. でんしゃ densha… the train, in the morning.', ja: 'で。「て」に ちいさい てんが ふたつ。でんしゃ…… あさの でんしゃです。' },
      { text: 'At dawn we reach the airport station. But every sign here is written in sharper, different letters.', ja: 'あさ、くうこうの えきに きました。でも、ここの かんばんは ほかの もじです。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ここは カタカナの えき。' },
      { text: 'ここは …の えき koko wa …no eki. This is the something station. Letters I can\'t read yet.', ja: 'ここは ……の えき。なにかの えきです。この もじは まだ わかりません。' },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'naniwa_station', text: 'The airport station is covered in signs, and every one of them is full of holes.', ja: 'くうこうの えきには かんばんが たくさん あります。どれも あなが あります。' },
      { glyph: 'ネクマックス', text: "There is a badge on the robot's chest. It is full of holes too.", ja: 'ロボットに バッジが あります。バッジにも あなが あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ぼくの なまえも、カタカナ だった。' },
      { text: 'ぼくの なまえも boku no namae mo… his name was written in these letters. That is why he can\'t say it.', ja: 'ぼくの なまえも…… ロボットの なまえは、この もじです。ですから、なまえが わかりません。' },
      { text: 'In the station hall, every sign is blank.', ja: 'えきの なかの かんばんは、ぜんぶ もじが ありません。' },
      { speaker: 'kiosk', sprite: 'kiosk:trouble', text: 'メニューが きえた……こまった……💦', en: "My menu went blank. What do I do?" },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'A kiosk sign fills back in: ココア.', ja: 'おみせの かんばんに もじが もどりました。ココア。' },
      { speaker: 'kiosk', sprite: 'kiosk:happy', text: 'ココア、どうぞ！ ☕☕', en: 'Here — have some cocoa!' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ココア！ あたたかい！ ✌️' },
      { text: 'ココア kokoa — cocoa! Two warm cups.', ja: 'ココア！ あたたかい カップが ふたつ。' },
      { glyph: 'ネクマックス', text: 'Two letters come back on his badge.', ja: 'バッジに もじが ふたつ もどりました。' },
      { speaker: 'nexmax', text: 'あと すこし！' },
      { text: 'あと すこし ato sukoshi — almost there.', ja: 'あと すこし。もう すぐです。' },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'naniwa_station_gate', text: 'A ticket machine. Its screen is blank.', ja: 'きっぷの きかいです。きかいに もじが ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'キップを かいたい。どこを おす？ 🤔' },
      { text: 'かいたい kaitai — he wants to buy something. どこを おす doko o osu — where do I press?', ja: 'かいたい。なにかを かいたいです。どこを おす？ どこを おしますか？' },
      { text: "The ticket machine's buttons are blank — one dark square after another.", ja: 'きかいの ボタンにも もじが ありません。くらい □が たくさん。' },
      { speaker: 'staff', sprite: 'staff:trouble', text: 'きかいの じが わからない…… こまった。💦', en: "I can't read the machine… What do I do?" },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'Letters appear on the screen: スタート.', ja: 'きかいに もじが でました。スタート。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'スタート！ 👉' },
      { text: 'スタート sutāto — start! The long mark ー stretches the sound. I press it.', ja: 'スタート！「ー」は おとを ながく します。ボタンを おしました。' },
      { text: 'The next screen says: キップ. Still one letter short.', ja: 'つぎは キップ。でも、まだ もじが ひとつ ありません。' },
      { glyph: 'ネクマックス', text: 'More of his badge comes back — even the little ッ.', ja: 'バッジの もじが また もどりました。ちいさい「ッ」も。' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'naniwa_station_platform', text: 'A train is coming. I can hear it on the tracks.', ja: 'でんしゃが きます。ガタン、ゴトン。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'キップが ないと、のれない！' },
      { text: 'のれない norenai — without a ticket we can\'t get on!', ja: 'のれない。キップが ありません。でんしゃに のる ことが できません！' },
      { text: 'The sign over the platform gate has gone dark.', ja: 'ゲートの うえの かんばんも くらいです。' },
      { speaker: 'staff', sprite: 'staff:trouble', text: 'ゲートの かんばんも わからない…… 💦', en: "I can't read the gate sign either…" },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { text: 'A ticket slides out: キップ kippu! The little ○ on フ makes プ.', ja: 'キップが でました！「フ」に ちいさい まる。「プ」です。' },
      { speaker: 'staff', sprite: 'staff:happy', text: 'きっぷが でた！ これで でんしゃが はしります！', en: 'Tickets again! Now the trains can run!' },
      { text: 'Two trains stand at the platform: a red one and a blue one.', ja: 'でんしゃが ふたつ あります。あかい でんしゃと、あおい でんしゃ。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あお！ うえの まち！ 👆' },
      { text: 'The blue one crosses the bridge to the town up on the hill. Blue and up — just like the blue escalator.', ja: 'あおい でんしゃは うえの まちへ いきます。あおで、うえ。あおい エスカレーターと おなじです！' },
      { text: 'A black shadow slides into the last car of the blue train.', ja: 'くろい かげが、あおい でんしゃの いちばん うしろに はいりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かげ！ いそいで！' },
      { glyph: 'ネクマックス', text: 'Only one hole is left on his badge.', ja: 'バッジの あなは、あと ひとつだけです。' },
    ],
  ),
  script(
    'kana-9',
    [
      { bg: 'naniwa_train', text: 'The blue train runs out over the long bridge across the bay, toward the town on the hill. The shadow waits in the last car.', ja: 'あおい でんしゃは、ながい はしの うえを いきます。うえの まちへ。かげは いちばん うしろに います。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'なまえが ないと、ちからが でない。' },
      { text: 'なまえが ないと namae ga nai to… ちからが でない chikara ga denai. Without his name, he has no strength.', ja: 'なまえが ないと、ちからが でない。なまえが ありませんから、ロボットは つよく ありません。' },
      { text: 'Dark, blank signs hang all along the aisle to the last car.', ja: 'いちばん うしろまで、くらい かんばんが たくさん あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！' },
    ],
    [
      { glyph: 'ネクマックス', text: 'The last hole on the badge fills in.', ja: 'バッジの さいごの あなに、もじが もどりました。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックス！' },
      { text: 'ネクマックス Nekumakkusu. Nexmax. His name — whole again.', ja: 'ネクマックス。ロボットの なまえが、ぜんぶ もどりました。' },
      { speaker: 'nexmax', text: 'わかった？ 🙆‍♂️' },
      { text: 'At the end of the car there is a door, and a name is written on it: モジクイ.', ja: 'でんしゃの うしろに ドアが あります。ドアに なまえが あります。モジクイ。' },
      { text: 'モジ moji — letters. クイ kui — eater. モジクイ. So that is the shadow.', ja: 'モジは もじ。クイは「たべます」。モジクイ。あの かげの なまえです。' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイ！ いこう！' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'naniwa_last_car', fx: ['sparkle'], text: 'Behind the door: a whirlpool of letters. In the middle, the Mojikui is slurping them up like ramen.', ja: 'ドアの なかで、もじが クルクル。モジクイが もじを たべて います。ズルズル！ 🍜' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かえして！ ぜんぶ かえして！' },
      { text: 'かえして kaeshite — give them back!', ja: 'かえして！ もじを かえして！' },
      { text: 'The last blank signs spin in the whirlpool.', ja: 'クルクルの なかに、さいごの かんばんが あります。' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '✍️💡🪧 かきます！ さいごの カタカナ！' },
    ],
    [
      { fx: ['heal'], text: 'The Mojikui chokes, and kana burst out of it like confetti.', ja: 'モジクイが「ゴホッ！」。かなが たくさん そとへ でます。' },
      { text: 'But it leaps through the window and flees ahead, into the town on the hill.', ja: 'でも、モジクイは まどから そとへ。うえの まちへ いきました。' },
      { bg: 'naniwa_train', glyph: 'ナニワタウン', text: 'The train comes off the bridge. Over the station ahead hangs a big sign — and I can read every letter of it.', ja: 'えきに おおきい かんばんが あります。もう ぜんぶの もじが わかります！' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'うえの まちは、ナニワタウン！' },
      { text: 'ナニワタウン Naniwa Taun — Naniwa Town. That is the town up on the hill.', ja: 'ナニワタウン。あれが うえの まちです。' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ナニワタウンで、かんじが きえて いる。' },
      { text: 'In Naniwa Town, the kanji are disappearing.', ja: 'ナニワタウンには、かんじが ありません。' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あなたは もう、ひらがなも カタカナも わかる。' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは かんじ！ 🙆‍♂️' },
      { text: 'ありがとう. This time I understood every word.', ja: 'ありがとう。いまは ぜんぶの ことばが わかります。' },
    ],
  ),
]);
