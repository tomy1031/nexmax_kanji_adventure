import type { Transition } from 'framer-motion';
import { PAGE_H, PAGE_W, birds, cloud, hills, peaks, pine, sparkles, sun, svgDoc, tree, waves } from './paper';
import type { Layer, SceneDef } from './scenes';

/**
 * 現代編 の 絵本 — the same torn paper, a modern Japan.
 *
 * The original manga #1–#5, scene by scene: the entrance ceremony hall, the
 * long bus ride towards Mt Fuji, the training centre alone in the sea of
 * trees, the dining hall where the seniors wait, the tatami room where the
 * team finally talks (#1); the lake at dawn (#2); the city street and the
 * interview room of a year before (#2–#3); the sports ground (#4–#5).
 *
 * The dining hall carries the fear (2026-09-23: 暴力は 直接 描かない。怖い
 * 雰囲気は そのまま). Nobody is struck. The fear is in the room: the clock
 * hand, the dark shapes at the back with no faces, the light that dims, the
 * shout that shakes the page.
 */

const loop = (duration: number, ease: Transition['ease'] = 'easeInOut'): Transition => ({
  duration,
  repeat: Infinity,
  ease,
});

const page = (inner: string, seed?: number) => svgDoc(inner, seed);

const sky = (top: string, bottom: string, id = 'gsky') =>
  page(
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
     <rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#${id})" filter="url(#paint)"/>`,
  );

const wall = (color: string, floor: string, floorY = 430) =>
  page(
    `<rect width="${PAGE_W}" height="${PAGE_H}" fill="${color}" filter="url(#paint)"/>
     <rect y="${floorY}" width="${PAGE_W}" height="${PAGE_H - floorY}" fill="${floor}" filter="url(#paint)"/>`,
  );

const overlay = (key: string, color: string, blend: Layer['blend'], opacity: number): Layer => ({
  key,
  svg: page(`<rect width="${PAGE_W}" height="${PAGE_H}" fill="${color}"/>`),
  blend,
  opacity,
  enter: { opacity },
  exit: { opacity: 0 },
});

/** Rows of chairs seen from behind, for the ceremony hall. */
const chairs = (y: number, s: number, color: string) =>
  `<g filter="url(#torn)" fill="${color}">${Array.from({ length: 9 }, (_, i) => {
    const x = -10 + i * 48 * s;
    return `<rect x="${x}" y="${y}" width="${36 * s}" height="${30 * s}" rx="${6 * s}"/><rect x="${x + 4 * s}" y="${y + 30 * s}" width="${4 * s}" height="${18 * s}"/><rect x="${x + 28 * s}" y="${y + 30 * s}" width="${4 * s}" height="${18 * s}"/>`;
  }).join('')}</g>`;

/** A wall clock; its hand is a layer of its own so it can turn. */
const clockFace = (cx: number, cy: number, r: number) =>
  `<g filter="url(#torn)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#f4efe2"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3a2f2a" stroke-width="5"/></g>
   ${Array.from({ length: 12 }, (_, i) => {
     const a = (i / 12) * Math.PI * 2;
     return `<rect x="${cx + Math.cos(a) * r * 0.78 - 2}" y="${cy + Math.sin(a) * r * 0.78 - 2}" width="4" height="4" fill="#3a2f2a"/>`;
   }).join('')}
   <rect x="${cx - 2}" y="${cy - r * 0.45}" width="4" height="${r * 0.45}" fill="#3a2f2a"/>`;

const clockHand = (cx: number, cy: number, r: number) =>
  `<rect x="${cx - 1.5}" y="${cy - r * 0.75}" width="3" height="${r * 0.75}" fill="#b0241c"/><circle cx="${cx}" cy="${cy}" r="4" fill="#3a2f2a"/>`;

/** Faceless dark shapes — the seniors, never drawn as people with faces. */
const shadows = (y: number) =>
  `<g filter="url(#rough)" fill="#1d1a26">${[70, 150, 250, 330]
    .map((x, i) => `<ellipse cx="${x}" cy="${y - 64 - (i % 2) * 6}" rx="20" ry="24"/><path d="M${x - 34} ${y} Q${x - 30} ${y - 50} ${x} ${y - 46} Q${x + 30} ${y - 50} ${x + 34} ${y} Z"/>`)
    .join('')}</g>`;

