/**
 * 切り絵の 紙 — the picture book's paper.
 *
 * Every scene is built from layers of "torn paper": flat shapes whose edges
 * are roughened, with a thin white rim where the paper was torn, a soft
 * shadow under it, and a grain on the surface. That is the look of the
 * reference clip (a paper boat on torn-paper waves) and it sits well next to
 * the original picture book's soft painted colours.
 *
 * Performance is the reason for the shape of this module. SVG filters are
 * expensive to re-run every frame, and the learners are on inexpensive
 * Android phones. So each layer is a *complete, static SVG document*, handed
 * to an <img> as a data URL. The browser rasterises it once; the animation
 * then only moves the finished bitmap (transform / opacity), which the
 * compositor does for free.
 *
 * All layers share one coordinate space — a 400 × 720 portrait page — so
 * stacking them with the same object-fit keeps them aligned at any screen
 * size.
 */

export const PAGE_W = 400;
export const PAGE_H = 720;

/**
 * Filters every layer can use.
 *
 *   torn   — rough edge, white torn rim, drop shadow, grain. The default.
 *   rough  — rough edge and grain, no rim. For far-away things.
 *   paint  — brush streaks and grain across the whole shape. For skies.
 *   glow   — soft light, for magic and the sun's halo.
 */
const defs = (seed: number) => `
<defs>
  <filter id="torn" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feMorphology in="d" operator="dilate" radius="2.2" result="fat"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="2" seed="${seed + 7}" result="n2"/>
    <feDisplacementMap in="fat" in2="n2" scale="4" xChannelSelector="R" yChannelSelector="G" result="fat2"/>
    <feFlood flood-color="#fffaf0" result="white"/>
    <feComposite in="white" in2="fat2" operator="in" result="rim"/>
    <feGaussianBlur in="fat2" stdDeviation="2.4" result="sb"/>
    <feOffset in="sb" dx="1.5" dy="3" result="so"/>
    <feFlood flood-color="#2d1d08" flood-opacity="0.3"/>
    <feComposite in2="so" operator="in" result="shadow"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed + 3}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0.9 0 0 0 -0.38" result="ga"/>
    <feComposite in="ga" in2="d" operator="in" result="grain"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.2" numOctaves="2" seed="${seed + 11}" result="s"/>
    <feColorMatrix in="s" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.45 0 0 0 -0.22" result="sa"/>
    <feComposite in="sa" in2="d" operator="in" result="streak"/>
    <feMerge>
      <feMergeNode in="shadow"/><feMergeNode in="rim"/><feMergeNode in="d"/>
      <feMergeNode in="streak"/><feMergeNode in="grain"/>
    </feMerge>
  </filter>
  <filter id="rough" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="${seed + 1}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="${seed + 5}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0.7 0 0 0 -0.3" result="ga"/>
    <feComposite in="ga" in2="d" operator="in" result="grain"/>
    <feMerge><feMergeNode in="d"/><feMergeNode in="grain"/></feMerge>
  </filter>
  <filter id="paint" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.09" numOctaves="3" seed="${seed + 2}" result="s"/>
    <feColorMatrix in="s" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.6 0 0 0 -0.26" result="light"/>
    <feComposite in="light" in2="SourceGraphic" operator="in" result="l"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed + 4}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0 0.1  0.6 0 0 0 -0.26" result="ga"/>
    <feComposite in="ga" in2="SourceGraphic" operator="in" result="grain"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="l"/><feMergeNode in="grain"/></feMerge>
  </filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="8"/>
  </filter>
</defs>`;

/**
 * A full SVG document for one layer. `inner` is drawn in page coordinates
 * unless a different box is given.
 */
