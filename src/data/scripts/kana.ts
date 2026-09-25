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
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
      { text: 'It points at the ground. Faint letters are scratched into the dirt. It wants me to write them?' },
    ],
    [
      { text: "As I finish the last letter, the lamp on the robot's chest flickers on." },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: '"A… … … u!" Only two sounds got through — the rest is holes.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……？ 🙅' },
      { text: 'It frowns. Then it tries again — using only the letters I just wrote.' },
      { speaker: 'nexmax', text: 'あ、い、う、え、お！' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あお！ ☝️' },
      { text: 'Ao… It points at the sky. Blue? Does "ao" mean blue?' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえ！ 👆' },
      { text: 'Ue… and it points up. Up?' },
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
      { text: 'Something… "-o"? I can\'t make it out.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
      { text: 'Same as before. He wants me to write.' },
    ],
    [
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'き！ かお！' },
      { text: 'Ki… kao. He points at the tree, then at its face. "Ki" — tree. "Kao" — face!' },
      { text: 'The bark shifts. Two eyes open. The tree has a face again.' },
      { text: '「えき。 あそこ。」' },
      { text: 'Eki… I think I know that one. A station? And "asoko" — over there?' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'えき！ いこう！ 🙆‍♂️' },
      { text: 'Ikou. Let\'s go. The shadow is heading for the station.' },
    ],
  ),
  script(
    'kana-3',
    [
      { bg: 'mukashi_village', fx: ['gloom'], text: 'We reach a small village. It is silent. Nobody is calling anybody.' },
      { text: 'A girl sits by the road, holding an empty dog collar.' },
      { text: '「いぬが いない……」' },
      { text: 'I… something… Her words are eaten too.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: '……😢' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { text: '「いぬが いない……」' },
      { text: 'Inu ga inai. She is holding a collar — "inu" must be dog. The dog… is not here.' },
      { glyph: 'なな', text: 'The name tag on the collar fills back in.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'なな！ いぬ、なな！' },
      { text: '「ななー！」' },
      { fx: ['sparkle'], text: 'She calls the name, and a dog comes running out of the trees.' },
      { text: 'Nana sniffs the air, then barks at the mountain. Woof!' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'あっち！ 👉' },
      { text: '"Acchi" — that way. The shadow went over the mountain.' },
    ],
  ),
  script(
    'kana-4',
    [
      { bg: 'mukashi_mountain', fx: ['darkclouds'], text: 'Nana leads us up the mountain. Then black clouds pour down — the shadow\'s smoke.' },
      { text: 'The trail markers are fading one by one. I can barely see where to step.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'みちが……！' },
      { text: '"…chi ga"? Something about the markers.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: '👇 かいて！' },
    ],
    [
      { fx: [], speaker: 'nexmax', sprite: 'nexmax:smile', text: 'みち！ 🙆‍♂️' },
      { text: 'Michi — the path. The markers glow again, and the clouds scatter.' },
      { text: 'From the top I can see the sea, a town on a high hill, and a station at the foot of the mountain.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'うえの まち！ 👆' },
      { text: '"Ue no machi." The town up there… "machi" means town!' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'あの まちに、かげが いく。' },
      { text: 'Kage — the shadow. The shadow is going to that town.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'いそいで！' },
    ],
  ),
  script(
    'kana-5',
    [
      { bg: 'mukashi_greattree', fx: ['dusk'], text: 'Night falls before we reach the station. The way down is pitch black.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ほしが ない。' },
      { text: 'Hoshi… "ga nai". No… stars? There are no stars. The shadow ate them too.' },
      { speaker: 'nexmax', text: 'みちが みえない。よるは こわい。' },
      { text: 'Michi ga mienai — we can\'t see the path. The rest is eaten, but I can tell he is scared.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { fx: [], text: 'Stars bloom across the sky, one by one, and light the path down.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'よるの ほし、きれい！' },
      { text: 'Yoru no hoshi… stars at night. Kirei — beautiful.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ありがとう！' },
      { text: 'Arigatou. That is what he tried to say at the very beginning. Thank you.' },
      { speaker: 'nexmax', text: 'でんしゃは あさ。' },
      { text: '"De" — that is "te" with two little dots. Densha… the train, in the morning.' },
      { text: 'At dawn we reach the station. But every sign here is written in sharper, different letters.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ここは カタカナの えき。' },
      { text: '"Koko wa …no eki." This is the something station. Another kind of letters I can\'t read yet.' },
    ],
  ),
  script(
    'kana-6',
    [
      { bg: 'gendai_city', text: 'The station is covered in signs, and every one of them is full of holes.' },
      { glyph: 'ネクマックス', text: "There is a badge on the robot's chest. It is full of holes too." },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'ぼくの なまえも、カタカナ だった。' },
      { text: 'Boku no namae mo… "My name was also…" — his name was written in these letters. That is why he can\'t say it.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { text: 'A kiosk sign fills back in: ココア.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ココア！ あたたかい！ ✌️' },
      { text: 'Kokoa — cocoa! Two warm cups.' },
      { glyph: 'ネクマックス', text: 'Two letters come back on his badge.' },
      { speaker: 'nexmax', text: 'あと すこし！' },
      { text: '"Ato sukoshi" — almost there.' },
    ],
  ),
  script(
    'kana-7',
    [
      { bg: 'gendai_city', text: 'A ticket machine. Its screen is blank.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'キップを かいたい。どこを おす？ 🤔' },
      { text: '"…o kaitai. Doko o osu?" He wants to buy something. Where to press?' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { text: 'Letters appear on the screen: スタート.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'スタート！ 👉' },
      { text: 'Sutāto — start! The long mark "ー" stretches the sound. I press it.' },
      { text: 'The next screen says: キップ. Still one letter short.' },
      { glyph: 'ネクマックス', text: 'More of his badge comes back — even the little ッ.' },
    ],
  ),
  script(
    'kana-8',
    [
      { bg: 'gendai_city', text: 'A train is coming. I can hear it on the tracks.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'キップが ないと、のれない！' },
      { text: '"…ga nai to, norenai." Without a ticket we can\'t get on!' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { text: 'A ticket slides out: キップ. "Kippu" — a ticket! The little ○ on フ makes プ.' },
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
      { text: 'Namae ga nai to… chikara ga denai. Without his name, he has no strength.' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！' },
    ],
    [
      { glyph: 'ネクマックス', text: 'The last hole on the badge fills in.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'ぼくは ネクマックス！' },
      { text: 'Nekumakkusu. Nexmax. His name — whole again.' },
      { speaker: 'nexmax', text: 'よめた？ 🙆‍♂️' },
      { text: 'At the end of the car there is a door, and a name is written on it: モジクイ.' },
      { text: '"Moji" means letters… "kui", eater. The Mojikui. So that is the shadow.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイ！ いこう！' },
    ],
  ),
  script(
    'kana-10',
    [
      { bg: 'mukashi_portal', fx: ['portal'], text: 'Behind the door: a whirlpool of letters. In the middle, the Mojikui is slurping them up like ramen.' },
      { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かえして！ ぜんぶ かえして！' },
      { text: 'Kaeshite — give them back!' },
      { speaker: 'nexmax', sprite: 'nexmax:guide', text: '👇 かいて！ さいごの カタカナ！' },
    ],
    [
      { fx: ['heal'], text: 'The Mojikui chokes, and kana burst out of it like confetti.' },
      { text: 'But it leaps through the window and flees into the upper town.' },
      { speaker: 'nexmax', sprite: 'nexmax:think', text: 'うえの まちで、かんじが きえて いる。' },
      { text: 'In the upper town, the kanji are disappearing.' },
      { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'あなたは もう、ひらがなも カタカナも よめる。' },
      { speaker: 'nexmax', text: 'ありがとう。つぎは かんじ！ 🙆‍♂️' },
      { text: 'Arigatou. This time I understood every word.' },
    ],
  ),
]);
