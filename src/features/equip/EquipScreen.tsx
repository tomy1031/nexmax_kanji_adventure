import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { GameIcon } from '../../components/ui/GameIcon';
import { BottomTabs, LogoTitle, TopBar } from '../../components/ui/Chrome';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../data/kanji.generated';
import { GEAR, SLOT_LABEL, getGear, missingFor, type GearItem, type GearSlot } from '../../data/equipment';
import { getKanjiById } from '../../lib/kanjiDb';
import { weaponOf, RARITY_LABEL } from '../../lib/forge/weapon';
import { statsFromGear } from '../../lib/battle';
import { charRuby } from '../../lib/reading';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import { Feature, isFeatureUnlocked } from '../../data/unlocks';
import * as sfx from '../../lib/sfx';
import PictureBook from '../picturebook/PictureBook';

/**
 * そうび (public/img/design/ネクマックスのそうび画面.png).
 *
 * Four slots around Nexmax — 武器・盾・からだ・アクセサリ — and what they add
 * up to. Tap a slot to list what fits it. A shield, armour or charm that is
 * not made yet shows the characters it is made of: gold for the ones owned,
 * dashed for the ones still to learn. That list is the game's promise in one
 * picture: learn a character, wear something new.
 */

type Slot = 'weapon' | GearSlot;
const SLOTS: { slot: Slot; icon: string; pos: string }[] = [
  { slot: 'weapon', icon: 'GiBroadsword', pos: 'top-2 left-2' },
  { slot: 'shield', icon: 'GiRoundShield', pos: 'top-2 right-2' },
  { slot: 'body', icon: 'GiLeatherArmor', pos: 'bottom-2 left-2' },
  { slot: 'charm', icon: 'GiEyeTarget', pos: 'bottom-2 right-2' },
];