export const svgDoc = (inner: string, seed = 3, w = PAGE_W, h = PAGE_H): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs(seed)}${inner}</svg>`;

export const toDataUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// ---------------------------------------------------------------------------
// Shapes. Each returns SVG markup in page coordinates.
// ---------------------------------------------------------------------------

/** Deterministic wobble so the same scene is torn the same way every time. */
const rand = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

export const cloud = (cx: number, cy: number, s: number, fill = '#ffffff'): string => {
  const puffs = [
    [-34, 6, 20],
    [-14, -8, 26],
    [12, -14, 28],
    [36, -2, 22],
    [52, 10, 15],
  ];
  return `<g filter="url(#torn)" fill="${fill}">
    ${puffs.map(([x, y, r]) => `<circle cx="${cx + x * s}" cy="${cy + y * s}" r="${r * s}"/>`).join('')}
    <rect x="${cx - 46 * s}" y="${cy}" width="${104 * s}" height="${22 * s}" rx="${11 * s}"/>
  </g>`;
};

export const sun = (cx: number, cy: number, r: number, color = '#f7b64a', ray = '#f39c3a'): string => {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const x = cx + Math.cos(a) * r * 1.55;
    const y = cy + Math.sin(a) * r * 1.55;
    const deg = (a * 180) / Math.PI;
    return `<ellipse cx="${x}" cy="${y}" rx="${r * 0.55}" ry="${r * 0.2}" transform="rotate(${deg} ${x} ${y})"/>`;
  }).join('');
  return `<g filter="url(#torn)"><g fill="${ray}">${rays}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/></g>`;
};

export const birds = (x: number, y: number, s = 1, color = '#3a2f4a'): string =>
  `<g fill="none" stroke="${color}" stroke-width="${2.6 * s}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M${x} ${y} l${9 * s} ${7 * s} l${9 * s} ${-7 * s}"/>
    <path d="M${x + 26 * s} ${y + 20 * s} l${7 * s} ${5 * s} l${7 * s} ${-5 * s}"/>
  </g>`;

/** A band of hills across the page, with its top edge at about `y`. */
export const hills = (y: number, color: string, seed: number, amp = 26, filter = 'torn', bottom = PAGE_H): string => {
  const r = rand(seed);
  let d = `M-20 ${bottom + 20} L-20 ${y + (r() - 0.5) * amp}`;
  for (let x = 20; x <= PAGE_W + 60; x += 60 + r() * 50) {
    const top = y + (r() - 0.5) * amp * 2;
    d += ` Q${x - 30} ${top - amp * (0.6 + r())} ${x} ${top}`;
  }
  d += ` L${PAGE_W + 20} ${bottom + 20} Z`;
  return `<path d="${d}" fill="${color}" filter="url(#${filter})"/>`;
};

/** Pointed mountains, for the road out of the village. */
export const peaks = (base: number, color: string, seed: number, height = 180, snow = false, bottom = PAGE_H): string => {
  const r = rand(seed);
  let d = `M-30 ${bottom} L-30 ${base}`;
  let x = -30;
  const tips: [number, number][] = [];
  while (x < PAGE_W + 30) {
    const w = 90 + r() * 90;
    const tipY = base - height * (0.55 + r() * 0.45);
    d += ` L${x + w / 2} ${tipY} L${x + w} ${base - r() * 20}`;
    tips.push([x + w / 2, tipY]);
    x += w;
  }
  d += ` L${PAGE_W + 30} ${bottom} Z`;
  const caps = snow
    ? tips
        .map(([tx, ty]) => `<path d="M${tx - 18} ${ty + 26} L${tx} ${ty} L${tx + 18} ${ty + 26} L${tx + 8} ${ty + 20} L${tx} ${ty + 28} L${tx - 8} ${ty + 20} Z" fill="#f4f7fb"/>`)
        .join('')
    : '';
  return `<g filter="url(#torn)"><path d="${d}" fill="${color}"/>${caps}</g>`;
};

export const tree = (x: number, y: number, s: number, leaf = '#4f9a3c', trunk = '#7a4f2a'): string =>
  `<g filter="url(#torn)">
    <rect x="${x - 6 * s}" y="${y - 40 * s}" width="${12 * s}" height="${44 * s}" fill="${trunk}"/>
    <g fill="${leaf}">
      <circle cx="${x}" cy="${y - 62 * s}" r="${28 * s}"/>
      <circle cx="${x - 22 * s}" cy="${y - 44 * s}" r="${20 * s}"/>
      <circle cx="${x + 22 * s}" cy="${y - 46 * s}" r="${21 * s}"/>
    </g>
  </g>`;

export const pine = (x: number, y: number, s: number, leaf = '#2f6e3a'): string =>
  `<g filter="url(#rough)" fill="${leaf}">
    <path d="M${x} ${y - 70 * s} L${x + 22 * s} ${y - 30 * s} L${x + 12 * s} ${y - 30 * s} L${x + 28 * s} ${y} L${x - 28 * s} ${y} L${x - 12 * s} ${y - 30 * s} L${x - 22 * s} ${y - 30 * s} Z"/>
  </g>`;

/** A thatched farmhouse, like the picture book's. */
export const house = (x: number, y: number, s: number): string =>
  `<g filter="url(#torn)">
    <rect x="${x - 30 * s}" y="${y - 26 * s}" width="${60 * s}" height="${26 * s}" fill="#8a5a36"/>
    <rect x="${x - 7 * s}" y="${y - 18 * s}" width="${14 * s}" height="${18 * s}" fill="#4b2e1a"/>
    <path d="M${x - 42 * s} ${y - 22 * s} Q${x} ${y - 70 * s} ${x + 42 * s} ${y - 22 * s} Z" fill="#c9a263"/>
    <g stroke="#9c7a44" stroke-width="${1.6 * s}" fill="none">
      <path d="M${x - 30 * s} ${y - 30 * s} Q${x} ${y - 58 * s} ${x + 30 * s} ${y - 30 * s}"/>
      <path d="M${x - 20 * s} ${y - 40 * s} Q${x} ${y - 60 * s} ${x + 20 * s} ${y - 40 * s}"/>
    </g>
  </g>`;

/** A villager at work in the field, seen from far off. Scenery, not a character. */
export const farmer = (x: number, y: number, s: number, shirt = '#5b7fb5'): string =>
  `<g filter="url(#rough)">
    <path d="M${x - 4 * s} ${y} L${x - 2 * s} ${y - 14 * s} L${x + 4 * s} ${y - 14 * s} L${x + 5 * s} ${y} Z" fill="#6b4a30"/>
    <path d="M${x - 6 * s} ${y - 13 * s} Q${x + 2 * s} ${y - 28 * s} ${x + 8 * s} ${y - 14 * s} Z" fill="${shirt}"/>
    <circle cx="${x + 7 * s}" cy="${y - 25 * s}" r="${4 * s}" fill="#e9b98c"/>
    <ellipse cx="${x + 7 * s}" cy="${y - 28 * s}" rx="${9 * s}" ry="${3 * s}" fill="#e3c35a"/>
    <path d="M${x + 6 * s} ${y - 18 * s} L${x + 18 * s} ${y + 2 * s}" stroke="#6b4a30" stroke-width="${1.6 * s}"/>
  </g>`;

export const rock = (cx: number, cy: number, s: number, seed = 1, color = '#8f8a86'): string => {
  const r = rand(seed);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + Math.PI;
    const rr = (0.8 + r() * 0.3) * s;
    const x = cx + Math.cos(a) * rr * 1.25;
    const y = cy + Math.min(0.55, Math.sin(a)) * rr;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<g filter="url(#torn)"><polygon points="${pts}" fill="${color}"/>
    <path d="M${cx - s * 0.5} ${cy - s * 0.4} q${s * 0.3} ${-s * 0.2} ${s * 0.7} ${-s * 0.05}" stroke="#b9b4ae" stroke-width="${s * 0.08}" fill="none" stroke-linecap="round"/></g>`;
};

