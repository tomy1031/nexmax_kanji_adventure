import type { TargetAndTransition, Transition } from 'framer-motion';
import {
  PAGE_H,
  PAGE_W,
  birds,
  boar,
  bee,
  cloud,
  crow,
  farmer,
  hills,
  house,
  peaks,
  pine,
  rain,
  rock,
  sparkles,
  sun,
  svgDoc,
  tree,
  waves,
} from './paper';
import { GENDAI_SCENES } from './gendaiScenes';

/**
 * むかし編 の 絵本 — the scenes.
 *
 * A scene is a stack of paper layers. Some are always there (the sky, the
 * hills); some appear only while a line of the script asks for them — the
 * boar charging across, the rain, the portal opening. Those are the `fx`.
 *
 * Colours are taken from the original picture book (nexmax_kanji/): its
 * soft sky blue, the yellow-green of the rice fields, the thatch browns, the
 * orange of the hornet. The torn-paper finish is the reference clip's.
 *
 * Composition rule: the dialogue box covers roughly the bottom third of the
 * page, and the speaking character stands just above it. Everything a line
 * talks about happens in the top two thirds (y < ~470 of 720).
 */

export interface Layer {
  key: string;
  svg: string;
  /** Looping motion while on screen. */
  animate?: TargetAndTransition;
  transition?: Transition;
  /** Entrance / exit, for fx layers. */
  enter?: TargetAndTransition;
  exit?: TargetAndTransition;
  blend?: 'multiply' | 'screen' | 'overlay' | 'soft-light';
  opacity?: number;
  /** Pivot for rotate / scale, in page coordinates. Defaults to the page centre. */
  origin?: [number, number];
}

export interface SceneDef {
  layers: Layer[];
  fx: Record<string, Layer[]>;
}

const loop = (duration: number, ease: Transition['ease'] = 'easeInOut'): Transition => ({
  duration,
  repeat: Infinity,
  ease,
});

const page = (inner: string, seed?: number) => svgDoc(inner, seed);

const sky = (top: string, bottom: string, id = 'sky') =>
  page(
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
     <rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#${id})" filter="url(#paint)"/>`,
  );

const drift = (key: string, inner: string, dx: number, duration: number): Layer => ({
  key,
  svg: page(inner, key.length * 7),
  animate: { x: [0, dx, 0] },
  transition: loop(duration),
});

const bob = (key: string, inner: string, dy = 6, duration = 3): Layer => ({
  key,
  svg: page(inner, key.length * 5),
  animate: { y: [0, -dy, 0] },
  transition: loop(duration),
});

/**
 * Trees, bushes and grass moving in the wind (2026-09-23: 「木々が 少し
 * 動いてたりも いい」). The layer leans from its base line — the trunks stay
 * planted and the tops sway — so each row of trees is its own layer with the
 * row's base as the pivot.
 */
const sway = (key: string, inner: string, baseY: number, lean = 1.2, duration = 4.5): Layer => ({
  key,
  svg: page(inner, key.length * 3),
  origin: [200, baseY],
  animate: { skewX: [-lean, lean, -lean] },
  transition: loop(duration),
});

const overlay = (key: string, color: string, blend: Layer['blend'], opacity: number): Layer => ({
  key,
  svg: page(`<rect width="${PAGE_W}" height="${PAGE_H}" fill="${color}"/>`),
  blend,
  opacity,
  enter: { opacity },
  exit: { opacity: 0 },
});

const rainLayer = (key = 'rain'): Layer => ({
  key,
  svg: page(rain()),
  animate: { y: ['-12%', '0%'] },
  transition: loop(0.7, 'linear'),
  enter: { opacity: 1 },
  exit: { opacity: 0 },
});

const sparkleLayer = (key: string, seed: number, color?: string): Layer => ({
  key,
  svg: page(sparkles(seed, color)),
  animate: { opacity: [0.3, 1, 0.3], scale: [0.98, 1.02, 0.98] },
  transition: loop(2.2),
  enter: { opacity: 1 },
  exit: { opacity: 0 },
});

// ---------------------------------------------------------------------------
// 村 — the village (stages 1–2, and 0話)
// ---------------------------------------------------------------------------

const paddyLines = () => {
  const lines: string[] = [];
  for (let y = 392; y < 700; y += 16) {
    lines.push(`<path d="M-10 ${y} Q200 ${y - 8 - (y - 380) * 0.04} 410 ${y}" stroke="rgba(120,150,40,0.45)" stroke-width="2" fill="none"/>`);
  }
  return lines.join('');
};

