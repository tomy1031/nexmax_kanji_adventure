import { cloud, hills, house, peaks, pine, svgDoc, tree, waves } from '../picturebook/paper';

/**
 * The stage-select map, as one tall sheet of torn paper: the village at the
 * bottom, the road over the mountain, the forest, and the great tree
 * vanishing into the clouds at the top — the whole of むかし編 in one climb
 * (public/img/design/むかし編_村のたのみステージ選択.png).
 */

export const MAP_W = 400;
export const MAP_H = 1300;

/** Where each node sits: 0話 first, then stages 1–10, bottom to top. */
export const NODE_POS: [number, number][] = [
  [118, 1200], // 0
  [236, 1130], // 1
  [128, 1030], // 2
  [258, 935], // 3
  [140, 840], // 4
  [262, 745], // 5
  [132, 650], // 6
  [258, 555], // 7
  [150, 460], // 8
  [250, 360], // 9
  [200, 250], // 10
];

const road = () => {
  const [first, ...rest] = NODE_POS;
  let d = `M${first[0]} ${first[1] + 40}`;
  let prev = first;
  for (const p of rest) {
    const midY = (prev[1] + p[1]) / 2;
    d += ` C${prev[0]} ${midY} ${p[0]} ${midY} ${p[0]} ${p[1]}`;
    prev = p;
  }
  return `<path d="${d}" stroke="#e9d3a2" stroke-width="22" fill="none" stroke-linecap="round" filter="url(#torn)"/>
          <path d="${d}" stroke="#fff6dc" stroke-width="3" stroke-dasharray="2 14" fill="none" stroke-linecap="round"/>`;
};

export const mapSvg = (): string =>
  svgDoc(
    `<linearGradient id="msky" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#5fb4ea"/><stop offset="0.35" stop-color="#bfe6fb"/><stop offset="1" stop-color="#d9f0f8"/>
     </linearGradient>
     <rect width="${MAP_W}" height="${MAP_H}" fill="url(#msky)" filter="url(#paint)"/>
     ${cloud(70, 90, 1.1)}${cloud(330, 140, 0.9)}${cloud(90, 300, 0.7)}
     <g filter="url(#torn)">
       <path d="M176 520 Q186 360 192 120 L212 120 Q220 360 232 520 Z" fill="#7a4a26"/>
       <circle cx="202" cy="120" r="46" fill="#4f9a3c"/><circle cx="170" cy="140" r="30" fill="#5aa845"/><circle cx="236" cy="140" r="32" fill="#5aa845"/>
     </g>
     <circle cx="202" cy="96" r="12" fill="#ffe27a" opacity="0.9"/>
     ${cloud(150, 210, 1.0, '#f5f8fc')}${cloud(270, 230, 0.85, '#f5f8fc')}
     ${hills(520, '#3f7d38', 3, 18, 'torn', 900)}
     ${tree(40, 580, 1.1, '#3c7a38')}${tree(360, 570, 1.2, '#3c7a38')}${tree(100, 640, 0.9, '#57a043')}${tree(310, 650, 0.9, '#57a043')}
     ${peaks(880, '#9fb9cd', 7, 200, true, 1300)}
     ${peaks(910, '#7fa36e', 19, 110, false, 1300)}
     ${hills(900, '#5c9b48', 9, 12, 'torn', 1300)}
     ${pine(40, 930, 1)}${pine(360, 920, 1.1)}
     ${waves(965, '#6fb3e0', 4, 8, 1300)}
     ${hills(1000, '#7fb94f', 13, 10, 'torn', 1300)}
     <path d="M-20 1300 L-20 1060 Q200 1040 420 1060 L420 1300 Z" fill="#b3cf55" filter="url(#torn)"/>
     ${house(52, 1110, 0.9)}${house(340, 1080, 0.85)}${house(330, 1220, 1)}${house(40, 1260, 0.8)}
     ${road()}`,
    5,
    MAP_W,
    MAP_H,
  );