/** Waves across the page, like the reference clip's torn-paper sea. */
export const waves = (y: number, color: string, seed: number, amp = 10, bottom = PAGE_H): string => {
  const r = rand(seed);
  let d = `M-20 ${bottom} L-20 ${y}`;
  for (let x = -20; x < PAGE_W + 40; x += 44) {
    d += ` q11 ${-amp - r() * 6} 22 0 q11 ${amp * 0.6} 22 0`;
  }
  d += ` L${PAGE_W + 40} ${bottom} Z`;
  // Map-like contour lines on the water, as in the reference.
  const rings = [0, 1, 2]
    .map((i) => `<ellipse cx="${80 + i * 130 + r() * 30}" cy="${y + 60 + r() * 50}" rx="${30 + r() * 20}" ry="${14 + r() * 8}" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.4"/>`)
    .join('');
  return `<g filter="url(#torn)"><path d="${d}" fill="${color}"/>${rings}</g>`;
};

/** Rain, drawn over a page and a half so it can scroll down and loop. */
export const rain = (color = 'rgba(210,230,255,0.75)'): string => {
  const r = rand(42);
  const drops = Array.from({ length: 90 }, () => {
    const x = r() * (PAGE_W + 80) - 40;
    const y = r() * PAGE_H;
    return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l-6 18"/>`;
  }).join('');
  return `<g stroke="${color}" stroke-width="2" stroke-linecap="round">${drops}</g>`;
};

