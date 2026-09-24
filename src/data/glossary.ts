import { getCompounds } from './compounds.generated';
import { ALL_KANJI } from './kanji.generated';

/**
 * ことばの 意味 — English for one word at a time.
 *
 * The reading aid for learners who cannot yet read the line
 * (docs/design/07 §3): tapping ことば shows what each word in it means —
 * the words, never the sentence. Joining them up stays the learner's work.
 *
 * Most words come from the compound table and the kanji table. The story
 * uses some the game does not teach (生命草, 異空間); those are here.
 */
const STORY_WORDS: Record<string, string> = {
  農業: 'farming',
  農作: 'growing crops',
  手伝: 'help',
  大好: 'love (like very much)',
  家: 'home',
  何日: 'how many days',
  四人: 'four people',
  生命草: 'the Life Leaf',
  旅立: 'set out on a journey',
  雲: 'cloud',
  思: 'think',
  岸: 'shore',
  巨大: 'giant',
  羽: 'wing',
  自分: 'oneself',
  胸: 'chest',
  不思議: 'strange, mysterious',
  空間: 'space',
  異空間: 'another world',
  自分自身: 'oneself',
  治癒: 'healing',
  瞬間: 'moment',
  傷: 'wound',
  二日: 'two days',
  森: 'forest',
  目印: 'landmark',
  目的地: 'destination',
  枝: 'branch',
  夕方: 'evening',
  校舎: 'school building',
  指先: 'fingertip',
  一歩: 'one step',
  一枚: 'one (flat thing)',
  金色: 'gold (colour)',
  編: 'chapter',
  入口: 'entrance',
  刀: 'sword',
  武器: 'weapon',
  太刀: 'long sword',
  // 現代編
  入社式: 'welcome ceremony for new employees',
  社員: 'employee',
  五十人: 'fifty people',
  社会人: 'working adult',
  新人: 'newcomer',
  研修: 'training',
  九十日: 'ninety days',
  一年目: 'first year',
  高速道路: 'highway',
  静岡県: 'Shizuoka Prefecture',
  富士山: 'Mt. Fuji',
  三人: 'three people',
  先輩: 'senior (at work or school)',
  細: 'thin, narrow',
  研修所: 'training centre',
  五分: 'five minutes',
  自己紹介: 'self-introduction',
  東京: 'Tokyo',
  家族: 'family',
  起: 'happen',
  気持: 'feeling',
  現代編: 'modern chapter',
  // 現代編 7〜10話（原作 #2〜#5）
  大阪: 'Osaka',
  沖縄: 'Okinawa',
  福岡: 'Fukuoka',
  新入社員: 'new employee',
  毎年: 'every year',
  合宿: 'training camp (living together)',
  一日目: 'the first day',
  湖: 'lake',
  意気込: 'resolve, determination',
  連帯責任: 'group responsibility (all are punished for one)',
  罰: 'punishment',
  競争: 'race, competition',
  一年前: 'a year ago',
  四年生: 'fourth-year student',
  就活: 'job hunting',
  面接: 'job interview',
  最終面接: 'final interview',
  後日: 'some days later',
  不採用: 'not hired',
  採用: 'hired',
  縁: 'fate, connection',
  似合: 'suit, look good on',
  一気: 'all at once',
  方: 'person (polite)',
  専務: 'senior managing director',
  温: 'warm',
  大役: 'big role',
  四月: 'April',
  一室: 'a room',
  同期: 'people who joined at the same time',
  移動: 'moving',
  九十日間: 'ninety days',
  三十日: 'thirty days',
  線: 'line',
  二十五: 'twenty-five',
  五十: 'fifty',
  五位: 'fifth place',
  短: 'short',
  一回: 'one time',
  二回目: 'the second time',
  体力: 'stamina',
  筋肉: 'muscles',
  悲鳴: 'scream',
  国体: 'the National Sports Festival',
  種目: 'event (in sports)',
  原作: 'the original (manga)',
};

let index: Map<string, string> | null = null;

const build = () => {
  const m = new Map<string, string>();
  for (const k of ALL_KANJI) m.set(k.char, k.meanings[0]);
  for (const c of getCompounds()) m.set(c.word, c.gloss);
  for (const [w, g] of Object.entries(STORY_WORDS)) m.set(w, g);
  return m;
};

/** The English for a word as written in the text (the base under the ruby). */
export const glossFor = (word: string): string | undefined => {
  if (!index) index = build();
  return index.get(word);
};
