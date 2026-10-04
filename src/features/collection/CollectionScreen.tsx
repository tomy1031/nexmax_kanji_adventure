import { useMemo, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { RARITY_LABEL } from '../../lib/forge/weapon';
import { weaponArt, weaponFromRecipe } from '../../lib/forge/recipe';
import { assetPath } from '../../lib/assetPath';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { CARDS } from '../../data/individuals';
import { CompanionBook } from './CompanionBook';
import { RubyText } from '../../components/ui/Ruby';
import { rustLevel } from '../../lib/srs';
import { GameIcon } from '../../components/ui/GameIcon';
import { useCompoundsVersion } from '../../data/compounds';
import { sortWeapons, useWeaponSort } from '../../lib/forge/weaponSort';
import { WeaponSortBar, WeaponTags } from '../equip/WeaponSortBar';
import { HIDDEN_WEAPONS } from '../../data/hiddenWeapons';

/** Inventory: what has been forged, and who is in the party. */

type Tab = 'weapons' | 'individuals';

export const CollectionScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const moji = useGameStore((st) => st.lastArc) === 'moji';
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const weapons = useGameStore((s) => s.weapons);
  const equipped = useGameStore((s) => s.equippedWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const ownedIndividuals = useGameStore((s) => s.individuals);
  const progress = useGameStore((s) => s.progress);

  const [tab, setTab] = useState<Tab>('weapons');

  // The forge's words beyond the core arrive just after start (data/compounds.ts): read again then.
  const wordsV = useCompoundsVersion();
  const [weaponSort, setWeaponSort] = useWeaponSort();
  const forged = useMemo(() => {
    const rustOf = new Map<string, number>();
    const list = weapons
      .map((recipe) => {
        const weapon = weaponFromRecipe(recipe);
        if (weapon) rustOf.set(weapon.id, Math.max(...recipe.kanjiIds.map((id) => rustLevel(progress[id])), 0));
        return weapon;
      })
      .filter((w) => w != null);
    return sortWeapons(list, weaponSort, new Map(weapons.map((r) => [r.id, r.craftedAt]))).map((weapon) => ({ weapon, rust: rustOf.get(weapon.id) ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weapons, progress, wordsV, weaponSort]);
  const hiddenFound = forged.filter((f) => f.weapon.hidden).length;

  return (
    <div className="g-stage min-h-dvh pb-8">
      {/* The world being played behind it: the night town on 文字が 消えた 町 (08 §3.8). */}
      {moji ? <NightStreetBackdrop /> : <Backdrop fixed />}
      <header
        className="g-header sticky top-0 z-20 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3"
      >
        <div className="flex items-center justify-between">
          <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={() => navigate(mapPath)}>
            <span aria-hidden>◀</span>もどる
          </button>
          <h1 className="g-title text-center text-base leading-tight">
            <RubyText showFurigana={showFurigana}>図鑑(ずかん)</RubyText>
            <span lang="en" className="block text-[10px] font-bold opacity-80">
              Collection
            </span>
          </h1>
          <span className="w-16" />
        </div>
        <div className="mt-2 flex gap-2">
          {(
            [
              ['weapons', '武器(ぶき)', forged.length],
              ['individuals', 'なかま', `${ownedIndividuals.length}/${CARDS.length}`],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className="g-btn flex-1 !min-h-[40px] text-sm"
              style={{
                background: tab === id ? 'var(--accent)' : 'var(--panel-solid)',
                color: tab === id ? '#fff' : 'var(--ink)',
              }}
            >
              <RubyText showFurigana={showFurigana}>{label}</RubyText>
              <span className="ml-1 tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        {tab === 'weapons' &&
          (forged.length === 0 ? (
            <div className="g-panel p-6 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                まだ 武器(ぶき)が ありません。漢字(かんじ)を 2(ふた)つ あわせて 作(つく)りましょう。
              </RubyText>
              <button type="button" className="g-btn g-btn-primary mt-4 w-full" onClick={() => navigate('/forge')}>
                {/* On 文字が 消えた 町 the forge is 漢字やさん, as the story calls it. */}
                {moji ? (
                  <>
                    🔨 <RubyText showFurigana={showFurigana}>漢字(かんじ)やさんへ</RubyText>
                  </>
                ) : (
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)へ</RubyText>
                )}
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              <li className="flex flex-col gap-2">
                <WeaponSortBar sort={weaponSort} onSort={setWeaponSort} showFurigana={showFurigana} />
                {/* かくし武器: how many there are is told, which words is not (data/hiddenWeapons.ts). */}
                <p className="g-panel self-start px-3 py-1 text-[12px] font-black" style={{ color: 'var(--ink)' }}>
                  🔑 <RubyText showFurigana={showFurigana}>{`かくし武器(ぶき) ${hiddenFound} / ${Object.keys(HIDDEN_WEAPONS).length} ・ どの 話(わ)にも 1(ひと)つ あります`}</RubyText>
                </p>
              </li>
              {forged.map(({ weapon, rust }) => {
                const isEquipped = equipped === weapon.id;
                return (
                  <li key={weapon.id}>
                    <button
                      type="button"
                      onClick={() => equipWeapon(weapon.id)}
                      className="g-panel flex w-full items-center gap-3 p-3 text-left"
                      style={{ borderColor: isEquipped ? 'var(--accent)' : undefined }}
                    >
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: `${ELEMENT_LABEL[weapon.element].color}22`,
                          color: ELEMENT_LABEL[weapon.element].color,
                          filter: rust > 0.3 ? 'grayscale(0.6)' : undefined,
                        }}
                      >
                        {moji ? (
                          <img src={assetPath(weaponArt(weapon.weaponClass, weapon.rarity))} alt="" aria-hidden className="h-11 w-11 object-contain" />
                        ) : (
                          <GameIcon name={weapon.icon} size={28} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="g-title truncate text-sm">
                          <RubyText showFurigana={showFurigana}>{weapon.name}</RubyText>
                        </p>
                        <p className="text-[11px] tabular-nums" style={{ color: 'var(--ink-2)' }}>
                          <span style={{ color: RARITY_LABEL[weapon.rarity].color }}>
                            {RARITY_LABEL[weapon.rarity].ja}
                          </span>
                          <span className="mx-1.5" aria-hidden>·</span>
                          こうげき {weapon.attack}
                          {(weapon.level ?? 0) > 0 && <span className="ml-1.5 font-black text-[#b0741a]">⚒{weapon.level}</span>}
                          <WeaponTags w={weapon} showFurigana={showFurigana} />
                        </p>
                        {rust > 0.3 && (
                          <p className="text-[11px]" style={{ color: 'var(--color-danger)' }}>
                            <RubyText showFurigana={showFurigana}>さびて います（復習(ふくしゅう)で 直(なお)る）</RubyText>
                          </p>
                        )}
                      </div>
                      {isEquipped && (
                        <span className="g-chip !py-0.5 text-[11px]" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>
                          <RubyText showFurigana={showFurigana}>そうび中(ちゅう)</RubyText>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === 'individuals' && <CompanionBook showFurigana={showFurigana} />}
      </div>
    </div>
  );
};

export default CollectionScreen;
