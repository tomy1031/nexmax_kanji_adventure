import { describe, it, expect } from 'vitest';
import { forgeWeapon, forgeSingleBlade, weaponOf, discoverableCompounds, ICON_POOL, WeaponClass, classOf } from './weapon';
import { MOJI_EPISODES } from '../../data/mojiEpisodes';
import { elementOf, Element, effectiveness } from './elements';
import { getKanjiByChar } from '../kanjiDb';
import { slotReadings } from '../wordReading';

const k = (char: string) => {
  const found = getKanjiByChar(char);
  if (!found) throw new Error(`test fixture missing kanji: ${char}`);
  return found;
};

describe('elementOf', () => {
  it('reads the element out of the English gloss', () => {
    expect(elementOf(k('火'))).toBe(Element.KA);
    expect(elementOf(k('水'))).toBe(Element.SUI);
    expect(elementOf(k('木'))).toBe(Element.MOKU);
    expect(elementOf(k('金'))).toBe(Element.KIN);
    expect(elementOf(k('山'))).toBe(Element.DO);
  });

  it('puts a kanji with no matching keyword in 無 rather than guessing', () => {
    // 不 means "not" — negation, which the table maps to 闇.
    expect(elementOf(k('不'))).toBe(Element.AN);
  });

  it('is stable across calls', () => {
    expect(elementOf(k('火'))).toBe(elementOf(k('火')));
  });
});

describe('effectiveness', () => {
  it('follows the five-phase cycle', () => {
    expect(effectiveness(Element.KA, Element.KIN)).toBe(2);
    expect(effectiveness(Element.KIN, Element.KA)).toBe(0.5);
    expect(effectiveness(Element.SUI, Element.KA)).toBe(2);
  });

  it('makes light and dark beat each other', () => {
    expect(effectiveness(Element.KOU, Element.AN)).toBe(2);
    expect(effectiveness(Element.AN, Element.KOU)).toBe(2);
  });

  it('leaves 無 neutral in both directions', () => {
    expect(effectiveness(Element.MU, Element.KA)).toBe(1);
    expect(effectiveness(Element.KA, Element.MU)).toBe(1);
  });
});

describe('forgeWeapon', () => {
  it('rejects a recipe that is not two or three kanji', () => {
    expect(forgeWeapon([k('火')])).toBeNull();
    expect(forgeWeapon([k('火'), k('山'), k('水'), k('木')])).toBeNull();
  });

  it('recognises a real compound and names the weapon after it', () => {
    const w = forgeWeapon([k('火'), k('山')])!;
    expect(w.compound?.word).toBe('火山');
    expect(w.compound?.reading).toBe('かざん');
    expect(w.plainName).toContain('火山');
    // The meaning is stated, because that is the point of the reward.
    expect(w.blurb).toContain(w.compound!.gloss);
  });

  it('still forges something from a combination that is not a word', () => {
    const w = forgeWeapon([k('山'), k('火')])!;
    expect(w.compound).toBeNull();
    expect(w.word).toBe('山火');
    expect(w.attack).toBeGreaterThan(0);
  });

  it('makes word order matter', () => {
    const a = forgeWeapon([k('火'), k('山')])!;
    const b = forgeWeapon([k('山'), k('火')])!;
    expect(a.id).not.toBe(b.id);
    expect(a.weaponClass).not.toBe(b.weaponClass);
    // The real word is the stronger of the two.
    expect(a.rarity).toBeGreaterThan(b.rarity);
  });

  it('takes its shape from the first kanji', () => {
    expect(forgeWeapon([k('火'), k('水')])!.weaponClass).toBe(WeaponClass.SWORD);
    expect(forgeWeapon([k('水'), k('火')])!.weaponClass).toBe(WeaponClass.BOW);
  });

  it('makes 無 kanji into Nexmax\'s robot weapons by the kind of word, never a shield', () => {
    // 2026-10-08「盾が 武器に なって いるのは 変」: a shield is worn, not swung.
    expect(Object.values(WeaponClass)).not.toContain('SHIELD');
    const shape = (c: string) => classOf(k(c));
    for (const c of '人父母友手足口男女子医者員') expect(shape(c), c).toBe(WeaponClass.FIST);
    for (const c of '一二三十百千万半毎何今昼晩曜') expect(shape(c), c).toBe(WeaponClass.GEAR);
    for (const c of '行来入出歩待送帰起休立話聞使') expect(shape(c), c).toBe(WeaponClass.DRILL);
    for (const c of '上下中外右左東西南北前後近') expect(shape(c), c).toBe(WeaponClass.CANNON);
    for (const c of '大小新古長短物') expect(shape(c), c).toBe(WeaponClass.MAGNET);
    expect(forgeWeapon([k('人'), k('口')])!.weaponClass).toBe(WeaponClass.FIST);
    expect(forgeWeapon([k('人'), k('口')])!.name).toBe('人口(じんこう)の ロケットパンチ');
  });

  it('spreads the route\'s kanji over many shapes, none of them most of the forge', () => {
    const route = MOJI_EPISODES.flatMap((e) => e.kanji).map(k);
    const count = new Map<string, number>();
    for (const kj of route) count.set(classOf(kj), (count.get(classOf(kj)) ?? 0) + 1);
    // Every robot weapon has a fair share of first kanji…
    for (const c of [WeaponClass.FIST, WeaponClass.GEAR, WeaponClass.DRILL, WeaponClass.CANNON, WeaponClass.MAGNET]) {
      expect(count.get(c) ?? 0, c).toBeGreaterThanOrEqual(12);
    }
    // …and no shape takes more than a fifth of them (無 as one shape took two in three).
    expect(Math.max(...count.values())).toBeLessThanOrEqual(route.length / 5);
  });

  it('is deterministic', () => {
    const a = forgeWeapon([k('日'), k('本')])!;
    const b = forgeWeapon([k('日'), k('本')])!;
    expect(a).toEqual(b);
  });

  it('only ever picks an icon that exists in the pool', () => {
    for (const first of ['火', '水', '木', '金', '山', '日', '人', '本']) {
      for (const second of ['山', '水', '火', '車', '気']) {
        const w = forgeWeapon([k(first), k(second)]);
        if (!w) continue;
        expect(ICON_POOL[w.weaponClass]).toContain(w.icon);
      }
    }
  });

  it('gives heavier characters heavier weapons within the same rarity', () => {
    // Both must be non-words for this to compare like with like — 一二 looks
    // like junk but is a real word (いちに), so it cannot be the light case.
    const light = forgeWeapon([k('人'), k('日')])!;
    const heavy = forgeWeapon([k('語'), k('読')])!;
    expect(light.compound).toBeNull();
    expect(heavy.compound).toBeNull();
    expect(heavy.weight).toBeGreaterThan(light.weight);
    expect(heavy.attack).toBeGreaterThan(light.attack);
  });
});