const village: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#6ec0ee', '#d4f0fb') },
    { key: 'sun', svg: page(sun(318, 104, 30)), origin: [318, 104], animate: { rotate: [0, 360] }, transition: loop(90, 'linear') },
    drift('cloud1', cloud(92, 132, 0.95), 26, 18),
    drift('cloud2', cloud(256, 206, 0.62), -20, 22),
    bob('birds', birds(262, 168, 1.1), 8, 2.6),
    { key: 'far', svg: page(peaks(334, '#93b6cb', 11, 86)) },
    { key: 'hills', svg: page(hills(336, '#62ad4c', 5, 16)) },
    {
      key: 'field',
      svg: page(
        `<g filter="url(#torn)"><path d="M-20 720 L-20 378 Q200 358 420 376 L420 720 Z" fill="#b3cf55"/>${paddyLines()}
          <path d="M150 720 Q170 560 230 470 Q270 410 250 372 L262 372 Q290 420 250 480 Q200 570 200 720 Z" fill="#d9b574"/></g>`,
        9,
      ),
    },
    { key: 'houses', svg: page(house(78, 380, 0.95) + house(318, 372, 0.8) + house(205, 360, 0.5)) },
    bob('farmers', farmer(130, 452, 1.5, '#5b7fb5') + farmer(300, 430, 1.2, '#b0584a'), 2, 1.8),
    sway('village-trees', tree(28, 402, 1.25, '#4f9a3c') + tree(376, 396, 1.15, '#57a043'), 402, 1.6, 5),
    sway(
      'front',
      `<g filter="url(#torn)" fill="#3f8b3b"><circle cx="-10" cy="470" r="62"/><circle cx="46" cy="500" r="44"/><circle cx="410" cy="462" r="58"/><circle cx="360" cy="505" r="40"/></g>`,
      540,
      1.4,
      3.8,
    ),
  ],
  fx: {
    // 0話: the road is blocked by stones.
    stones: [
      {
        key: 'stones',
        svg: page(rock(160, 452, 34, 3) + rock(238, 446, 40, 8) + rock(200, 418, 30, 5, '#a09a93') + rock(118, 468, 22, 12, '#9a948e') + rock(284, 466, 24, 2, '#8a847f')),
        enter: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 30, transition: { duration: 0.6 } },
      },
    ],
    // 2話: the sickness. The village loses its colour.
    gloom: [
      overlay('gloom-tint', '#5b5a7a', 'multiply', 0.45),
      {
        key: 'gloom-clouds',
        svg: page(cloud(70, 90, 1.2, '#6f6f86') + cloud(250, 60, 1.4, '#5f5f77') + cloud(360, 140, 0.9, '#77778e')),
        animate: { x: [0, 14, 0] },
        transition: loop(10),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
    // 2話: the chief points beyond the mountain.
    farTree: [
      {
        key: 'farTree',
        svg: page(
          `<circle cx="340" cy="214" r="34" fill="#ffe27a" opacity="0.8" filter="url(#glow)"/>
           <g filter="url(#rough)"><path d="M326 340 L334 232 L346 232 L356 340 Z" fill="#5d3b22"/>
           <circle cx="340" cy="222" r="20" fill="#3d7d3a"/></g>
           <circle cx="340" cy="210" r="5" fill="#ffd54a"/>`,
        ),
        enter: { opacity: 1, transition: { duration: 1.2 } },
        exit: { opacity: 0 },
        animate: { scale: [1, 1.015, 1] },
        transition: loop(3),
      },
    ],
    // 0話: the crow that comes for the rice.
    crow: [
      {
        key: 'crow',
        svg: page(crow(262, 300, 1.25)),
        origin: [290, 305],
        enter: { opacity: 1, x: 0, transition: { duration: 0.9, ease: 'easeOut' } },
        exit: { opacity: 0, x: '40%', y: '-30%', transition: { duration: 0.9 } },
        animate: { y: [0, -10, 0], rotate: [-2, 2, -2] },
        transition: loop(1.2),
      },
    ],
    sparkle: [sparkleLayer('village-sparkle', 7)],
  },
};

// ---------------------------------------------------------------------------
// 山 — the mountain road and the river (stage 3)
// ---------------------------------------------------------------------------

