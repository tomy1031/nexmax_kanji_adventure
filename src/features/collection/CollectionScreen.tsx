import { useMemo, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { weaponOf, RARITY_LABEL, CLASS_LABEL } from '../../lib/forge/weapon';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { INDIVIDUALS, getIndividual } from '../../data/individuals';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { rustLevel } from '../../lib/srs';
import { GameIcon } from '../../components/ui/GameIcon';

/** Inventory: what has been forged, and who is in the party. */

type Tab = 'weapons' | 'individuals';

export const CollectionScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const weapons = useGameStore((s) => s.weapons);
  const equipped = useGameStore((s) => s.equippedWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const ownedIndividuals = useGameStore((s) => s.individuals);
  const active = useGameStore((s) => s.activeIndividual);
  const setActive = useGameStore((s) => s.setActiveIndividual);
  const progress = useGameStore((s) => s.progress);

  const [tab, setTab] = useState<Tab>('weapons');

  const forged = useMemo(
    () =>
      weapons
        .map((recipe) => {
          const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
          if (kanji.length !== recipe.kanjiIds.length) return null;
          const weapon = weaponOf(kanji);
          if (!weapon) return null;
          const rust = Math.max(...recipe.kanjiIds.map((id) => rustLevel(progress[id])), 0);
          return { weapon, rust };
        })
        .filter((w) => w != null)
        .sort((a, b) => b.weapon.rarity - a.weapon.rarity || b.weapon.attack - a.weapon.attack),
    [weapons, progress],
  );

  return (
    <div className="g-stage min-h-dvh pb-8">
      <Backdrop fixed />
      <header
        className="g-header sticky top-0 z-20 px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={() => navigate(mapPath)}>
            <span aria-hidden>◀</span>もどる
          </button>
          <h1 className="g-title text-base">
            <RubyText showFurigana={showFurigana}>図鑑(ずかん)</RubyText>
          </h1>
          <span className="w-16" />
        </div>
        <div className="mt-2 flex gap-2">
          {(
            [
              ['weapons', '武器(ぶき)', forged.length],
              ['individuals', 'なかま', `${ownedIndividuals.length}/${INDIVIDUALS.length}`],
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
                <RubyText showFurigana={showFurigana}>合成(ごうせい)へ</RubyText>
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
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
                        <GameIcon name={weapon.icon} size={28} />
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

        {tab === 'individuals' && (
          <ul className="grid grid-cols-2 gap-2">
            {INDIVIDUALS.map((ind) => {
              const have = ownedIndividuals.includes(ind.id);
              const isActive = active === ind.id;
              return (
                <li key={ind.id}>
                  <button
                    type="button"
                    disabled={!have}
                    onClick={() => setActive(ind.id)}
                    className="g-panel flex w-full flex-col items-center gap-1 p-3 disabled:opacity-45"
                    style={{ borderColor: isActive ? 'var(--accent)' : undefined }}
                  >
                    <img
                      src={assetPath(have ? ind.art : ind.emblem)}
                      alt=""
                      aria-hidden
                      className="h-24 object-contain"
                      style={{ filter: have ? undefined : 'grayscale(1) opacity(0.5)' }}
                    />
                    <p className="g-title text-center text-xs leading-snug">
                      {have ? (
                        <RubyText showFurigana={showFurigana}>{ind.name}</RubyText>
                      ) : (
                        <span style={{ color: 'var(--ink-3)' }}>？？？</span>
                      )}
                    </p>
                    {have && (
                      <p className="text-[10px]" style={{ color: 'var(--ink-2)' }}>
                        <RubyText showFurigana={showFurigana}>
                          {`${CLASS_LABEL[ind.favours].ja}(${CLASS_LABEL[ind.favours].reading}) +${ind.bonus}%`}
                        </RubyText>
                      </p>
                    )}
                    {isActive && (
                      <span className="g-chip !py-0.5 text-[10px]" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>
                        いっしょに いる
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'individuals' && active && (
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              {getIndividual(active)?.tagline ?? ''}
            </RubyText>
          </p>
        )}
      </div>
    </div>
  );
};

export default CollectionScreen;