/** Soft sparkles, for healing and magic. */
export const sparkles = (seed: number, color = '#fff6c9', count = 26, box = { x: 60, y: 120, w: 280, h: 420 }): string => {
  const r = rand(seed);
  return Array.from({ length: count }, () => {
    const x = box.x + r() * box.w;
    const y = box.y + r() * box.h;
    const s = 2 + r() * 5;
    return `<path d="M${x} ${y - s * 2} L${x + s * 0.5} ${y - s * 0.5} L${x + s * 2} ${y} L${x + s * 0.5} ${y + s * 0.5} L${x} ${y + s * 2} L${x - s * 0.5} ${y + s * 0.5} L${x - s * 2} ${y} L${x - s * 0.5} ${y - s * 0.5} Z" fill="${color}"/>`;
  }).join('');
};

/** A wild boar in torn paper. Faces right. */
export const boar = (x: number, y: number, s: number): string =>
  `<g filter="url(#torn)">
    <g fill="#4a3226">
      <rect x="${x - 34 * s}" y="${y - 6 * s}" width="${9 * s}" height="${22 * s}" rx="${3 * s}"/>
      <rect x="${x - 16 * s}" y="${y - 4 * s}" width="${9 * s}" height="${20 * s}" rx="${3 * s}"/>
      <rect x="${x + 10 * s}" y="${y - 6 * s}" width="${9 * s}" height="${22 * s}" rx="${3 * s}"/>
      <rect x="${x + 26 * s}" y="${y - 4 * s}" width="${9 * s}" height="${20 * s}" rx="${3 * s}"/>
    </g>
    <path d="M${x - 46 * s} ${y} Q${x - 50 * s} ${y - 34 * s} ${x - 8 * s} ${y - 38 * s} Q${x + 30 * s} ${y - 42 * s} ${x + 44 * s} ${y - 22 * s} L${x + 70 * s} ${y - 8 * s} L${x + 62 * s} ${y + 4 * s} Q${x + 10 * s} ${y + 14 * s} ${x - 46 * s} ${y} Z" fill="#5e4031"/>
    <path d="M${x - 30 * s} ${y - 36 * s} l6 ${-10 * s} l6 ${9 * s} l6 ${-10 * s} l6 ${10 * s} l6 ${-9 * s} l6 ${9 * s}" fill="#3b271d"/>
    <ellipse cx="${x + 69 * s}" cy="${y - 2 * s}" rx="${5 * s}" ry="${6 * s}" fill="#8a6150"/>
    <path d="M${x + 58 * s} ${y + 2 * s} q${6 * s} ${-2 * s} ${8 * s} ${-12 * s}" stroke="#fff4e0" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 46 * s}" cy="${y - 18 * s}" r="${2.6 * s}" fill="#1b120c"/>
    <path d="M${x + 36 * s} ${y - 30 * s} l${4 * s} ${-12 * s} l${6 * s} ${10 * s} Z" fill="#4a3226"/>
  </g>`;