const mountain: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#78bfe6', '#dff2f8') },
    drift('cloud1', cloud(80, 110, 0.8), 20, 20),
    drift('cloud2', cloud(300, 80, 0.7), -18, 24),
    { key: 'far', svg: page(peaks(300, '#9fb9cd', 4, 200, true)) },
    { key: 'mid', svg: page(peaks(352, '#6f9468', 17, 120)) },
    { key: 'hills', svg: page(hills(384, '#5c9b48', 23, 14)) },
    sway('pines', pine(40, 392, 1) + pine(78, 398, 0.8) + pine(350, 388, 1.1), 395, 1.4, 4.2),
    {
      key: 'river-back',
      svg: page(waves(410, '#8ccbee', 6, 8)),
      animate: { x: [0, -22, 0] },
      transition: loop(4),
    },
    {
      key: 'river',
      svg: page(waves(430, '#3f82c4', 31, 12)),
      animate: { x: [0, 22, 0] },
      transition: loop(3.2),
    },
  ],
  fx: {
    darkclouds: [
      {
        key: 'darkclouds',
        svg: page(cloud(60, 70, 1.3, '#5a6072') + cloud(230, 40, 1.5, '#4d5366') + cloud(350, 110, 1.1, '#666c7e')),
        enter: { opacity: 1, x: 0, transition: { duration: 1.4 } },
        exit: { opacity: 0 },
        animate: { x: [0, 16, 0] },
        transition: loop(9),
      },
      overlay('dim', '#4f5a78', 'multiply', 0.3),
    ],
    rain: [rainLayer()],
  },
};

// ---------------------------------------------------------------------------
// 道 — the hard road: the boar and the hornet (stage 4)
// ---------------------------------------------------------------------------

const grassTufts = () =>
  Array.from({ length: 14 }, (_, i) => {
    const x = 20 + i * 28 + (i % 3) * 5;
    const y = 420 + ((i * 37) % 60);
    return `<path d="M${x} ${y} l3 -14 l3 12 l3 -16 l3 18 Z" fill="#6f9e3a"/>`;
  }).join('');

const wildpath: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#8fcbe8', '#e8f3e6') },
    drift('cloud1', cloud(120, 120, 0.8), 18, 20),
    { key: 'far', svg: page(peaks(320, '#8ea9b8', 29, 110)) },
    { key: 'hills', svg: page(hills(338, '#4f8f3e', 41, 22) + hills(372, '#78ad4a', 44, 14)) },
    {
      key: 'ground',
      svg: page(`<g filter="url(#torn)"><path d="M-20 720 L-20 410 Q120 380 250 398 Q340 410 420 390 L420 720 Z" fill="#c9a263"/></g>`, 17),
    },
    sway('grass', `<g filter="url(#rough)">${grassTufts()}</g>`, 470, 4, 2.6),
  ],
  fx: {
    boar: [
      {
        key: 'boar',
        svg: page(boar(80, 430, 1.1)),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
        // Charges across the page, again and again.
        animate: { x: ['-60%', '110%'], y: [0, -4, 0, -4, 0] },
        transition: { x: { duration: 2.4, repeat: Infinity, ease: 'easeIn', repeatDelay: 0.8 }, y: loop(0.3) },
      },
    ],
    bee: [
      {
        key: 'bee',
        svg: page(bee(290, 190, 1.5)),
        origin: [300, 190],
        enter: { opacity: 1, scale: 1 },
        exit: { opacity: 0, x: '30%' },
        animate: { y: [0, -14, 4, 0], x: [0, 8, -6, 0], rotate: [-3, 2, -2, -3] },
        transition: loop(1.6),
      },
    ],
    hurt: [
      {
        key: 'hurt',
        svg: page(`<rect width="${PAGE_W}" height="${PAGE_H}" fill="#d94a3a"/>`),
        blend: 'multiply',
        opacity: 0.35,
        enter: { opacity: [0, 0.55, 0.2, 0.35] },
        exit: { opacity: 0 },
      },
    ],
    heal: [sparkleLayer('heal', 91, '#fff4b8')],
  },
};

// ---------------------------------------------------------------------------
// 光の入り口 — the portal (stage 5)
// ---------------------------------------------------------------------------

const portalRing = () =>
  `<radialGradient id="pg" cx="0.5" cy="0.5" r="0.5">
     <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#bff3ff"/>
     <stop offset="0.75" stop-color="#6fc8ff" stop-opacity="0.8"/><stop offset="1" stop-color="#6fc8ff" stop-opacity="0"/>
   </radialGradient>
   <circle cx="200" cy="270" r="120" fill="url(#pg)" filter="url(#glow)"/>
   <g filter="url(#torn)" fill="none" stroke-linecap="round">
     <ellipse cx="200" cy="270" rx="78" ry="110" stroke="#ffe27a" stroke-width="8" stroke-dasharray="60 24"/>
     <ellipse cx="200" cy="270" rx="58" ry="86" stroke="#9fe8ff" stroke-width="5" stroke-dasharray="30 18"/>
   </g>`;

