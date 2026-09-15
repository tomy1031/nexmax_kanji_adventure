import type { KanjiData } from '../../types/kanji';

/**
 * Turning a kanji's *meaning* into a game attribute.
 *
 * The rule has to be a rule, not a taste: 618 characters is far too many to
 * hand-assign, and a learner who notices that 火 is fire but 炎 is "neutral"
 * has caught the game lying about the language. So the element comes from the
 * English gloss the dataset already carries, matched against a keyword table
 * below, and every kanji that matches nothing lands in MU (無) — which is a
 * real category, not a dumping ground: MU weapons trade element damage for
 * raw weight.
 *
 * The table is ordered. The first element whose keywords hit wins, so the
 * specific (fire) is listed before the general (light).
 */

export const Element = {
  /** 火 — fire, heat, energy */
  KA: 'KA',
  /** 水 — water, liquid, flow */
  SUI: 'SUI',
  /** 木 — plants, growth, life */
  MOKU: 'MOKU',
  /** 金 — metal, money, tools, machines */
  KIN: 'KIN',
  /** 土 — earth, stone, place, structure */
  DO: 'DO',
  /** 光 — light, sky, time, mind */
  KOU: 'KOU',
  /** 闇 — dark, death, hardship, negation */
  AN: 'AN',
  /** 無 — no element. Heavy, plain, dependable. */
  MU: 'MU',
} as const;
export type Element = (typeof Element)[keyof typeof Element];

export const ELEMENT_LABEL: Record<Element, { ja: string; reading: string; en: string; color: string }> = {
  KA: { ja: '火', reading: 'ひ', en: 'Fire', color: '#ff6b3d' },
  SUI: { ja: '水', reading: 'みず', en: 'Water', color: '#3aa8f0' },
  MOKU: { ja: '木', reading: 'き', en: 'Wood', color: '#5cbf6a' },
  KIN: { ja: '金', reading: 'かね', en: 'Metal', color: '#e0b44a' },
  DO: { ja: '土', reading: 'つち', en: 'Earth', color: '#b98a53' },
  KOU: { ja: '光', reading: 'ひかり', en: 'Light', color: '#ffd45e' },
  AN: { ja: '闇', reading: 'やみ', en: 'Dark', color: '#8a6bd1' },
  MU: { ja: '無', reading: 'む', en: 'Plain', color: '#93a3b8' },
};

/**
 * Keyword table, most specific first. Matched against the lower-cased English
 * glosses as whole words.
 */