/** The picture book's giant hornet, big as a dog. Faces left. */
export const bee = (x: number, y: number, s: number): string =>
  `<g filter="url(#torn)">
    <g fill="rgba(255,190,140,0.82)" stroke="#b5562a" stroke-width="${1.5 * s}">
      <path d="M${x} ${y - 10 * s} Q${x + 20 * s} ${y - 70 * s} ${x + 70 * s} ${y - 58 * s} Q${x + 48 * s} ${y - 24 * s} ${x} ${y - 10 * s} Z"/>
      <path d="M${x - 4 * s} ${y - 12 * s} Q${x - 30 * s} ${y - 64 * s} ${x - 64 * s} ${y - 50 * s} Q${x - 40 * s} ${y - 20 * s} ${x - 4 * s} ${y - 12 * s} Z"/>
    </g>
    <ellipse cx="${x + 34 * s}" cy="${y + 14 * s}" rx="${34 * s}" ry="${20 * s}" transform="rotate(22 ${x + 34 * s} ${y + 14 * s})" fill="#f0902a"/>
    <g fill="#2b1d12">
      <path d="M${x + 18 * s} ${y - 2 * s} q${6 * s} ${18 * s} ${-2 * s} ${30 * s} l${8 * s} ${2 * s} q${8 * s} ${-14 * s} ${2 * s} ${-30 * s} Z"/>
      <path d="M${x + 38 * s} ${y + 4 * s} q${6 * s} ${18 * s} ${-2 * s} ${30 * s} l${8 * s} ${2 * s} q${8 * s} ${-14 * s} ${2 * s} ${-30 * s} Z"/>
      <path d="M${x + 64 * s} ${y + 26 * s} l${12 * s} ${10 * s} l${-14 * s} ${-2 * s} Z"/>
    </g>
    <ellipse cx="${x - 6 * s}" cy="${y - 4 * s}" rx="${16 * s}" ry="${13 * s}" fill="#3a2718"/>
    <ellipse cx="${x - 24 * s}" cy="${y - 8 * s}" rx="${15 * s}" ry="${16 * s}" fill="#f2a33a"/>
    <circle cx="${x - 30 * s}" cy="${y - 13 * s}" r="${6 * s}" fill="#e2502b"/>
    <circle cx="${x - 30 * s}" cy="${y - 13 * s}" r="${2.4 * s}" fill="#1b120c"/>
    <path d="M${x - 34 * s} ${y + 4 * s} l${-6 * s} ${10 * s} M${x - 26 * s} ${y + 6 * s} l${2 * s} ${10 * s}" stroke="#2b1d12" stroke-width="${2.4 * s}"/>
    <path d="M${x - 26 * s} ${y - 22 * s} q${-8 * s} ${-18 * s} ${-20 * s} ${-16 * s}" stroke="#2b1d12" stroke-width="${2 * s}" fill="none"/>
  </g>`;

/** A crow — the little thief of the tutorial. Faces left. */
export const crow = (x: number, y: number, s: number): string =>
  `<g filter="url(#torn)">
    <path d="M${x + 6 * s} ${y - 6 * s} Q${x + 40 * s} ${y - 40 * s} ${x + 70 * s} ${y - 20 * s} Q${x + 40 * s} ${y - 6 * s} ${x + 6 * s} ${y - 6 * s} Z" fill="#2c2a3a"/>
    <ellipse cx="${x + 22 * s}" cy="${y + 6 * s}" rx="${30 * s}" ry="${17 * s}" fill="#34324a"/>
    <path d="M${x + 44 * s} ${y + 4 * s} l${26 * s} ${-6 * s} l${-4 * s} ${14 * s} Z" fill="#2c2a3a"/>
    <circle cx="${x - 4 * s}" cy="${y - 6 * s}" r="${14 * s}" fill="#34324a"/>
    <path d="M${x - 16 * s} ${y - 8 * s} l${-18 * s} ${6 * s} l${18 * s} ${4 * s} Z" fill="#e0a52c"/>
    <circle cx="${x - 7 * s}" cy="${y - 10 * s}" r="${3.4 * s}" fill="#fff6d8"/>
    <circle cx="${x - 8 * s}" cy="${y - 10 * s}" r="${1.7 * s}" fill="#141220"/>
    <path d="M${x + 12 * s} ${y + 20 * s} l${-2 * s} ${10 * s} M${x + 24 * s} ${y + 20 * s} l${2 * s} ${10 * s}" stroke="#e0a52c" stroke-width="${2.4 * s}" stroke-linecap="round"/>
  </g>`;
