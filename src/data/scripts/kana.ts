import type { CastMember, NovelLine, NovelScript } from '../../types/novel';
import { MUKASHI_CAST } from './mukashi';

/**
 * かな編「かなの もり」の 脚本 (08 §3.4, §3.4.2).
 *
 * 2026-09-26 の 指定で 作り直した:
 *  - ネクマックスは **戻った かなで しか 話せない**。まだ 書いて いない かなは
 *    ムシクイの 穴（□）に なる（KanaText mode="mask"）。1話の 終わりの
 *    「ありがとう」は「あ□□□う」。5話で ぜんぶ 読めて、意味が わかる。
 *  - 地の文は **主人公の 目と 考えで、英語**。ネクマックスの 言葉の かけらを
 *    英語で 解釈しながら 進む（「あお… blue? うえ… up?」）。
 *  - ネクマックスは 絵文字（🙆‍♂️ 🙅 👆 …）でも 気持ちを 伝える。
 *  - 「あお」「うえ」は 伏線: 青い 階段 → 青い 電車 →「うえの まち」（1章の 町）。
 *
 * すじ（§3.4.1）は そのまま: 影（モジクイ）が 言葉と 名前を 食べて 町へ。
 * 朝の 電車より 先に 駅へ。字は 書くと 戻るが、ネクマックスは 形を 忘れた。
 * kana.test.ts が「ネクマックスの 台詞は かなと 絵文字だけ」「地の文は 英語」を 確かめる。
 */

export const KANA_CAST: CastMember[] = MUKASHI_CAST.filter((c) => c.id === 'nexmax');

