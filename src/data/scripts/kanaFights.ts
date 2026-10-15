import type { CastMember, NovelScript } from '../../types/novel';
import { KANA_BOSSES, KANA_FOES } from '../kanaBattle';

/**
 * 0章の たたかいの お話 (docs/design/22 §4): after each episode's writing, the
 * letters just lit draw one of the shadow's little ones (encounter); the two
 * bosses have a story of their own before and after the fight.
 *
 * The rules of 0章's scripts hold here too (kanaFights.test.ts): Nexmax says
 * only kana and pictures, the narration is the player's thoughts in English
 * with its Japanese in kana, and nobody speaks kanji.
 */

/** The shadows, as the story shows them: their name and their picture. */
export const KANA_FOE_CAST: CastMember[] = [
  ...Object.entries(KANA_FOES).map(([id, f]) => ({ id: `foe_${id}`, name: f.name, color: '#5a2d8c', sprites: { normal: f.img } })),
  ...KANA_BOSSES.map((b) => ({ id: `foe_${b.id}`, name: b.foe.name, color: '#3b1a66', sprites: { normal: b.foe.img } })),
];

const meet = (id: string, lines: NovelScript['lines']): [string, NovelScript] => [id, { stageId: id, lines }];

/** Each episode's meeting: what comes for the letters just lit. */
export const KANA_ENCOUNTERS: Record<string, NovelScript> = Object.fromEntries([
  meet('kana-1', [
    { text: 'The signs light up — and something small zooms down out of the sky, folded like a paper plane. A shadow!', ja: 'かんばんが ひかりました。そらから ちいさい かげが とんで きました！' },
    { speaker: 'foe_kana-1', sprite: 'foe_kana-1:normal', text: '😝✈️💨' },
    { text: 'It wants the letters we just brought back.', ja: 'かげは もどった もじを たべたいです。' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: '🙅 ✍️💡 → 💥' },
    { text: 'Write, light, strike — he steps in front of me, the light of my letters in his chest.', ja: 'かく、ひかる、たたかう。ロボットが まえに でます。むねに わたしの もじの ひかり。' },
  ]),
  meet('kana-2', [
    { text: 'Petals fall from the old tree — and a fat little shadow crawls out of the blossoms, munching.', ja: 'はなびらが おちます。はなの なかから、ちいさい かげが でて きました。もぐもぐ。' },
    { speaker: 'foe_kana-2', sprite: 'foe_kana-2:normal', text: '🌸😋 もぐもぐ' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'だめ！ 🙅 かく！ ✍️' },
    { text: 'It is eating the face we just gave the tree. Not again.', ja: 'かげが きの かおを たべて います。もう だめです。' },
  ]),
  meet('kana-3', [
    { text: 'The name tag lights up — and a puppy made of shadow snatches the collar and runs.', ja: 'なふだが ひかりました。でも、かげの いぬが くびわを とって はしります。' },
    { speaker: 'foe_kana-3', sprite: 'foe_kana-3:normal', text: '🐾 わん！ 😜' },
    { speaker: 'girl', sprite: 'girl:sad', text: 'なな！ 😢', en: 'Nana!' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'かえして！ ✍️💡 → 💥' },
  ]),
  meet('kana-4', [
    { text: 'The black smoke in the walkway rolls itself into a ball, with two angry eyes.', ja: 'くろい けむりが まるく なりました。おこった めが ふたつ。' },
    { speaker: 'foe_kana-4', sprite: 'foe_kana-4:normal', text: '💨😤 ぷんぷん' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'みち！ かえして！ 👉' },
    { text: 'It wants the arrows on the floor. Without them nobody finds the station.', ja: 'かげは ゆかの やじるしが ほしいです。やじるしが ないと、えきが わかりません。' },
  ]),
  meet('kana-5', [
    { text: 'A star comes back — and a little bat of night snaps it out of the sky.', ja: 'ほしが もどりました。でも、ちいさい よるの かげが ほしを くわえました。' },
    { speaker: 'foe_kana-5', sprite: 'foe_kana-5:normal', text: '🦇⭐ にひひ' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ほし！ かえして！ ✍️' },
  ]),
  meet('kana-6', [
    { text: 'The kiosk sign is lit — and the ticket gate itself grows eyes and slams its doors shut.', ja: 'おみせの かんばんが ひかりました。すると、かいさつに めが でて、ドアを しめました！' },
    { speaker: 'foe_kana-6', sprite: 'foe_kana-6:normal', text: '🚫 ピピーッ！' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'とおして！ ✍️💡 → 💥' },
  ]),
  meet('kana-7', [
    { text: 'The machine prints again — and a moth with ticket wings flutters out of the slot, nibbling.', ja: 'きかいが うごきました。でも、キップの はねの かげが でて きて、かじって います。' },
    { speaker: 'foe_kana-7', sprite: 'foe_kana-7:normal', text: '🦋🎫 かじかじ' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'キップ！ だめ！ 🙅' },
  ]),
  meet('kana-8', [
    { text: 'A toy-sized shadow train comes rattling down the platform with the gate sign on its roof.', ja: 'ちいさい かげの でんしゃが きました。やねに ゲートの かんばん。' },
    { speaker: 'foe_kana-8', sprite: 'foe_kana-8:normal', text: '🚂💨 ガタンゴトン！' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'まて！ ✍️💡 → 💥' },
  ]),
  meet('kana-9', [
    { text: 'Over the sea, a shadow gull swoops at the window — the last hole of his badge in its beak.', ja: 'うみの うえで、かげの とりが まどに きました。くちに バッジの もじ。' },
    { speaker: 'foe_kana-9', sprite: 'foe_kana-9:normal', text: '🐦 ギャーギャー！' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ぼくの なまえ！ かえして！' },
  ]),
  meet('kana-10', [
    { text: 'The whirlpool of letters spins up into a dizzy little shadow of its own.', ja: 'もじの クルクルが、ちいさい かげに なりました。' },
    { speaker: 'foe_kana-10', sprite: 'foe_kana-10:normal', text: '🌀 くるくる〜' },
    { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'さいごの カタカナ！ ✍️💡 → 💥' },
  ]),
]);

interface BossScript {
  intro: NovelScript;
  outro: NovelScript;
  /** For the hiragana boss: the lines after its fight, once Nexmax has grown (EvolveScene) — before the outro. */
  evolve?: { text: string; en: string }[];
}

/** The two bosses' stories (docs/design/22 §4.2). */
export const KANA_BOSS_SCRIPTS: Record<string, BossScript> = {
  'kana-boss-1': {
    intro: {
      stageId: 'kana-boss-1',
      lines: [
        { bg: 'naniwa_runway_night', text: 'The stars are back over the runway. But at its far end the dark pulls itself up into a huge round shadow.', ja: 'ほしが もどりました。でも、ひこうきの みちの さいごに、おおきい まるい かげが います。' },
        { speaker: 'foe_kana-boss-1', sprite: 'foe_kana-boss-1:normal', text: '😋🌟🌟🌟' },
        { text: 'Inside its belly letters glow like trapped stars — every hiragana it ever ate.', ja: 'おなかの なかで もじが ひかって います。たべた ひらがな ぜんぶです。' },
        { speaker: 'nexmax', sprite: 'nexmax:think', text: 'おおきい……😨' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'ぜんぶ かえして！ ✍️💡 → 💥' },
        { text: 'All of them. Every hiragana I have learned. This is the test.', ja: 'ぜんぶの ひらがな。わたしが かいた もじ ぜんぶです。' },
      ],
    },
    evolve: [
      { text: 'ひらがな ぜんぶ！', en: 'Every hiragana — back!' },
      { text: 'ぼくは ひらがな マスター！ ありがとう！', en: "I'm a hiragana master! Thank you!" },
    ],
    outro: {
      stageId: 'kana-boss-1',
      lines: [
        { bg: 'naniwa_runway_night', text: 'What is left of the shadow — small again — scurries off toward the station.', ja: 'ちいさく なった かげは、えきの ほうへ にげました。' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'まだ なまえは ない。でも、ちからが すこし もどった！ 💪' },
        { text: 'Still no name — but some of his strength is back. His name was in the other letters: katakana.', ja: 'まだ なまえは ありません。でも、すこし つよく なりました。なまえは もう ひとつの もじ、カタカナです。' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'えき！ いこう！ 👉' },
      ],
    },
  },
  'kana-boss-2': {
    intro: {
      stageId: 'kana-boss-2',
      lines: [
        { bg: 'naniwa_last_car', text: 'Thud. Something drops back into the last car: the Mojikui, with a huge bowl of glowing letters in its arms.', ja: 'ドン！ さいごの しゃりょうに モジクイが もどって きました。ひかる もじの おおきい ちゃわんを もって います。' },
        { speaker: 'foe_kana-boss-2', sprite: 'foe_kana-boss-2:normal', text: '🍜😋 ズルズル……' },
        { text: 'It came back for the katakana — the station, the tickets, his name, all of it in that bowl.', ja: 'カタカナを たべに きました。えきの もじも、キップも、なまえも、ぜんぶ ちゃわんの なか。' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'モジクイ！ ぜんぶ かえして！' },
        { speaker: 'nexmax', sprite: 'nexmax:guide', text: 'かきます！ ✍️💡 → 💥' },
      ],
    },
    outro: {
      stageId: 'kana-boss-2',
      lines: [
        { bg: 'naniwa_last_car', text: 'The bowl tips over and every katakana pours out like a waterfall of light.', ja: 'ちゃわんが ひっくりかえって、カタカナが ぜんぶ でて きました。ひかりの たきです。' },
        { speaker: 'foe_kana-boss-2', sprite: 'foe_kana-boss-2:normal', text: '💦💦 にげます！' },
        { text: 'It dives out of the window, toward the lights of the town on the hill.', ja: 'モジクイは まどから そとへ。うえの まちへ にげました。' },
        { speaker: 'nexmax', sprite: 'nexmax:smile', text: 'カタカナ ぜんぶ！ ✌️' },
        { speaker: 'nexmax', sprite: 'nexmax:determined', text: 'つぎは ナニワタウン！' },
      ],
    },
  },
};
