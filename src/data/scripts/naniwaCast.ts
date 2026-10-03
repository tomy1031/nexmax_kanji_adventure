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
  // 1章 6〜10話（10 §2）. The school's name plates were eaten: ？？？ until their kanji are written.
  {
    id: 'teacher',
    name: '先(せん)生(せい)',
    nameChars: '先(せん)生(せい)',
    color: '#2f6fb8',
    sprites: { normal: folk('teacher_trouble'), trouble: folk('teacher_trouble'), happy: folk('teacher_happy') },
  },
  {
    id: 'office',
    name: '会(かい)社(しゃ)員(いん)の ひと',
    nameChars: '会(かい)社(しゃ)員(いん)',
    color: '#3a8fd8',
    sprites: { normal: folk('office_trouble'), trouble: folk('office_trouble'), happy: folk('office_happy') },
  },
  {
    id: 'doctor',
    name: 'お医(い)者(しゃ)さん',
    nameChars: '医(い)者(しゃ)',
    color: '#3aa877',
    sprites: { normal: folk('doctor_trouble'), trouble: folk('doctor_trouble'), happy: folk('doctor_happy') },
  },
  // A student from China at the school (10 §2: her country is never the joke).
  { id: 'rin', name: 'リンさん', color: '#e2799a', sprites: { normal: folk('rin_trouble'), trouble: folk('rin_trouble'), happy: folk('rin_happy') } },
  { id: 'keeper', name: 'とけいだいの ひと', color: '#3aa877', sprites: { normal: folk('keeper_trouble'), trouble: folk('keeper_trouble'), happy: folk('keeper_happy') } },
  { id: 'baker', name: 'パンやの ひと', color: '#e2799a', sprites: { normal: folk('baker_trouble'), trouble: folk('baker_trouble'), happy: folk('baker_happy') } },
  { id: 'driver', name: 'うんてんしゅさん', color: '#3aa877', sprites: { normal: folk('driver_trouble'), trouble: folk('driver_trouble'), happy: folk('driver_happy') } },
];