/** Before his name comes back (kana-9), the name plate can only say what he is. */
export const KANA_CAST_NAMELESS: CastMember[] = KANA_CAST.map((c) => ({ ...c, name: 'ロボット' }));

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
      { bg: 'mukashi_meadow', text: 'Boom! Something falls out of the sky — a little robot.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'たすけて。ことばを たべられた。' },
      { text: "It's trying to talk, but its words come out full of holes." },
      { speaker: 'nexmax', text: '🙅 だめだ……' },
      { text: 'Five rocks block the path. On each one, a faint letter shows through the stone.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🗣️ → 🪨' },
      { text: 'Words… into rock? The words it lost were turned to stone?' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '✍️ → ⚔️ → 🪨💥 → 🗣️' },
      { text: 'Write — a blade — the rock breaks — it can speak again. If I write the letter on the rock, it cuts it open.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👉🪨 🙏' },
      { text: 'Okay. Let me try.' },
    ],
    [
      { text: 'The last rock splits in two. Something bright flies out of it — into the robot\'s chest — and its lamp flickers on.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: '「あ□□□う」 a… … … u! Only two sounds got through — the rest is holes.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……？ 🙅' },
      { text: 'It frowns. Then it tries again — using only the letters I just wrote.' },
      { speaker: 'nexmax', text: 'あ、い、う、え、お！' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あお！ ☝️' },
      { text: 'あお ao… It points at the sky. Blue? Does あお mean blue?' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえ！ 👆' },
      { text: 'うえ ue… and it points up. Up?' },
      { fx: ['fork'], text: 'Ahead, the path splits: a red gate going down, and blue stone steps going up the hill.' },
      { speaker: 'nexmax', text: 'あお、うえ！ 🙆‍♂️ あか 🙅' },
      { text: 'Blue, up — not red. We should take the blue steps up!' },
    ],
  ),
  script(
    'kana-2',
    [
      { bg: 'mukashi_forest', fx: ['morning'], text: 'At the top of the blue steps, a deep forest. The path splits three ways.' },
      { text: 'Something black slips between the trees — a shadow, munching on something. Letters?' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'え？ え？ 🤔' },
      { text: "An old tree stands at the fork. Its face has been eaten away." },
      { speaker: 'nexmax', text: 'き！ かお！' },
      { text: '「□！ □お！」 …o? I can\'t make it out.' },
      { text: 'Rocks lie around the roots — the pieces of its face, turned to stone.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かいて！' },
      { text: 'Same as before: write, cut, and the words come back.' },
    ],
    [
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'き！ かお！' },
      { text: 'き ki… かお kao. He points at the tree, then at its face. き — tree. かお — face!' },
      { text: 'The bark shifts. Two eyes open. The tree has a face again.' },
      { text: '「えき。 あそこ。」' },
      { text: 'えき eki… a station? あそこ asoko — over there?' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'えき！ いこう！ 🙆‍♂️' },
      { text: 'いこう ikou — let\'s go. The shadow is heading for the station.' },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'mukashi_village', fx: ['gloom'], text: 'We reach a small village. It is silent. Nobody is calling anybody.' },
      { text: 'A girl sits by the road, holding an empty dog collar.' },
      { text: '「いぬが いない……」' },
      { text: 'Her words are full of holes too.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……😢' },
      { text: 'Rocks are piled at the village gate, each holding a name.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かく！' },
      { text: 'かく kaku — write. Now that he has か and く back, he says it the short way.' },
    ],
    [
      { text: '「いぬが いない……」' },
      { text: 'いぬが いない inu ga inai. A collar… いぬ must be dog. The dog is not here.' },
      { glyph: 'なな', text: 'The name tag on the collar fills back in.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'なな！ いぬ、なな！' },
      { text: '「ななー！」' },
      { fx: ['sparkle'], text: 'She calls the name, and a dog comes running out of the trees.' },
      { text: 'Nana sniffs the air, then barks at the mountain. Woof!' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あっち！ 👉' },
      { text: 'あっち acchi — that way. The shadow went over the mountain.' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'mukashi_mountain', fx: ['darkclouds'], text: 'Nana leads us up the mountain. Then black clouds pour down — the shadow\'s smoke.' },
      { text: 'The trail markers are fading one by one. I can barely see where to step.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'みちが……！' },
      { text: '「□ちが」 …chi ga? Something about the markers.' },
      { text: 'Rocks have rolled onto the trail where the markers used to be.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '🪨 ⚔️ かく！' },
    ],
    [
      { fx: [], speaker: 'nexmax', sprite: 'nexmax:smile', text: 'みち！ 🙆‍♂️' },
      { text: 'みち michi — the path. The markers glow again, and the clouds scatter.' },
      { text: 'From the top I can see the sea, a town on a high hill, and a station at the foot of the mountain.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえの まち！ 👆' },
      { text: 'うえの まち ue no machi — the town up there. まち means town!' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'あの まちに、かげが いく。' },
      { text: 'かげ kage — the shadow. It is going to that town.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いそいで！' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'mukashi_greattree', fx: ['dusk'], text: 'Night falls before we reach the station. The way down is pitch black.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。' },
      { text: 'ほし hoshi… が ない ga nai. No stars. The shadow ate them too.' },
      { speaker: 'nexmax', text: 'みちが みえない。よるは こわい。' },
      { text: 'みちが みえない michi ga mienai — we can\'t see the path. The rest is eaten, but I can tell he is scared.' },
      { text: 'Rocks lie where the stars fell. They glow faintly, like coals.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！' },
      { text: 'かきます kakimasu — the polite way to say "write". That is how they say it in class.' },
    ],
    [
      { fx: [], text: 'Stars bloom across the sky, one by one, and light the path down.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'よるの ほし、きれい！' },
      { text: 'よるの ほし yoru no hoshi — stars at night. きれい kirei — beautiful.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: 'ありがとう arigatou. That is what he tried to say at the very beginning. Thank you.' },
      { speaker: 'nexmax', text: 'でんしゃは あさ。' },
      { text: 'で de — that is て with two little dots. でんしゃ densha… the train, in the morning.' },
      { text: 'At dawn we reach the station. But every sign here is written in sharper, different letters.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ここは カタカナの えき。' },
      { text: 'ここは …の えき koko wa …no eki. This is the something station. Letters I can\'t read yet.' },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'gendai_city', text: 'The station is covered in signs, and every one of them is full of holes.' },
      { glyph: 'ネクマックス', text: "There is a badge on the robot's chest. It is full of holes too." },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ぼくの なまえも、カタカナ だった。' },
      { text: 'ぼくの なまえも boku no namae mo… his name was written in these letters. That is why he can\'t say it.' },
      { text: 'Rocks sit in the station hall, one under every sign.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！' },
    ],
    [
      { text: 'A kiosk sign fills back in: ココア.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ココア！ あたたかい！ ✌️' },
      { text: 'ココア kokoa — cocoa! Two warm cups.' },
      { glyph: 'ネクマックス', text: 'Two letters come back on his badge.' },
      { speaker: 'nexmax', text: 'あと すこし！' },
      { text: 'あと すこし ato sukoshi — almost there.' },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'gendai_city', text: 'A ticket machine. Its screen is blank.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'キップを かいたい。どこを おす？ 🤔' },
      { text: 'かいたい kaitai — he wants to buy something. どこを おす doko o osu — where do I press?' },
      { text: 'Rocks are stacked in front of the machine.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！' },
    ],
    [
      { text: 'Letters appear on the screen: スタート.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'スタート！ 👉' },
      { text: 'スタート sutāto — start! The long mark ー stretches the sound. I press it.' },
      { text: 'The next screen says: キップ. Still one letter short.' },
      { glyph: 'ネクマックス', text: 'More of his badge comes back — even the little ッ.' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'gendai_city', text: 'A train is coming. I can hear it on the tracks.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'キップが ないと、のれない！' },
      { text: 'のれない norenai — without a ticket we can\'t get on!' },
      { text: 'Rocks block the platform gate.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！' },
    ],
    [
      { text: 'A ticket slides out: キップ kippu! The little ○ on フ makes プ.' },
      { text: 'Two trains stand at the platform: a red one and a blue one.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あお！ うえの まち！ 👆' },
      { text: 'The blue one goes to the town up the hill. Blue and up — just like the blue steps.' },
      { text: 'A black shadow slides into the last car of the blue train.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かげ！ いそいで！' },
      { glyph: 'ネクマックス', text: 'Only one hole is left on his badge.' },
    ],
  ),
  script(
    'kana-9',
    [
      { bg: 'gendai_bus', text: 'The blue train climbs toward the upper town. The shadow waits in the last car.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'なまえが ないと、ちからが でない。' },
      { text: 'なまえが ないと namae ga nai to… ちからが でない chikara ga denai. Without his name, he has no strength.' },
      { text: 'Rocks fill the aisle between us and the last car.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！' },
    ],
    [
      { glyph: 'ネクマックス', text: 'The last hole on the badge fills in.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックス！' },
      { text: 'ネクマックス Nekumakkusu. Nexmax. His name — whole again.' },
      { speaker: 'nexmax', text: 'よめた？ 🙆‍♂️' },
      { text: 'At the end of the car there is a door, and a name is written on it: モジクイ.' },
      { text: 'モジ moji — letters. クイ kui — eater. モジクイ. So that is the shadow.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイ！ いこう！' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'mukashi_portal', fx: ['portal'], text: 'Behind the door: a whirlpool of letters. In the middle, the Mojikui is slurping them up like ramen.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かえして！ ぜんぶ かえして！' },
      { text: 'かえして kaeshite — give them back!' },
      { text: 'The last rocks spin in the whirlpool.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '🪨 ⚔️ かきます！ さいごの カタカナ！' },
    ],
    [
      { fx: ['heal'], text: 'The Mojikui chokes, and kana burst out of it like confetti.' },
      { text: 'But it leaps through the window and flees into the upper town.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'うえの まちで、かんじが きえて いる。' },
      { text: 'In the upper town, the kanji are disappearing.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あなたは もう、ひらがなも カタカナも よめる。' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは かんじ！ 🙆‍♂️' },
      { text: 'ありがとう. This time I understood every word.' },
    ],
  ),
]);
