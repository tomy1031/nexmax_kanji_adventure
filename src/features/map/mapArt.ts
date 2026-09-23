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

/**
 * 現代編 の 地図: the city at the bottom, the highway out of it, the sea of
 * trees, and the training centre — then fog, where episodes #2–#5 will go.
 */
const building = (x: number, base: number, w: number, h: number, color: string) =>
  `<g filter="url(#torn)"><rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${color}"/>
   ${Array.from({ length: Math.floor(h / 26) }, (_, r) =>
     Array.from({ length: Math.floor(w / 18) }, (_, c) => `<rect x="${x + 6 + c * 18}" y="${base - h + 8 + r * 26}" width="8" height="12" fill="#fff3c2" opacity="0.8"/>`).join(''),
   ).join('')}</g>`;

export const gendaiMapSvg = (): string =>
  svgDoc(
    `<linearGradient id="gmsky" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#6b6f92"/><stop offset="0.3" stop-color="#a9b8d6"/><stop offset="1" stop-color="#cfe6f5"/>
     </linearGradient>
     <rect width="${MAP_W}" height="${MAP_H}" fill="url(#gmsky)" filter="url(#paint)"/>
     ${cloud(80, 80, 1.6, '#e3e6ee')}${cloud(260, 140, 1.4, '#e8eaf0')}${cloud(150, 230, 1.2, '#eef0f4')}
     ${peaks(420, '#8a9cc0', 5, 220, true, 1300)}
     ${hills(430, '#2f4a3a', 17, 20, 'torn', 800)}
     ${[20, 70, 130, 190, 250, 310, 360].map((x, i) => pine(x, 470 + (i % 2) * 14, 1.4, '#243a2e')).join('')}
     <g filter="url(#torn)"><rect x="150" y="360" width="110" height="70" fill="#8d8478"/><path d="M140 364 L205 330 L270 364 Z" fill="#5a4f47"/></g>
     ${hills(620, '#3f6a4a', 23, 16, 'torn', 1300)}
     ${[40, 110, 300, 360].map((x, i) => pine(x, 660 + (i % 2) * 20, 1.2, '#2c4a36')).join('')}
     ${hills(820, '#6aa142', 29, 12, 'torn', 1300)}
     <path d="M-20 1300 L-20 1000 Q200 980 420 1000 L420 1300 Z" fill="#b8b8c0" filter="url(#torn)"/>
     ${building(10, 1120, 70, 150, '#7f8fb0')}${building(90, 1120, 54, 110, '#9aa7c2')}${building(300, 1120, 90, 180, '#6f7fa2')}
     ${building(20, 1260, 90, 90, '#a8b3c9')}${building(290, 1270, 100, 120, '#8795b3')}
     ${road()}`,
    9,
    MAP_W,
    MAP_H,
  );