export const EquipScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const weapons = useGameStore((s) => s.weapons);
  const equippedWeapon = useGameStore((s) => s.equippedWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const gear = useGameStore((s) => s.gear);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const makeGear = useGameStore((s) => s.makeGear);
  const equipGear = useGameStore((s) => s.equipGear);
  const progress = useGameStore((s) => s.progress);
  const cleared = useGameStore((s) => s.clearedStages);

  const [slot, setSlot] = useState<Slot>('weapon');
  const [showAll, setShowAll] = useState(false);

  const owned = useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char)),
    [progress],
  );

  const forged = useMemo(
    () =>
      weapons
        .map((r) => {
          const ks = r.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
          return ks.length === r.kanjiIds.length ? weaponOf(ks) : null;
        })
        .filter((w) => w != null)
        .sort((a, b) => b.attack - a.attack),
    [weapons],
  );

  const weapon = forged.find((w) => w.id === equippedWeapon) ?? null;
  const worn = Object.values(equippedGear)
    .map((id) => getGear(id))
    .filter((g) => g != null);
  const stats = statsFromGear(worn);

  // A stage's gear is shown once the learner has reached that stage.
  const reached = new Set(['mukashi-1', ...cleared, ...cleared.map((id) => id.replace(/\d+$/, (n) => String(Number(n) + 1)))]);
  const inView = (g: GearItem) => reached.has(g.stage);

  const slotItem = (s: Slot) => (s === 'weapon' ? (weapon ? { name: weapon.name, icon: weapon.icon } : null) : getGear(equippedGear[s]));

  const make = (g: GearItem) => {
    if (makeGear(g.id)) {
      sfx.slash(0.8);
      setTimeout(() => sfx.chime(), 200);
    }
  };

  return (
    <div className="isolate relative min-h-dvh pb-28">
      <PictureBook scene="mukashi_meadow" className="!fixed -z-10" />
      <div className="relative z-10">
        <TopBar />
        <div className="mx-auto max-w-md px-3 pt-1">
          <LogoTitle size={30} sub="字(じ)の 力(ちから)で もっと つよく">そうび</LogoTitle>

          {/* ネクマックスと 4つの わく ----------------------------------- */}
          <div className="relative mx-auto mt-2 h-[230px] w-full max-w-sm">
            <motion.img
              src={assetPath('img/chara/cut/guide.webp')}
              alt=""
              aria-hidden
              className="absolute bottom-3 left-1/2 h-[190px] -translate-x-1/2"
              style={{ filter: 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 8px 10px rgba(0,0,0,0.3))' }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
            {SLOTS.map(({ slot: s, icon, pos }) => {
              const item = slotItem(s);
              const on = s === slot;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  aria-pressed={on}
                  className={`absolute ${pos} flex h-[88px] w-[88px] flex-col items-center justify-center gap-0.5 rounded-2xl border-[3px] text-[10px] leading-tight font-black`}
                  style={{
                    background: 'linear-gradient(180deg,#e9f6ff,#bfe2fb)',
                    borderColor: on ? '#ffd24a' : '#fff',
                    boxShadow: on ? '0 0 16px rgba(255,210,90,0.9)' : '0 4px 10px rgba(0,40,90,0.25)',
                    color: '#1b4f8a',
                  }}
                >
                  <span style={{ color: item ? '#7a4a26' : 'rgba(27,79,138,0.35)' }}>
                    <GameIcon name={item?.icon ?? icon} size={34} />
                  </span>
                  <RubyText showFurigana={showFurigana}>{SLOT_LABEL[s]}</RubyText>
                </button>
              );
            })}
          </div>

          {/* ステータス ---------------------------------------------------- */}
          <div className="g-parchment grid grid-cols-2 gap-x-4 px-4 py-2 text-sm font-black">
            <span>❤ HP {stats.maxHp}</span>
            <span>
              ⚔ <RubyText showFurigana={showFurigana}>こうげき</RubyText> {weapon?.attack ?? 5}
              {stats.attackPct > 0 && <span className="text-xs" style={{ color: '#b0741a' }}> ＋{stats.attackPct}%</span>}
            </span>
            <span>🛡 ぼうぎょ {stats.defense}</span>
            <span>
              <RubyText showFurigana={showFurigana}>✋ がまん</RubyText> ＋{stats.patience}
            </span>
          </div>

          {/* 一覧 ------------------------------------------------------------ */}
          <div className="mt-3 flex items-center gap-2">
            <p className="g-wood px-3 py-0.5 text-sm font-black">
              <RubyText showFurigana={showFurigana}>{SLOT_LABEL[slot]}</RubyText>
            </p>
            {slot !== 'weapon' && (
              <button
                type="button"
                className="ml-auto rounded-full border-2 border-white bg-[#23456e]/80 px-3 py-0.5 text-xs font-black text-white"
                onClick={() => setShowAll((v) => !v)}
              >
                <RubyText showFurigana={showFurigana}>{showAll ? 'いま 見(み)える もの' : 'ぜんぶ 見(み)る'}</RubyText>
              </button>
            )}
          </div>

          <ul className="mt-2 flex flex-col gap-2">
            {slot === 'weapon' &&
              (forged.length === 0 ? (
                <li className="g-parchment p-3 text-sm">
                  <RubyText showFurigana={showFurigana}>まだ 武器(ぶき)が ありません。</RubyText>
                </li>
              ) : (
                forged.map((w) => {
                  const on = w.id === equippedWeapon;
                  return (
                    <li key={w.id} className="g-parchment flex items-center gap-3 p-2.5" style={on ? { borderColor: '#2f8fe0' } : undefined}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70" style={{ color: '#7a4a26' }}>
                        <GameIcon name={w.icon} size={30} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          <RubyText showFurigana={showFurigana}>{w.name}</RubyText>
                        </p>
                        <p className="text-[11px]">
                          <span style={{ color: RARITY_LABEL[w.rarity].color }}>{RARITY_LABEL[w.rarity].ja}</span> こうげき ＋{w.attack}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={on}
                        className="g-btn g-btn-accent !min-h-[36px] !px-3 text-xs"
                        onClick={() => equipWeapon(w.id)}
                      >
                        <RubyText showFurigana={showFurigana}>{on ? 'そうび中(ちゅう)' : 'そうびする'}</RubyText>
                      </button>
                    </li>
                  );
                })
              ))}

            {slot !== 'weapon' &&
              GEAR.filter((g) => g.slot === slot)
                .filter((g) => showAll || inView(g))
                .map((g) => {
                  const made = gear.includes(g.id);
                  const on = equippedGear[g.slot] === g.id;
                  const missing = missingFor(g, owned);
                  const visible = inView(g);
                  return (
                    <li key={g.id} className="g-parchment flex items-center gap-3 p-2.5" style={on ? { borderColor: '#2f8fe0' } : undefined}>
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70"
                        style={{ color: made ? '#7a4a26' : 'rgba(122,74,38,0.35)' }}
                      >
                        <GameIcon name={g.icon} size={30} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">
                          {visible ? <RubyText showFurigana={showFurigana}>{g.name}</RubyText> : '？？？'}
                        </p>
                        {visible ? (
                          <>
                            <p className="text-[11px] leading-[1.8]">
                              <RubyText showFurigana={showFurigana}>{g.blurb}</RubyText>
                            </p>
                            {!made && (
                              <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-bold">
                                <RubyText showFurigana={showFurigana}>いる 字(じ)：</RubyText>
                                {g.kanji.map((c) => (
                                  <span
                                    key={c}
                                    className="rounded border px-1 text-sm leading-[1.8]"
                                    style={
                                      missing.includes(c)
                                        ? { borderStyle: 'dashed', borderColor: '#b0741a', opacity: 0.7 }
                                        : { background: 'linear-gradient(160deg,#fffbe8,#ffe7a3)', borderColor: '#f2b53a' }
                                    }
                                  >
                                    <RubyText showFurigana={showFurigana}>{charRuby(c)}</RubyText>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px]">
                            <RubyText showFurigana={showFurigana}>{`${g.stage.replace('mukashi-', '')}話(わ)まで すすむと わかる`}</RubyText>
                          </p>
                        )}
                      </div>
                      {visible &&
                        (made ? (
                          <button
                            type="button"
                            className="g-btn g-btn-accent !min-h-[36px] !px-3 text-xs"
                            onClick={() => equipGear(g.slot, on ? null : g.id)}
                          >
                            {on ? 'はずす' : 'そうびする'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={missing.length > 0}
                            className="g-btn g-btn-primary !min-h-[36px] !px-3 text-xs"
                            onClick={() => make(g)}
                          >
                            <RubyText showFurigana={showFurigana}>作(つく)る</RubyText>
                          </button>
                        ))}
                    </li>
                  );
                })}
          </ul>

          {isFeatureUnlocked(Feature.COLLECTION, cleared) && (
            <button type="button" className="g-btn g-btn-slate mt-4 w-full" onClick={() => navigate('/collection')}>
              <RubyText showFurigana={showFurigana}>図鑑(ずかん)（なかま）を 見(み)る</RubyText>
            </button>
          )}
        </div>
      </div>
      <BottomTabs current="items" />
    </div>
  );
};

export default EquipScreen;
