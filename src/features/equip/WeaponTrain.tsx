import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KanjiWriterCanvas from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { kanjiRuby, primaryReading } from '../../lib/reading';
import { FORGE_LEVEL_STEPS, FORGE_MAX, forgeLevel, pointsToNext, weaponFromRecipe, weaponWord } from '../../lib/forge/recipe';
import { WeaponMount } from '../battle/WeaponMount';
import * as sfx from '../../lib/sfx';

/**
 * 強化 — make a weapon stronger by writing its kanji (docs/design/11 §6, 05 §2.2).
 *
 * The word's reading and meaning are shown, its characters are not: each is
 * written from memory, and every one written without a slip is a point. Once
 * a day per weapon — writing the same character thirty times in a day adds
 * little to memory; coming back tomorrow does. Each write is also a review of
 * the kanji (recordReview), so its rust comes off at the same time.
 */
export const WeaponTrain = ({ recipeId, onClose }: { recipeId: string; onClose: () => void }) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const recipe = useGameStore((s) => s.weapons.find((w) => w.id === recipeId));
  const recordReview = useGameStore((s) => s.recordReview);
  const trainWeapon = useGameStore((s) => s.trainWeapon);
  const [canToday] = useState(() => useGameStore.getState().canTrainToday(recipeId));
  const kanji = useMemo(() => (recipe ? recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null) : []), [recipe]);
  const weapon = recipe ? weaponFromRecipe(recipe) : null;

  const [idx, setIdx] = useState(0);
  const [gained, setGained] = useState(0);
  const [last, setLast] = useState<{ n: number; clean: boolean } | null>(null);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  if (!recipe || !weapon) return null;
  const points = result ? result.after : (recipe.points ?? 0);
  const level = forgeLevel(points);
  const toNext = pointsToNext(points);
  const target = kanji[idx];

  const onComplete = ({ totalMistakes }: { totalMistakes: number }) => {
    if (!target) return;
    const clean = totalMistakes === 0;
    recordReview(target.id, totalMistakes);
    if (clean) sfx.chime();
    else sfx.clang();
    const g = gained + (clean ? 1 : 0);
    setGained(g);
    setLast({ n: idx, clean });
    if (idx + 1 < kanji.length) {
      setTimeout(() => setIdx(idx + 1), 700);
      return;
    }
    const r = trainWeapon(recipeId, g);
    setTimeout(() => {
      setResult(r ?? { before: recipe.points ?? 0, after: recipe.points ?? 0 });
      if (r && forgeLevel(r.after) > forgeLevel(r.before)) sfx.fanfare();
      else sfx.star(1);
    }, 700);
  };

  const up = result != null && forgeLevel(result.after) > forgeLevel(result.before);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto bg-[#140c06]/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))] text-[#fff1cf]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-label="武器の 強化"
    >
      <div className="flex w-full max-w-sm items-center justify-between">
        <p className="text-lg font-black">
          ⚒ <RubyText showFurigana={showFurigana}>強化(きょうか)</RubyText>
        </p>
        <button type="button" className="g-btn g-btn-ghost !min-h-[36px] !px-3 text-xs" onClick={onClose}>
          とじる
        </button>
      </div>

      {/* the weapon, as it looks mounted */}
      <div className="relative mt-2 h-44 w-44 [container-type:inline-size]">
        <WeaponMount
          m={{ cls: weapon.weaponClass, element: weapon.element, rarity: weapon.rarity, level, word: weaponWord(weapon) }}
          fire={result ? 1 : undefined}
          still={false}
          showFurigana={showFurigana}
          tag={false}
        />
      </div>
      <p className="text-sm font-black">
        <RubyText showFurigana={showFurigana}>{weapon.name}</RubyText>
      </p>
      {/* the level and the way to the next */}
      <div className="mt-1 flex w-full max-w-xs items-center gap-2 text-xs font-black">
        <span className="text-[#ffd36a]">⚒ Lv{level}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-[#ffd36a]"
            animate={{ width: `${Math.min(100, (points / FORGE_LEVEL_STEPS[FORGE_MAX - 1]) * 100)}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <span className="tabular-nums">
          {toNext == null ? 'MAX' : <RubyText showFurigana={showFurigana}>{`あと ${toNext}`}</RubyText>}
        </span>
      </div>

      {!canToday && !result ? (
        <p className="mt-6 max-w-xs text-center text-sm leading-relaxed">
          <RubyText showFurigana={showFurigana}>きょうは もう 強化(きょうか) しました。あした また 書(か)こう。日(ひ)を あけて 書(か)くと、よく おぼえられます。</RubyText>
        </p>
      ) : result ? (
        <motion.div className="mt-6 flex flex-col items-center gap-2 text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <p className="text-2xl font-black text-[#ffd36a]">⚒ ＋{result.after - result.before}</p>
          {up && (
            <motion.p
              className="g-outline-text text-3xl font-black text-white"
              initial={{ scale: 2, rotate: -8 }}
              animate={{ scale: 1, rotate: -4 }}
              transition={{ type: 'spring', stiffness: 380, damping: 12 }}
            >
              Lv{forgeLevel(result.before)} → Lv{forgeLevel(result.after)}！
            </motion.p>
          )}
          <p className="text-xs">
            <RubyText showFurigana={showFurigana}>{up ? 'こうげきが 上(あ)がった！ 見(み)た目(め)も かわります。' : '一発(いっぱつ)で 書(か)けた 字(じ)だけ 点(てん)に なります。'}</RubyText>
          </p>
          <button type="button" className="g-btn g-btn-primary mt-2 w-56" onClick={onClose}>
            OK
          </button>
        </motion.div>
      ) : (
        target && (
          <>
            {/* the word: what is being written is a box; the others are as written */}
            <p className="mt-4 text-xs font-bold opacity-80">
              <RubyText showFurigana={showFurigana}>{`${kanji.length}字(じ)の うち ${idx + 1}字(じ)め ・ 手本(てほん)なしで 書(か)く`}</RubyText>
            </p>
            <p className="mt-1 flex items-end gap-1 text-3xl font-black">
              {kanji.map((k, i) => (
                <span key={k.id} className={i === idx ? 'inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-[#ffd36a] text-base' : ''}>
                  {i === idx ? '？' : <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText>}
                </span>
              ))}
            </p>
            <p className="mt-1 text-sm">
              {weapon.compound ? (
                <>
                  <RubyText showFurigana={showFurigana}>{`よみ：${weapon.compound.reading}`}</RubyText>
                  <span className="ml-2 opacity-75">{weapon.compound.gloss}</span>
                </>
              ) : (
                <>
                  <RubyText showFurigana={showFurigana}>{`よみ：${primaryReading(target)}`}</RubyText>
                  <span className="ml-2 opacity-75">{target.meanings.slice(0, 2).join(', ')}</span>
                </>
              )}
            </p>
            <div className="relative mt-3 rounded-2xl bg-[#f7eacb]">
              <KanjiWriterCanvas key={`${target.id}-${idx}`} char={target.char} size={240} quizMode surface="ink" onCorrectStroke={() => sfx.neon(0.35)} onMistake={() => sfx.fizz()} onComplete={onComplete} />
              <AnimatePresence>
                {last && (
                  <motion.span
                    key={last.n}
                    className="g-outline-text pointer-events-none absolute inset-x-0 top-2 text-center text-2xl font-black"
                    style={{ color: last.clean ? '#ffd36a' : '#e8e0d4' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: [0, 1, 1, 0], y: 0 }}
                    transition={{ duration: 1.1 }}
                  >
                    {last.clean ? '⚒ ＋1' : 'おしい！'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </>
        )
      )}
    </motion.div>
  );
};
