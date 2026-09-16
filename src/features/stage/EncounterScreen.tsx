import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { StageDef } from '../../data/stages';
import type { KanjiData } from '../../types/kanji';
import { RubyText } from '../../components/ui/Ruby';
import { GameIcon } from '../../components/ui/GameIcon';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { forgeWeapon, RARITY_LABEL } from '../../lib/forge/weapon';
import { ELEMENT_LABEL, effectiveness } from '../../lib/forge/elements';

/**
 * The beat between earning the kanji and fighting with them.
 *
 * Three jobs:
 *   1. Announce the opponent, so the fight never simply appears.
 *   2. Show what you are about to write, so the drill's payoff is visible.
 *   3. Let you pick a weapon — and say plainly whether it is strong or weak
 *      against this opponent, which is the moment the element chart becomes
 *      a decision rather than trivia.
 */

interface EncounterScreenProps {
  stage: StageDef;
  kanjiPool: KanjiData[];
  onFight: () => void;
  onForge: () => void;
  onBack: () => void;
}

export const EncounterScreen = ({ stage, kanjiPool, onFight, onForge, onBack }: EncounterScreenProps) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const weapons = useGameStore((s) => s.weapons);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);

  const forged = useMemo(
    () =>
      weapons
        .map((recipe) => {
          const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
          return kanji.length === recipe.kanjiIds.length ? forgeWeapon(kanji) : null;
        })
        .filter((w) => w != null)
        .sort((a, b) => b.attack - a.attack),
    [weapons],
  );

  const equipped = forged.find((w) => w.id === equippedId) ?? null;
  const matchup = equipped ? effectiveness(equipped.element, stage.boss.element) : 1;
  const bossEl = ELEMENT_LABEL[stage.boss.element];

  return (
    <div className="g-stage relative flex min-h-dvh flex-col">
      <img
        src={assetPath(`img/bg/${stage.bg}.webp`)}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        style={{ filter: 'blur(6px)', transform: 'scale(1.06)' }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
        {/* 相手 ---------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="g-panel-solid p-5 text-center"
        >
          <p className="g-eyebrow" style={{ color: 'var(--color-danger)' }}>
            <RubyText showFurigana={showFurigana}>あいてが あらわれた</RubyText>
          </p>
          <span
            className="mx-auto my-3 flex h-24 w-24 items-center justify-center rounded-3xl"
            style={{ background: `${bossEl.color}22`, color: bossEl.color }}
          >
            <GameIcon name={stage.boss.icon} size={60} fallback="☠" />
          </span>
          <p className="g-title text-lg">
            <RubyText showFurigana={showFurigana}>{stage.boss.name}</RubyText>
          </p>
          <p className="mt-1 flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--ink-2)' }}>
            <span className="tabular-nums">HP {stage.boss.hp}</span>
            <span className="g-chip !py-0.5" style={{ color: bossEl.color }}>
              <RubyText showFurigana={showFurigana}>{`${bossEl.ja}(${bossEl.reading})`}</RubyText>
            </span>
          </p>
        </motion.div>

        {/* 書く漢字 ------------------------------------------------------ */}
        <div className="g-panel mt-3 p-3">
          <p className="g-eyebrow mb-2">
            <RubyText showFurigana={showFurigana}>この 漢字(かんじ)で たたかいます</RubyText>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {kanjiPool.map((kj) => (
              <span key={kj.id} className="g-chip !px-2.5 !py-1 text-lg font-black">
                {kj.char}
              </span>
            ))}
          </div>
        </div>

        {/* 武器 ---------------------------------------------------------- */}
        <div className="g-panel mt-3 p-3">
          <p className="g-eyebrow mb-2">
            <RubyText showFurigana={showFurigana}>武器(ぶき)を えらぶ</RubyText>
          </p>

          {forged.length === 0 ? (
            <>
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  まだ 武器(ぶき)が ありません。素手(すで)でも たたかえますが、とても 弱(よわ)いです。
                </RubyText>
              </p>
              <button type="button" className="g-btn g-btn-accent mt-2 w-full" onClick={onForge}>
                <RubyText showFurigana={showFurigana}>漢字(かんじ)を あわせて 武器(ぶき)を 作(つく)る</RubyText>
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {forged.slice(0, 8).map((w) => {
                  const on = w.id === equippedId;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => equipWeapon(w.id)}
                      aria-pressed={on}
                      className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl p-2"
                      style={{
                        background: on ? 'var(--accent)' : 'var(--panel-solid)',
                        color: on ? '#fff' : 'var(--ink)',
                        border: `2px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                      }}
                    >
                      <GameIcon name={w.icon} size={26} />
                      <span className="w-full truncate text-[10px] font-bold">{w.word}</span>
                      <span className="text-[10px] tabular-nums">
                        {RARITY_LABEL[w.rarity].ja} {w.attack}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 相性を はっきり 言う ------------------------------------- */}
              {equipped && (
                <p
                  className="mt-2 rounded-lg px-3 py-2 text-xs"
                  style={{
                    background:
                      matchup > 1
                        ? 'rgba(63,191,116,0.16)'
                        : matchup < 1
                          ? 'rgba(255,107,125,0.16)'
                          : 'var(--panel)',
                    color: 'var(--ink-2)',
                  }}
                >
                  <RubyText showFurigana={showFurigana}>
                    {matchup > 1
                      ? `この 武器(ぶき)は ${bossEl.ja}(${bossEl.reading})に 強(つよ)い。ダメージが 2(に)ばい。`
                      : matchup < 1
                        ? `この 武器(ぶき)は ${bossEl.ja}(${bossEl.reading})に 弱(よわ)い。ダメージが 半分(はんぶん)。ほかの 武器(ぶき)の ほうが いいかも。`
                        : `この 武器(ぶき)と ${bossEl.ja}(${bossEl.reading})は ふつうの 相性(あいしょう)。`}
                  </RubyText>
                </p>
              )}

              <button type="button" className="g-btn g-btn-ghost mt-2 w-full !min-h-[40px] text-xs" onClick={onForge}>
                <RubyText showFurigana={showFurigana}>もっと 作(つく)る（合成(ごうせい)）</RubyText>
              </button>
            </>
          )}
        </div>

        {/* 進む ---------------------------------------------------------- */}
        <div className="mt-auto flex gap-2 pt-4">
          <button type="button" className="g-btn g-btn-ghost !px-5" onClick={onBack}>
            もどる
          </button>
          <button type="button" className="g-btn g-btn-primary flex-1 text-lg" onClick={onFight}>
            <RubyText showFurigana={showFurigana}>たたかう！</RubyText>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncounterScreen;
