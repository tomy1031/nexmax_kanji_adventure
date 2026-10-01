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