const KEYWORDS: [Element, string[]][] = [
  [
    Element.KA,
    ['fire', 'flame', 'burn', 'heat', 'hot', 'blaze', 'boil', 'cook', 'roast', 'smoke', 'ash',
     'explode', 'explosion', 'lamp', 'candle', 'summer', 'warm', 'anger', 'rage', 'passion'],
  ],
  [
    Element.SUI,
    ['water', 'sea', 'ocean', 'river', 'lake', 'rain', 'wave', 'swim', 'drink', 'wash', 'pour',
     'flow', 'wet', 'liquid', 'ice', 'snow', 'cold', 'freeze', 'fish', 'port', 'harbor', 'harbour',
     'bath', 'tide', 'spring', 'well', 'oil', 'juice', 'tea', 'wine', 'blood', 'cloud', 'winter'],
  ],
  [
    Element.MOKU,
    ['tree', 'wood', 'forest', 'grass', 'flower', 'leaf', 'plant', 'rice', 'grain', 'seed', 'root',
     'branch', 'bamboo', 'grow', 'green', 'farm', 'field', 'garden', 'fruit', 'vegetable', 'life',
     'live', 'birth', 'born', 'bloom', 'spring', 'nature', 'animal', 'bird', 'insect', 'bug',
     'horse', 'dog', 'cow', 'sheep', 'medicine', 'food', 'eat', 'body', 'health'],
  ],
  [
    Element.KIN,
    ['gold', 'metal', 'iron', 'steel', 'silver', 'copper', 'money', 'yen', 'coin', 'price', 'buy',
     'sell', 'trade', 'cost', 'pay', 'rich', 'treasure', 'machine', 'tool', 'car', 'train', 'wheel',
     'engine', 'electric', 'electricity', 'wire', 'needle', 'knife', 'sword', 'blade', 'cut',
     'sharp', 'gun', 'industry', 'factory', 'craft', 'build', 'make', 'work', 'number', 'count',
     '計', 'measure', 'clock'],
  ],
  [
    Element.DO,
    ['earth', 'soil', 'ground', 'land', 'stone', 'rock', 'mountain', 'hill', 'sand', 'dirt', 'mud',
     'cave', 'valley', 'island', 'country', 'village', 'town', 'city', 'capital', 'house', 'home',
     'room', 'building', 'temple', 'shrine', 'wall', 'gate', 'door', 'road', 'path', 'bridge',
     'place', 'area', 'region', 'district', 'province', 'store', 'shop', 'school', 'station',
     'heavy', 'thick', 'solid', 'base', 'foundation'],
  ],
  [
    Element.KOU,
    ['light', 'shine', 'bright', 'sun', 'moon', 'star', 'sky', 'heaven', 'day', 'morning', 'noon',
     'time', 'hour', 'minute', 'year', 'month', 'week', 'season', 'clear', 'white', 'see', 'look',
     'eye', 'know', 'think', 'learn', 'study', 'teach', 'wise', 'mind', 'heart', 'spirit', 'soul',
     'dream', 'hope', 'joy', 'happy', 'love', 'kind', 'beautiful', 'peace', 'god', 'holy', 'high',
     'sound', 'voice', 'speak', 'say', 'word', 'language', 'read', 'write', 'book', 'letter',
     'music', 'song', 'colour', 'color'],
  ],
  [
    Element.AN,
    ['dark', 'darkness', 'night', 'evening', 'shadow', 'black', 'death', 'die', 'dead', 'kill',
     'disease', 'sick', 'ill', 'pain', 'hurt', 'wound', 'poison', 'bad', 'evil', 'crime', 'sin',
     'war', 'fight', 'battle', 'enemy', 'fear', 'sad', 'cry', 'lose', 'loss', 'fall', 'break',
     'destroy', 'end', 'stop', 'close', 'hide', 'secret', 'ghost', 'demon', 'deep', 'cold',
     'not', 'no', 'un-', 'negative', 'difficult', 'hard', 'danger', 'poor', 'empty'],
  ],
];

// Flattened for lookup: keyword -> element (first table entry wins).
const KEYWORD_TO_ELEMENT = new Map<string, Element>();
for (const [element, words] of KEYWORDS) {
  for (const w of words) {
    if (!KEYWORD_TO_ELEMENT.has(w)) KEYWORD_TO_ELEMENT.set(w, element);
  }
}

const cache = new Map<string, Element>();

/** The element a kanji contributes to a weapon. Deterministic and cached. */
export const elementOf = (kanji: KanjiData): Element => {
  const hit = cache.get(kanji.id);
  if (hit) return hit;

  // Words from the glosses, lower-cased, punctuation stripped.
  const words = kanji.meanings
    .flatMap((m) => m.toLowerCase().split(/[^a-z-]+/))
    .filter(Boolean);

  let found: Element = Element.MU;
  // Walk the table in order so the most specific element wins regardless of
  // which gloss happened to come first.
  outer: for (const [element] of KEYWORDS) {
    for (const w of words) {
      if (KEYWORD_TO_ELEMENT.get(w) === element) {
        found = element;
        break outer;
      }
    }
  }

  cache.set(kanji.id, found);
  return found;
};

/**
 * The classic five-phase cycle, extended with light/dark.
 * 火 → 金 → 木 → 土 → 水 → 火 (each beats the next)
 * 光 ↔ 闇 beat each other. 無 neither beats nor is beaten.
 */
const BEATS: Partial<Record<Element, Element>> = {
  KA: Element.KIN,
  KIN: Element.MOKU,
  MOKU: Element.DO,
  DO: Element.SUI,
  SUI: Element.KA,
};

export const effectiveness = (attacker: Element, defender: Element): number => {
  if (attacker === Element.MU || defender === Element.MU) return 1;
  if (attacker === Element.KOU && defender === Element.AN) return 2;
  if (attacker === Element.AN && defender === Element.KOU) return 2;
  if (BEATS[attacker] === defender) return 2;
  if (BEATS[defender] === attacker) return 0.5;
  return 1;
};
