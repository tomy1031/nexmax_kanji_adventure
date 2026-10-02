import type { CastMember } from '../../types/novel';

/**
 * Nexmax in the new route (かな編・1章〜): the glossy look of the title and
 * stage-select art (scripts/art/manifest.mjs, nexmax_naniwa). The older arcs
 * keep their flat picture-book cut-outs (mukashi.ts).
 */
export const NANIWA_NEXMAX: CastMember = {
  id: 'nexmax',
  name: 'ネクマックス',
  color: '#3aa8f0',
  sprites: {
    normal: 'img/chara/naniwa/nexmax_normal.webp',
    smile: 'img/chara/naniwa/nexmax_smile.webp',
    think: 'img/chara/naniwa/nexmax_think.webp',
    determined: 'img/chara/naniwa/nexmax_determined.webp',
    hello: 'img/chara/naniwa/nexmax_hello.webp',
    guide: 'img/chara/naniwa/nexmax_guide.webp',
  },
};

const folk = (name: string) => `img/chara/naniwa/folk_${name}.webp`;

/**
 * The people of the airport and of Naniwa Town, with the faces the missing
 * letters give them — puzzled, sad — and the ones the letters bring back
 * (2026-10-02「もっと 文字が なくて みんな 困って いる 表情に したり 工夫が 欲しい」).
 * The pictures are scripts/art/manifest.mjs, folk_naniwa. Names in kana:
 * かな編 can only show kana.
 */
export const NANIWA_FOLK: CastMember[] = [
  { id: 'traveler', name: 'たびの ひと', color: '#d9a21b', sprites: { normal: folk('traveler_trouble'), trouble: folk('traveler_trouble'), happy: folk('traveler_happy') } },
  { id: 'girl', name: 'おんなのこ', color: '#e0a400', sprites: { normal: folk('girl_sad'), sad: folk('girl_sad'), happy: folk('girl_happy') } },
  { id: 'kiosk', name: 'ばいてんの ひと', color: '#3a8fd8', sprites: { normal: folk('kiosk_trouble'), trouble: folk('kiosk_trouble'), happy: folk('kiosk_happy') } },
  { id: 'staff', name: 'えきいん', color: '#2f6fb8', sprites: { normal: folk('staff_trouble'), trouble: folk('staff_trouble'), happy: folk('staff_happy') } },
  { id: 'announcer', name: 'あんないがかり', color: '#2f6fb8', sprites: { normal: folk('announcer_trouble'), trouble: folk('announcer_trouble') } },
  // 1章 3〜5話（09 §1）
  { id: 'ropeway', name: 'ロープウェーの かかり', color: '#d9a21b', sprites: { normal: folk('ropeway_trouble'), trouble: folk('ropeway_trouble'), happy: folk('ropeway_happy') } },
  {
    // His name is his number, eaten: ？？？ until 七 is written.
    id: 'worker',
    name: '七(なな)ばん',
    nameChars: '七(なな)',
    color: '#2f6fb8',
    sprites: { normal: folk('worker_sleep'), sleep: folk('worker_sleep'), awake: folk('worker_awake') },
  },
  { id: 'vendor', name: 'おみせの ひと', color: '#e0a400', sprites: { normal: folk('vendor_trouble'), trouble: folk('vendor_trouble'), happy: folk('vendor_happy') } },
];