describe('a real word always beats a non-word', () => {
  // The rule the forge exists to teach. Three unrelated heavy characters used
  // to outrank 火山 and hit four times as hard; that must never come back.
  const REAL_WORDS: [string, string][] = [
    ['火', '山'],
    ['日', '本'],
    ['先', '生'],
    ['大', '学'],
    ['electric', ''], // placeholder replaced below
  ];
  REAL_WORDS.pop();

  const JUNK_TRIPLES: [string, string, string][] = [
    ['語', '読', '聞'],
    ['聞', '語', '読'],
    ['読', '聞', '語'],
    ['高', '校', '間'],
    ['電', '車', '語'],
  ];

  it('the specific case the player reported: 火山 beats 語読聞', () => {
    const word = forgeWeapon([k('火'), k('山')])!;
    const junk = forgeWeapon([k('語'), k('読'), k('聞')])!;
    expect(word.compound).not.toBeNull();
    expect(junk.compound).toBeNull();
    expect(word.rarity).toBeGreaterThan(junk.rarity);
    expect(word.attack).toBeGreaterThan(junk.attack);
  });

  it('holds for every real word against every junk triple', () => {
    const words = REAL_WORDS.map((chars) => forgeWeapon(chars.map(k))!).filter((w) => w.compound);
    const junk = JUNK_TRIPLES.map((chars) => forgeWeapon(chars.map(k))!);

    expect(words.length).toBeGreaterThan(0);
    expect(junk.every((j) => j.compound === null)).toBe(true);

    const weakestWord = Math.min(...words.map((w) => w.attack));
    const strongestJunk = Math.max(...junk.map((j) => j.attack));
    expect(weakestWord).toBeGreaterThan(strongestJunk);

    const lowestWordRarity = Math.min(...words.map((w) => w.rarity));
    const highestJunkRarity = Math.max(...junk.map((j) => j.rarity));
    expect(lowestWordRarity).toBeGreaterThan(highestJunkRarity);
  });

  it('never lets a non-word reach ★3, whatever it is made of', () => {
    // The heaviest characters in the set, in every arrangement.
    const heavy = ['語', '読', '聞', '電', '校', '験'].filter((c) => getKanjiByChar(c));
    for (const a of heavy) {
      for (const b of heavy) {
        if (a === b) continue;
        for (const c of [...heavy, null]) {
          const chars = c && c !== a && c !== b ? [a, b, c] : [a, b];
          const w = forgeWeapon(chars.map(k));
          if (!w || w.compound) continue;
          expect(w.rarity, `${w.word} should stay below ★3`).toBeLessThan(3);
          expect(w.attack, `${w.word} attack`).toBeLessThan(26);
        }
      }
    }
  });

  it('does not reward padding a pair out to a triple', () => {
    // Adding a third unrelated character must not make a non-word stronger.
    const pair = forgeWeapon([k('語'), k('読')])!;
    const padded = forgeWeapon([k('語'), k('読'), k('聞')])!;
    expect(pair.compound).toBeNull();
    expect(padded.compound).toBeNull();
    expect(padded.attack).toBeLessThanOrEqual(pair.attack);
  });
});

