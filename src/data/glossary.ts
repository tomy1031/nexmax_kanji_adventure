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