const portal: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#3a4a7c', '#9a7fa6') },
    { key: 'stars', svg: page(sparkles(5, '#fff6d8', 30, { x: 0, y: 20, w: 400, h: 240 })), animate: { opacity: [0.5, 1, 0.5] }, transition: loop(3) },
    { key: 'trees-back', svg: page(hills(360, '#2e3b58', 51, 30)) },
    sway('pines-back', pine(40, 380, 1.6, '#26324c') + pine(360, 372, 1.8, '#26324c'), 378, 0.8, 7),
    { key: 'trees', svg: page(hills(420, '#34405e', 55, 18)) },
    sway('pines-front', pine(90, 440, 1.3, '#2b3651') + pine(320, 430, 1.4, '#2b3651'), 436, 1, 6),
  ],
  fx: {
    portal: [
      {
        key: 'portal',
        svg: page(portalRing()),
        origin: [200, 270],
        enter: { opacity: 1, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } },
        exit: { opacity: 0, scale: 0.3 },
        animate: { rotate: [0, 360] },
        transition: loop(16, 'linear'),
      },
      sparkleLayer('portal-sparkle', 23, '#dff8ff'),
    ],
    // Inside: white and still. Time itself seems to have stopped.
    inside: [
      overlay('inside-white', '#f4f1ff', undefined, 0.92),
      {
        key: 'inside-float',
        svg: page(sparkles(61, '#b9a8ff', 22, { x: 20, y: 40, w: 360, h: 460 }) + sparkles(62, '#9fe8ff', 16, { x: 20, y: 40, w: 360, h: 460 })),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
        animate: { y: [0, -6, 0] },
        transition: loop(8),
      },
    ],
    heal: [sparkleLayer('portal-heal', 93, '#fff4b8')],
  },
};

// ---------------------------------------------------------------------------
// 森 — days in the forest (stage 6)
// ---------------------------------------------------------------------------

const forestTrees = (y: number, s: number, leaf: string, seed: number) => {
  const xs = [10, 70, 130, 200, 270, 330, 390];
  return xs.map((x, i) => tree(x + ((seed * (i + 1)) % 19) - 9, y + ((i * seed) % 14), s, leaf)).join('');
};