/** A shout: the page shakes and jagged lines burst out. No one is hit. */
const shoutLayer: Layer = {
  key: 'shout',
  svg: page(
    `<g stroke="#fff4c9" stroke-width="7" stroke-linecap="round" fill="none">${Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return `<path d="M${200 + Math.cos(a) * 90} ${300 + Math.sin(a) * 70} L${200 + Math.cos(a) * 170} ${300 + Math.sin(a) * 130}"/>`;
    }).join('')}</g>`,
  ),
  animate: { x: [0, -8, 8, -5, 5, 0], scale: [1, 1.05, 1] },
  transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1.2 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

/** A memory: the page goes sepia, the edges darken like an old photo. */
const memoryLayers: Layer[] = [
  overlay('memory-sepia', '#b08a58', 'multiply', 0.35),
  {
    key: 'memory-edge',
    svg: page(
      `<radialGradient id="mem" cx="0.5" cy="0.45" r="0.75"><stop offset="0.6" stop-color="#3a2a1a" stop-opacity="0"/><stop offset="1" stop-color="#3a2a1a" stop-opacity="0.6"/></radialGradient>
       <rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#mem)"/>`,
    ),
    enter: { opacity: 1 },
    exit: { opacity: 0 },
  },
];

/** Cherry petals drifting down. */
const petalLayer = (seed: number): Layer => ({
  key: `petals-${seed}`,
  svg: page(sparkles(seed, '#ffc3d6', 34, { x: 0, y: 40, w: 400, h: 560 })),
  animate: { y: ['-3%', '5%'], x: ['0%', '-3%'], opacity: [0.9, 1, 0.9] },
  transition: loop(5),
  enter: { opacity: 1 },
  exit: { opacity: 0 },
});

/** Pink cherry trees, for spring. */
const sakura = (x: number, y: number, s: number) => tree(x, y, s, '#f7b8cc', '#6b4a3a');

// ---------------------------------------------------------------------------
// 入社式 — the ceremony hall (stage 1)
// ---------------------------------------------------------------------------

const hall: SceneDef = {
  layers: [
    { key: 'wall', svg: wall('#e9e1cf', '#b99b72', 440) },
    {
      key: 'stage',
      svg: page(
        `<g filter="url(#torn)"><rect x="40" y="170" width="320" height="170" fill="#7a2e2e"/><rect x="60" y="120" width="280" height="60" rx="6" fill="#f4efe2"/>
           <rect x="30" y="330" width="340" height="30" fill="#8a5a36"/></g>
         <g fill="#c9a263" filter="url(#rough)"><rect x="80" y="140" width="240" height="20" rx="4"/></g>
         <g filter="url(#torn)" fill="#f2c43a"><circle cx="70" cy="110" r="10"/><circle cx="330" cy="110" r="10"/></g>`,
        21,
      ),
    },
    {
      key: 'lights',
      svg: page(`<g fill="#fff6c9" opacity="0.35"><path d="M90 0 L130 0 L200 340 L160 340 Z"/><path d="M270 0 L310 0 L240 340 L200 340 Z"/></g>`),
      blend: 'screen',
      animate: { opacity: [0.6, 1, 0.6] },
      transition: loop(4),
    },
    { key: 'chairs-back', svg: page(chairs(380, 0.9, '#4a3a5a'), 5) },
    { key: 'chairs-front', svg: page(chairs(430, 1.1, '#3a2e4a'), 9) },
  ],
  fx: {
    cheer: [
      {
        key: 'confetti',
        svg: page(sparkles(17, '#ffd24a', 30) + sparkles(18, '#8fe3ff', 20)),
        animate: { y: ['-4%', '4%'], opacity: [1, 0.6, 1] },
        transition: loop(3),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// バス — the long ride towards Mt Fuji (stage 2)
// ---------------------------------------------------------------------------

const bus: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#8cc8ee', '#e6f3f5', 'bsky') },
    { key: 'fuji', svg: page(peaks(330, '#7f9ec0', 3, 230, true)) },
    {
      key: 'passing',
      svg: page(hills(340, '#6aa142', 13, 14) + pine(20, 350, 0.8) + pine(120, 356, 0.7) + pine(250, 352, 0.9) + pine(380, 348, 0.8)),
      animate: { x: ['0%', '-30%'] },
      transition: loop(6, 'linear'),
    },
    {
      key: 'bus',
      svg: page(
        `<g filter="url(#torn)" fill="#d9d2c2">
           <path d="M0 0 H400 V120 H0 Z"/><path d="M0 390 H400 V720 H0 Z"/>
           <rect x="0" y="120" width="26" height="270"/><rect x="186" y="120" width="28" height="270"/><rect x="374" y="120" width="26" height="270"/>
         </g>
         <g filter="url(#torn)" fill="#3d5f8a">
           <rect x="-10" y="430" width="180" height="120" rx="18"/><rect x="230" y="430" width="180" height="120" rx="18"/>
           <rect x="-10" y="380" width="180" height="60" rx="14"/><rect x="230" y="380" width="180" height="60" rx="14"/>
         </g>`,
        11,
      ),
      animate: { y: [0, -2, 0, 1, 0] },
      transition: loop(0.9),
    },
  ],
  fx: {
    dusk: [overlay('bus-dusk', '#ff9a5a', 'multiply', 0.3)],
  },
};

// ---------------------------------------------------------------------------
// 樹海の 研修所 — the training centre, alone in the sea of trees (stage 3)
// ---------------------------------------------------------------------------

const denseTrees = (y: number, color: string, seed: number) =>
  Array.from({ length: 11 }, (_, i) => pine(-10 + i * 42 + (seed * i) % 13, y + ((i * seed) % 10), 1.3 + ((i * 7) % 3) * 0.15, color)).join('');

const forest: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#51607e', '#b5a8b8', 'fsky') },
    { key: 'far-trees', svg: page(hills(300, '#2c3f35', 31, 18) + denseTrees(310, '#23372d', 3)) },
    {
      key: 'centre',
      svg: page(
        `<g filter="url(#torn)"><rect x="110" y="250" width="180" height="110" fill="#8d8478"/><path d="M96 256 L200 206 L304 256 Z" fill="#5a4f47"/></g>
         <g fill="#ffd97a">${[130, 170, 220, 260].map((x) => `<rect x="${x}" y="280" width="18" height="20"/>`).join('')}${[130, 170, 220, 260].map((x) => `<rect x="${x}" y="318" width="18" height="20"/>`).join('')}</g>`,
        15,
      ),
    },
    {
      key: 'near-trees',
      svg: page(hills(380, '#243a2e', 37, 20) + denseTrees(400, '#1d3026', 7)),
      origin: [200, 420],
      animate: { skewX: [-1, 1, -1] },
      transition: loop(5.5),
    },
    {
      key: 'fog',
      svg: page(cloud(60, 360, 1.6, '#dfe3ea') + cloud(300, 380, 1.4, '#e6e8ee')),
      opacity: 0.55,
      animate: { x: [0, 30, 0] },
      transition: loop(12),
    },
  ],
  fx: {
    gloom: [overlay('forest-gloom', '#3a3550', 'multiply', 0.35)],
  },
};

// ---------------------------------------------------------------------------
// 食堂 — the dining hall where the seniors wait (stages 4–5)
// ---------------------------------------------------------------------------

const dining: SceneDef = {
  layers: [
    { key: 'wall', svg: wall('#bfb6a3', '#8a7a64', 420) },
    { key: 'clock', svg: page(clockFace(200, 120, 44), 23) },
    {
      key: 'hand',
      svg: page(clockHand(200, 120, 44)),
      origin: [200, 120],
      // The second hand ticks — a jump, then stillness.
      animate: { rotate: [0, 6, 6, 12, 12, 18, 18, 24] },
      transition: { duration: 4, repeat: Infinity, ease: 'linear', times: [0, 0.02, 0.25, 0.27, 0.5, 0.52, 0.75, 1] },
    },
    {
      key: 'tables',
      svg: page(
        `<g filter="url(#torn)" fill="#6b4f36"><rect x="-10" y="440" width="170" height="40"/><rect x="240" y="440" width="170" height="40"/>
           <rect x="10" y="480" width="10" height="60"/><rect x="130" y="480" width="10" height="60"/><rect x="260" y="480" width="10" height="60"/><rect x="380" y="480" width="10" height="60"/></g>`,
        27,
      ),
    },
  ],
  fx: {
    // The seniors at the back: dark, faceless, still.
    seniors: [
      {
        key: 'seniors',
        svg: page(shadows(410)),
        enter: { opacity: 1, transition: { duration: 1.2 } },
        exit: { opacity: 0 },
      },
    ],
    tension: [
      overlay('tension-dim', '#1d1a2e', 'multiply', 0.45),
      {
        key: 'tension-vignette',
        svg: page(
          `<radialGradient id="vg" cx="0.5" cy="0.4" r="0.7"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>
           <rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#vg)"/>`,
        ),
        animate: { opacity: [0.7, 1, 0.7] },
        transition: loop(2.4),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
    // A shout: the page shakes and jagged lines burst out. No one is hit.
    shout: [shoutLayer],
  },
};

// ---------------------------------------------------------------------------
// たたみの 部屋 — the team's room (stage 6)
// ---------------------------------------------------------------------------

const room: SceneDef = {
  layers: [
    { key: 'wall', svg: wall('#e7d7b3', '#c9b57a', 400) },
    {
      key: 'tatami',
      svg: page(
        `<g stroke="#9c8a55" stroke-width="3" fill="none">${[440, 500, 580, 680].map((y) => `<path d="M-10 ${y} H410"/>`).join('')}<path d="M200 400 V720"/></g>`,
      ),
    },
    {
      key: 'window',
      svg: page(
        `<g filter="url(#torn)"><rect x="220" y="110" width="150" height="190" fill="#2d3a66"/>
           <g fill="#fff6d8"><circle cx="330" cy="150" r="14"/></g>
           <g stroke="#6b4f36" stroke-width="8" fill="none"><rect x="220" y="110" width="150" height="190"/><path d="M295 110 V300 M220 205 H370"/></g></g>`,
        31,
      ),
    },
    {
      key: 'lamp',
      svg: page(`<circle cx="90" cy="150" r="70" fill="#ffd97a" filter="url(#glow)" opacity="0.55"/><g filter="url(#torn)"><rect x="70" y="120" width="40" height="56" rx="10" fill="#fff1c4"/></g>`),
      origin: [90, 150],
      animate: { opacity: [0.85, 1, 0.85] },
      transition: loop(3),
    },
    {
      key: 'futon',
      svg: page(`<g filter="url(#torn)"><rect x="20" y="470" width="170" height="90" rx="10" fill="#e8eef6"/><rect x="210" y="480" width="170" height="90" rx="10" fill="#f2e6ef"/></g>`, 37),
    },
  ],
  fx: {
    warm: [
      overlay('warm', '#ffb870', 'soft-light', 0.5),
      {
        key: 'warm-sparkle',
        svg: page(sparkles(81, '#fff1a8', 14)),
        animate: { opacity: [0.3, 0.9, 0.3] },
        transition: loop(3),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
  },
};


// ---------------------------------------------------------------------------
// 湖 — the lake at dawn, where each one shouts his resolve (stage 7)
// ---------------------------------------------------------------------------

const lake: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#f6c89a', '#fbe9d2', 'lsky') },
    { key: 'sun', svg: page(sun(90, 170, 30, '#ffb35a', '#ffcf8a')), animate: { y: [4, 0, 4] }, transition: loop(8) },
    { key: 'fuji', svg: page(peaks(300, '#6f86b0', 3, 210, true)) },
    { key: 'birds', svg: page(birds(80, 150, 1, '#6a5a70')), animate: { x: [0, 40, 0] }, transition: loop(14) },
    { key: 'far-trees', svg: page(hills(318, '#3f6b4a', 41, 10)) },
    { key: 'water', svg: page(waves(340, '#7fb2cf', 43, 6)), animate: { x: [0, -10, 0] }, transition: loop(6) },
    {
      key: 'glint',
      svg: page(sparkles(47, '#fff6c9', 18, { x: 180, y: 360, w: 200, h: 120 })),
      animate: { opacity: [0.3, 0.9, 0.3] },
      transition: loop(2.6),
    },
    {
      key: 'shore',
      svg: page(hills(560, '#5b7a3a', 49, 12) + pine(30, 580, 1.1, '#2c5a34') + pine(370, 590, 1.2, '#2c5a34')),
      origin: [200, 600],
      animate: { skewX: [-0.8, 0.8, -0.8] },
      transition: loop(5),
    },
  ],
  fx: {
    shout: [shoutLayer],
    gloom: [overlay('lake-gloom', '#3a3550', 'multiply', 0.4)],
  },
};

// ---------------------------------------------------------------------------
// 町 — a city street: the job hunt a year before, and spring (stages 8–9)
// ---------------------------------------------------------------------------

const buildings = (seed: number) =>
  `<g filter="url(#torn)">${[
    [0, 160, 90, '#c9c2b4'],
    [80, 110, 80, '#b5aea2'],
    [150, 190, 110, '#d8d1c2'],
    [250, 130, 70, '#a9a397'],
    [310, 170, 100, '#cfc8ba'],
  ]
    .map(([x, y, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${460 - (y as number)}" fill="${c}"/>`)
    .join('')}</g>
   <g fill="#8fb4d4">${Array.from({ length: 30 }, (_, i) => {
     const x = 10 + (i % 10) * 38 + ((i * seed) % 7);
     const y = 210 + Math.floor(i / 10) * 60;
     return `<rect x="${x}" y="${y}" width="14" height="20"/>`;
   }).join('')}</g>`;

const city: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#a9d6f2', '#eef6f8', 'csky') },
    { key: 'clouds', svg: page(cloud(90, 110, 1.1) + cloud(300, 80, 0.9)), animate: { x: [0, 20, 0] }, transition: loop(16) },
    { key: 'buildings', svg: page(buildings(5), 51) },
    { key: 'street', svg: page(`<rect y="460" width="${PAGE_W}" height="${PAGE_H - 460}" fill="#9a9488" filter="url(#paint)"/><g fill="#f4efe2"><rect x="30" y="560" width="60" height="8"/><rect x="170" y="560" width="60" height="8"/><rect x="310" y="560" width="60" height="8"/></g>`) },
    {
      key: 'trees',
      svg: page(tree(40, 470, 1.1, '#5f9a48') + tree(360, 476, 1.2, '#5f9a48')),
      origin: [200, 470],
      animate: { skewX: [-1, 1, -1] },
      transition: loop(5),
    },
  ],
  fx: {
    memory: memoryLayers,
    // Spring: the trees turn pink and petals fall.
    spring: [
      { key: 'sakura', svg: page(sakura(40, 470, 1.1) + sakura(360, 476, 1.2) + sakura(200, 480, 0.9)), enter: { opacity: 1 }, exit: { opacity: 0 } },
      petalLayer(53),
    ],
  },
};

// ---------------------------------------------------------------------------
// 面接の 部屋 — the interview room (stages 8–9)
// ---------------------------------------------------------------------------

const office: SceneDef = {
  layers: [
    { key: 'wall', svg: wall('#e4e0d6', '#a79a86', 450) },
    {
      key: 'window',
      svg: page(
        `<g filter="url(#torn)"><rect x="60" y="90" width="280" height="200" fill="#bfe0f2"/>
           <g fill="#9fb4c4">${[70, 120, 180, 230, 290].map((x, i) => `<rect x="${x}" y="${170 + (i % 2) * 30}" width="40" height="${120 - (i % 2) * 30}"/>`).join('')}</g>
           <g stroke="#7a6a58" stroke-width="8" fill="none"><rect x="60" y="90" width="280" height="200"/><path d="M200 90 V290"/></g></g>`,
        57,
      ),
    },
    { key: 'clouds', svg: page(cloud(130, 130, 0.6) + cloud(270, 120, 0.5)), animate: { x: [0, 14, 0] }, transition: loop(12) },
    {
      key: 'desk',
      svg: page(
        `<g filter="url(#torn)"><rect x="30" y="420" width="340" height="40" fill="#6b4f36"/><rect x="50" y="460" width="14" height="90" fill="#5a4230"/><rect x="336" y="460" width="14" height="90" fill="#5a4230"/>
           <rect x="120" y="404" width="70" height="18" fill="#f4efe2"/><rect x="210" y="406" width="60" height="16" fill="#f4efe2"/></g>`,
        59,
      ),
    },
    { key: 'plant', svg: page(tree(360, 440, 0.6, '#5f9a48', '#8a6a4a')), origin: [360, 440], animate: { skewX: [-1, 1, -1] }, transition: loop(4) },
  ],
  fx: {
    memory: memoryLayers,
    tension: [overlay('office-tension', '#1d1a2e', 'multiply', 0.35)],
    warm: [overlay('office-warm', '#ffb870', 'soft-light', 0.5), petalLayer(61)],
  },
};

// ---------------------------------------------------------------------------
// グラウンド — the sports ground: the shuttle run (stage 10)
// ---------------------------------------------------------------------------

const ground: SceneDef = {
  layers: [
    { key: 'sky', svg: sky('#9fcbe8', '#e8f2f0', 'gsky2') },
    { key: 'fuji', svg: page(peaks(280, '#7f9ec0', 7, 190, true)) },
    { key: 'far-trees', svg: page(hills(300, '#35593f', 63, 14) + pine(40, 310, 0.8, '#2b4d34') + pine(360, 306, 0.9, '#2b4d34')) },
    {
      key: 'field',
      svg: page(
        `<rect y="320" width="${PAGE_W}" height="${PAGE_H - 320}" fill="#c9a877" filter="url(#paint)"/>
         <g stroke="#fbf8ef" stroke-width="6" stroke-linecap="round"><path d="M-10 380 L410 360"/><path d="M-10 640 L410 610"/></g>
         <g fill="#fbf8ef" font-family="sans-serif" font-weight="900" font-size="26"><text x="170" y="520">25m</text></g>
         <g stroke="#fbf8ef" stroke-width="3" stroke-dasharray="10 12"><path d="M200 372 L200 626"/></g>`,
        65,
      ),
    },
    { key: 'dust', svg: page(cloud(90, 600, 0.5, '#e8d7b8') + cloud(300, 640, 0.6, '#e8d7b8')), opacity: 0.7, animate: { x: [0, -24, 0], opacity: [0.4, 0.8, 0.4] }, transition: loop(2.2) },
  ],
  fx: {
    shout: [shoutLayer],
    tension: [overlay('ground-tension', '#1d1a2e', 'multiply', 0.3)],
    // Running: speed lines cross the page.
    run: [
      {
        key: 'run-lines',
        svg: page(`<g stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.8">${Array.from({ length: 12 }, (_, i) => `<path d="M${(i * 67) % 400} ${120 + i * 45} l-90 0"/>`).join('')}</g>`),
        animate: { x: ['10%', '-20%'] },
        transition: loop(0.6, 'linear'),
        enter: { opacity: 1 },
        exit: { opacity: 0 },
      },
    ],
    // The idea: the page brightens.
    idea: [overlay('ground-idea', '#fff1a8', 'soft-light', 0.6), { key: 'idea-sparkle', svg: page(sparkles(67, '#fff1a8', 20)), animate: { opacity: [0.3, 1, 0.3] }, transition: loop(1.6), enter: { opacity: 1 }, exit: { opacity: 0 } }],
  },
};

export const GENDAI_SCENES: Record<string, SceneDef> = {
  gendai_hall: hall,
  gendai_bus: bus,
  gendai_forest: forest,
  gendai_dining: dining,
  gendai_room: room,
  gendai_lake: lake,
  gendai_city: city,
  gendai_office: office,
  gendai_ground: ground,
};
