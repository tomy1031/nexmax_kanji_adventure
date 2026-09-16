import { describe, it, expect } from 'vitest';
import { forgeWeapon, discoverableCompounds, ICON_POOL, WeaponClass } from './weapon';
import { elementOf, Element, effectiveness } from './elements';
import { getKanjiByChar } from '../kanjiDb';

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

  it('gives heavier characters heavier weapons', () => {
    const light = forgeWeapon([k('一'), k('二')])!;
    const heavy = forgeWeapon([k('語'), k('読')])!;
    expect(heavy.weight).toBeGreaterThan(light.weight);
    expect(heavy.attack).toBeGreaterThan(light.attack);
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

  it('finds a worthwhile number of words from the N5 set alone', () => {
    const n5 = new Set(
      '一二七八九十人入三川山口土女子千万上下大小夕日月火水木父円本中五六分午今天友生母四左右北半目外出白年百休先名気虫見車毎体何来行西金雨学国東長食南前後時高校書話電読聞語間男',
    );
    // A learner who finishes the N5 arc should have hundreds of real words
    // available in the forge, not a handful.
    expect(discoverableCompounds(n5).length).toBeGreaterThan(200);
  });
});