const forest: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#8ccbe8', '#eaf6e0') },
    drift('cloud1', cloud(100, 90, 0.7), 16, 18),
    { key: 'back', svg: page(hills(330, '#3f7a3c', 61, 20)) },
    sway('back-trees', forestTrees(348, 1.1, '#3c7a38', 7), 356, 1, 5.5),
    { key: 'front', svg: page(hills(400, '#6aa142', 63, 12)) },
    sway('front-trees', forestTrees(420, 1.45, '#57a043', 11), 430, 1.5, 4.4),
    {
      key: 'path',
      svg: page(`<path d="M150 720 Q180 560 205 430 L220 430 Q230 560 280 720 Z" fill="#d7b371" filter="url(#torn)"/>`),
    },
    {
      key: 'rays',
      svg: page(`<g fill="#fff6c9" opacity="0.35"><path d="M120 0 L170 0 L260 460 L220 460 Z"/><path d="M230 0 L260 0 L330 440 L300 440 Z"/></g>`),
      animate: { opacity: [0.5, 1, 0.5] },
      transition: loop(5),
      blend: 'screen',
    },
  ],
  fx: {
    morning: [
      {
        key: 'sun-east',
        svg: page(sun(70, 130, 24, '#ffd05a', '#ffb347')),
        enter: { opacity: 1, y: 0, transition: { duration: 1.4 } },
        exit: { opacity: 0, y: 30 },
      },
    ],
    evening: [
      overlay('evening-tint', '#ff9a5a', 'multiply', 0.28),
      {
        key: 'sun-west',
        svg: page(sun(332, 170, 26, '#ff9a4a', '#f07a3a')),
        enter: { opacity: 1, y: 0, transition: { duration: 1.4 } },
        exit: { opacity: 0 },
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// 大木 — the tree with no branches (stages 7, 8, 10)
// ---------------------------------------------------------------------------

const trunk = () =>
  `<g filter="url(#torn)">
     <path d="M104 720 Q150 600 162 420 Q172 200 180 -10 L226 -10 Q232 200 242 420 Q256 600 300 720 Z" fill="#7a4a26"/>
     <g stroke="#5d3519" stroke-width="3" fill="none" opacity="0.7">
       <path d="M182 40 Q176 200 168 420"/><path d="M210 20 Q214 220 222 430"/><path d="M196 120 Q192 300 196 480"/>
     </g>
   </g>`;

const greattree: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#8cc3e2', '#e2f1f4') },
    { key: 'forest', svg: page(hills(420, '#4b8a3f', 71, 16)) },
    sway('forest-trees', forestTrees(440, 0.9, '#3f7d38', 3), 448, 1.3, 5),
    { key: 'trunk', svg: page(trunk(), 19) },
    {
      key: 'cloudband',
      svg: page(cloud(70, 50, 1.4, '#f4f7fb') + cloud(220, 30, 1.6, '#eef3f9') + cloud(350, 70, 1.2, '#f4f7fb') + cloud(150, 110, 0.9, '#ffffff')),
      animate: { x: [0, 12, 0] },
      transition: loop(12),
    },
  ],
  fx: {
    dusk: [
      overlay('dusk-tint', '#ff8f5a', 'multiply', 0.32),
      {
        key: 'dusk-sun',
        svg: page(sun(340, 330, 22, '#ff8c42', '#f06a3a')),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
    // 8話: remembering Hana's classroom. Sepia, and a little school.
    memory: [
      overlay('memory-sepia', '#c79a5a', 'multiply', 0.5),
      {
        key: 'memory-school',
        svg: page(`<rect x="70" y="120" width="260" height="190" rx="24" fill="#f5e6c4" filter="url(#torn)"/>${house(200, 290, 1.9)}`),
        enter: { opacity: 1, scale: 1, transition: { duration: 0.8 } },
        exit: { opacity: 0, scale: 0.95 },
        animate: { y: [0, -3, 0] },
        transition: loop(4),
      },
    ],
    // 8話: the carved footholds, glowing where Nexmax cut them.
    carve: [
      {
        key: 'carve',
        svg: page(
          `<g fill="#ffe27a" filter="url(#torn)">${[430, 380, 330, 280, 230, 180, 130]
            .map((y, i) => `<rect x="${186 + (i % 2) * 16}" y="${y}" width="20" height="8" rx="3"/>`)
            .join('')}</g>`,
        ),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
        animate: { opacity: [0.7, 1, 0.7] },
        transition: loop(1.8),
      },
    ],
    rain: [rainLayer('tree-rain'), overlay('tree-dim', '#56627e', 'multiply', 0.3)],
    // 9話: inside the cloud — white, no up or down.
    fog: [overlay('fog', '#f3f6fa', undefined, 0.85)],
  },
};

// ---------------------------------------------------------------------------
// 雲の上 — above the clouds (stage 9)
// ---------------------------------------------------------------------------

const cloudsea: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#8fc6ee', '#ffe0b0') },
    { key: 'sun', svg: page(sun(300, 250, 34, '#ffcf5a', '#ffb347')), origin: [300, 250], animate: { rotate: [0, 360] }, transition: loop(80, 'linear') },
    {
      key: 'sea1',
      svg: page(waves(360, '#fbfbff', 3, 16)),
      animate: { x: [0, -16, 0] },
      transition: loop(9),
    },
    {
      key: 'village-far',
      svg: page(`<g filter="url(#rough)"><ellipse cx="96" cy="452" rx="62" ry="20" fill="#fbfbff"/><ellipse cx="96" cy="454" rx="52" ry="14" fill="#7fb24a"/></g>${house(80, 452, 0.22)}${house(104, 448, 0.2)}${house(120, 454, 0.18)}`),
    },
    {
      key: 'trunk-top',
      svg: page(`<path d="M176 720 Q182 560 188 420 L214 420 Q220 560 228 720 Z" fill="#7a4a26" filter="url(#torn)"/>`),
    },
    bob('birds', birds(60, 180, 1) + birds(300, 130, 0.8), 6, 3),
  ],
  fx: {},
};

// ---------------------------------------------------------------------------
// てっぺん — the top of the tree and the golden leaf (stage 10)
// ---------------------------------------------------------------------------

const treetop: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#5fb4ea', '#d8f0fb') },
    { key: 'sea', svg: page(waves(470, '#fbfbff', 5, 14) + waves(500, '#ecebf8', 8, 10)) },
    {
      key: 'top',
      svg: page(
        `<g filter="url(#torn)">
           <path d="M170 720 Q176 520 186 330 Q190 290 200 270 Q210 290 214 330 Q224 520 232 720 Z" fill="#7a4a26"/>
           <path d="M200 300 Q150 250 118 262 Q150 280 196 316 Z M204 300 Q256 240 290 250 Q256 272 208 318 Z" fill="#6a3f20"/>
         </g>`,
        27,
      ),
    },
  ],
  fx: {
    leaf: [
      {
        key: 'leaf-glow',
        svg: page(`<circle cx="200" cy="236" r="46" fill="#ffe27a" filter="url(#glow)" opacity="0.9"/>`),
        origin: [200, 236],
        animate: { scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] },
        transition: loop(2.2),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
      {
        key: 'leaf',
        svg: page(
          `<g filter="url(#torn)"><path d="M200 272 Q160 236 190 196 Q200 186 206 196 Q238 236 200 272 Z" fill="#f2c43a"/>
             <path d="M200 268 L198 200" stroke="#c9901e" stroke-width="3" fill="none"/></g>`,
        ),
        origin: [200, 270],
        animate: { rotate: [-4, 4, -4] },
        transition: loop(2.6),
        enter: { opacity: 1 },
        exit: { opacity: 0, y: '30%', scale: 0.4, transition: { duration: 0.9 } },
      },
      sparkleLayer('leaf-sparkle', 71, '#fff1a8'),
    ],
  },
};

