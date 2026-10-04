import { compoundsVersion, getCompounds } from './compounds';
import { parseRuby } from '../lib/ruby';
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
  山田: 'Yamada (a family name)',
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
let indexedVersion = -1;

const build = () => {
  const m = new Map<string, string>();
  for (const k of ALL_KANJI) m.set(k.char, k.meanings[0]);
  for (const c of getCompounds()) m.set(c.word, c.gloss);
  for (const [w, g] of Object.entries(STORY_WORDS)) m.set(w, g);
  return m;
};

/** The English for a word as written in the text (the base under the ruby). */
export const glossFor = (word: string): string | undefined => {
  if (!index || indexedVersion !== compoundsVersion()) {
    index = build();
    indexedVersion = compoundsVersion();
  }
  return index.get(word);
};

/**
 * Kana words of the story a learner at this level may not know yet — words
 * past N5 that the story writes in kana (ねふだ, じこくひょう), the verbs of
 * the action, and the sounds. Listed in the forms the lines use; a word is
 * found when it stands alone or with a particle after it (ねふだが).
 */
export const KANA_WORDS: Readonly<Record<string, string>> = {
  モジクイ: 'Mojikui (letter-eater)',
  ふだ: 'sign, card',
  ねふだ: 'price tag',
  なふだ: 'name tag',
  かんばん: 'shop sign',
  じこくひょう: 'timetable',
  よていひょう: 'schedule',
  いきさき: 'destination',
  しょうてんがい: 'shopping street',
  とけいだい: 'clock tower',
  もじばん: 'clock face',
  はり: 'clock hand',
  はぐるま: 'gear wheel',
  こうば: 'workshop',
  ふもと: 'foot of a hill',
  ひろば: 'town square',
  いちば: 'market',
  バスてい: 'bus stop',
  ロープウェー: 'cable car',
  トンネル: 'tunnel',
  カレンダー: 'calendar',
  ほんだな: 'bookshelf',
  じしょ: 'dictionary',
  くすり: 'medicine',
  ジェム: 'gem (◆)',
  スタンプ: 'stamp',
  ずかん: 'collection book',
  なかま: 'friend, teammate',
  ぶき: 'weapon',
  ばんごう: 'number',
  すうじ: 'number, digit',
  かげ: 'shadow',
  けむり: 'smoke',
  あわ: 'bubble',
  きり: 'fog',
  くうこう: 'airport',
  ごちそう: 'a treat, feast',
  にがて: 'weak at',
  まじめ: 'serious, hard-working',
  しょうぶ: 'match, contest',
  たいせん: 'battle (versus)',
  かじる: 'gnaw, bite',
  にげました: 'ran away',
  にげます: 'run away',
  のこって: 'is left (remaining)',
  ひかります: 'shines',
  たたかいます: 'fight',
  もどりました: 'came back',
  もどって: 'come back',
  うごきます: 'moves',
  うごきません: "doesn't move",
  うごきました: 'moved',
  おいかけましょう: "let's chase",
  きそう: 'compete',
  ガリガリ: 'crunch, crunch',
  カリカリ: 'nibble, nibble',
  ガブッ: 'chomp!',
  バリッ: 'crack!',
  ギギギ: 'creak…',
  ブルルン: 'vroom',
  ペラペラ: 'flip, flip (pages)',
  ぐるぐる: 'round and round',
};

/** What may follow a kana word in a line and still leave it that word. */
const PARTICLE = /^(?:が|を|に|へ|で|と|の|は|も|や|から|まで|です|ですか|でした|だ)?$/;

/** A kana word of the line, if the token is one (ねふだが → ねふだ). */
const kanaWordOf = (token: string): string | undefined => {
  for (let n = token.length; n >= 2; n--) {
    const head = token.slice(0, n);
    if (KANA_WORDS[head] && PARTICLE.test(token.slice(n))) return head;
  }
  return undefined;
};

/**
 * The annotated words of a story line, each with its English — what ？ことば
 * shows. Scripts write a word a character at a time (学(がく)生(せい)), so
 * runs of annotated characters with nothing between them are joined into the
 * longest word that has a meaning of its own: 学生 is "student", not "study"
 * and "life". Words without English are left out.
 */
export const wordsOfLine = (text: string): { word: string; gloss: string }[] => {
  const segs = parseRuby(text);
  const seen = new Set<string>();
  const out: { word: string; gloss: string }[] = [];
  for (let i = 0; i < segs.length; ) {
    if (!segs[i].reading || /^[0-9０-９]/.test(segs[i].text)) {
      i++;
      continue;
    }
    let run = 1;
    while (i + run < segs.length && run < 4 && segs[i + run].reading && !/^[0-9０-９]/.test(segs[i + run].text)) run++;
    let take = run;
    for (; take > 1; take--) if (glossFor(segs.slice(i, i + take).map((s) => s.text).join(''))) break;
    const part = segs.slice(i, i + take);
    const base = part.map((s) => s.text).join('');
    const gloss = glossFor(base);
    if (gloss && !seen.has(base)) {
      seen.add(base);
      out.push({ word: part.map((s) => `${s.text}(${s.reading})`).join(''), gloss });
    }
    i += take;
  }
  // The kana words, in the order they come.
  for (const token of text.replace(/\([^)]*\)/g, '').split(/[\s、。！？!?…「」『』（）()・〜—]+/u)) {
    const word = kanaWordOf(token.replace(/[^\p{L}ー]/gu, ''));
    if (word && !seen.has(word)) {
      seen.add(word);
      out.push({ word, gloss: KANA_WORDS[word] });
    }
  }
  return out;
};