describe('icon pools', () => {
  it('names only icons that exist in react-icons/gi', async () => {
    // A typo here is invisible until a learner forges that exact recipe and
    // gets a blank square, so it is checked rather than trusted.
    const gi = await import('react-icons/gi');
    const missing = Object.values(ICON_POOL)
      .flat()
      .filter((name) => !(name in gi));
    expect(missing).toEqual([]);
  });

  it('has every pooled icon in the bundled registry', async () => {
    // The app imports icons by name from src/lib/gameIcons.ts rather than
    // wildcarding react-icons (which cost 6.5 MB of bundle). An icon added to
    // a pool but not regenerated into the registry renders as nothing, so the
    // two are checked against each other.
    const { GAME_ICONS } = await import('../gameIcons');
    const missing = Object.values(ICON_POOL)
      .flat()
      .filter((name) => !(name in GAME_ICONS));
    expect(missing, 'run: node scripts/build_icon_registry.mjs').toEqual([]);
  });
});

describe('discoverableCompounds', () => {
  it('lists only words the learner can actually write', () => {
    const owned = new Set(['火', '山', '水']);
    const found = discoverableCompounds(owned);
    expect(found.map((c) => c.word)).toContain('火山');
    // 日本 needs two kanji this learner does not own yet.
    expect(found.map((c) => c.word)).not.toContain('日本');
    expect(found.every((c) => [...c.word].every((ch) => owned.has(ch)))).toBe(true);
  });

  it('includes the everyday words a learner will obviously try', () => {
    // 先生 went missing once: EDICT lists an archaic fourth sense for it, and
    // the extractor judged the whole entry by that tag. A learner who forges
    // 先 + 生 and is told it is not a word loses trust in the whole mechanic,
    // so the obvious words are pinned here.
    const must = [
      '先生', '学生', '大学', '日本', '電車', '火山', '毎日', '時間',
      '今日', '名前', '会社', '午前', '午後', '半分', '友人',
    ];
    const owned = new Set(must.flatMap((w) => [...w]));
    const found = new Set(discoverableCompounds(owned).map((c) => c.word));
    const missing = must.filter((w) => !found.has(w));
    expect(missing).toEqual([]);
  });

  it('finds a worthwhile number of words from the N5 set alone', () => {
    const n5 = new Set(
      '一二七八九十人入三川山口土女子千万上下大小夕日月火水木父円本中五六分午今天友生母四左右北半目外出白年百休先名気虫見車毎体何来行西金雨学国東長食南前後時高校書話電読聞語間男',
    );
    // A learner who finishes the N5 arc should have a real hunt in the forge,
    // not a handful. Since 2026-09-23 every word is one a learner at this
    // level meets (JLPT N5–N2 lists), so the count is ~110, not the 347 of
    // the old frequency-only table — fewer, but all of them words to keep.
    expect(discoverableCompounds(n5).length).toBeGreaterThan(100);
  });
});

describe('太刀 — the one-kanji blade of 0話', () => {
  it('is named 一(いち)の 太刀(たち)', () => {
    expect(forgeSingleBlade(k('一')).name).toBe('一(いち)の 太刀(たち)');
  });

  it('never outranks anything the real forge makes', () => {
    const blade = forgeSingleBlade(k('一'));
    const weakestPair = forgeWeapon([k('一'), k('二')])!;
    expect(blade.rarity).toBe(1);
    expect(blade.attack).toBeLessThanOrEqual(weakestPair.attack);
  });

  it('is what a one-kanji recipe resolves to, and the real forge still refuses one', () => {
    expect(weaponOf([k('一')])?.name).toBe('一(いち)の 太刀(たち)');
    expect(forgeWeapon([k('一')])).toBeNull();
  });
});

describe('a made-up weapon’s name (2026-10-10)', () => {
  it('reads its kanji as 漢字やさん’s slots show them: 社 is しゃ, not やしろ, and never katakana', () => {
    const route = [...new Set(MOJI_EPISODES.flatMap((e) => e.kanji))];
    const bad: string[] = [];
    for (const a of route.slice(0, 40))
      for (const b of route.slice(0, 40)) {
        const w = forgeWeapon([k(a), k(b)]);
        if (!w || w.compound) continue;
        const want = `${a}${b}(${slotReadings([a, b]).join('')})`;
        if (!w.name.startsWith(want) || /[ァ-ヶ]\)/.test(w.name.split('の')[0])) bad.push(w.name);
      }
    expect(bad).toEqual([]);
    expect(forgeWeapon([k('社'), k('山')])?.name.startsWith('社山(しゃやま)')).toBe(true);
  });
});