// ---------------------------------------------------------------------------
// 野原 — a quiet meadow, behind the screens that are not story (書く・そうび)
// ---------------------------------------------------------------------------

const flowers = () =>
  Array.from({ length: 16 }, (_, i) => {
    const x = 14 + ((i * 53) % 380);
    const y = 470 + ((i * 37) % 200);
    const c = ['#ffd24a', '#ffffff', '#ff9ab0'][i % 3];
    return `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><circle cx="${x}" cy="${y}" r="2" fill="#f08a24"/>`;
  }).join('');

const meadow: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#5fb4ea', '#d7f1fb') },
    drift('cloud1', cloud(80, 110, 1), 30, 22),
    drift('cloud2', cloud(300, 170, 0.7), -24, 26),
    drift('cloud3', cloud(190, 60, 0.55), 18, 30),
    bob('birds', birds(250, 140, 1), 8, 2.8),
    { key: 'far', svg: page(peaks(360, '#9fb9cd', 13, 140, true)) },
    { key: 'hills', svg: page(hills(400, '#62ad4c', 7, 18) + hills(450, '#78b94f', 9, 12)) },
    sway('meadow-trees', tree(40, 440, 1.3, '#4f9a3c') + tree(362, 448, 1.4, '#57a043') + tree(300, 420, 0.8, '#3f8b3b'), 445, 1.6, 4.8),
    sway('meadow-grass', `<g filter="url(#rough)">${grassTufts().replace(/fill="#6f9e3a"/g, 'fill="#4f8f3a"')}</g>${flowers()}`, 600, 3, 3.2),
  ],
  fx: {
    // かな編 1話: the fork — a red gate going down, blue stone steps going up.
    fork: [
      {
        key: 'meadow-fork',
        svg: page(
          `<g filter="url(#torn)">
             <rect x="30" y="412" width="9" height="62" fill="#c4372c"/><rect x="92" y="412" width="9" height="62" fill="#c4372c"/>
             <rect x="18" y="400" width="96" height="11" rx="3" fill="#d8453a"/><rect x="26" y="420" width="80" height="7" fill="#c4372c"/>
           </g>
           <g filter="url(#torn)" fill="#3f86d6" stroke="#2a5f9e" stroke-width="2">
             ${Array.from({ length: 6 }, (_, i) => `<rect x="${296 + i * 11}" y="${470 - i * 24}" width="${62 - i * 6}" height="13" rx="2"/>`).join('')}
           </g>`,
          77,
        ),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
  },
};

export const SCENES: Record<string, SceneDef> = {
  ...GENDAI_SCENES,
  mukashi_meadow: meadow,
  mukashi_village: village,
  mukashi_mountain: mountain,
  mukashi_wildpath: wildpath,
  mukashi_portal: portal,
  mukashi_forest: forest,
  mukashi_greattree: greattree,
  mukashi_cloudsea: cloudsea,
  mukashi_treetop: treetop,
};

/** Every fx name a scene understands — the script test checks against this. */
export const fxNamesOf = (scene: string): string[] => Object.keys(SCENES[scene]?.fx ?? {});
