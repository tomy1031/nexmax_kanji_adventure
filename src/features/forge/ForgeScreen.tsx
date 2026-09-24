import { useMemo, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { forgeWeapon, RARITY_LABEL, type Weapon } from '../../lib/forge/weapon';
import { ELEMENT_LABEL, elementOf } from '../../lib/forge/elements';
import { kanjiRuby } from '../../lib/reading';
import { RubyText } from '../../components/ui/Ruby';
import type { KanjiData } from '../../types/kanji';
import { GameIcon } from '../../components/ui/GameIcon';
import ForgeTutorial from './ForgeTutorial';
import { remainingForChar, FoundVia, discoveryKind, KIND_LABEL } from '../../lib/forge/discovery';
import { REPS_TO_OBTAIN } from '../../types/kanji';

/**
 * The forge.
 *
 * Pick two or three owned kanji; see what they make before committing. The
 * preview is the teaching surface: it tells the learner *while they are
 * choosing* whether the combination is a real word, and what it means.
 */

export const ForgeScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const [params] = useSearchParams();
  // When the forge is opened mid-stage, 'back' returns to that stage's
  // encounter instead of dumping the player on the map.
  const backTo = params.get('back') ?? mapPath;
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const weapons = useGameStore((s) => s.weapons);
  const craftWeapon = useGameStore((s) => s.craftWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);
  const sumi = useGameStore((s) => s.sumi);
  const spendSumi = useGameStore((s) => s.spendSumi);
  const tryCost = useGameStore((s) => s.tryCost);
  const foundWords = useGameStore((s) => s.foundWords);
  const recordFound = useGameStore((s) => s.recordFound);
  const recordMiss = useGameStore((s) => s.recordMiss);

  const [slots, setSlots] = useState<KanjiData[]>([]);
  const [made, setMade] = useState<Weapon | null>(null);
  /** Set when the craft just revealed a word for the first time. */
  const [discovered, setDiscovered] = useState<string | null>(null);

  const owned = useMemo(
    () =>
      ALL_KANJI.filter((k) => progress[k.id]?.obtainedAt != null).sort(
        (a, b) => (progress[b.id]!.obtainedAt ?? 0) - (progress[a.id]!.obtainedAt ?? 0),
      ),
    [progress],
  );

  const ownedChars = useMemo(
    () => new Set(ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char)),
    [progress],
  );
  const foundSet = useMemo(() => new Set(Object.keys(foundWords)), [foundWords]);

  const preview = useMemo(() => (slots.length >= 2 ? forgeWeapon(slots) : null), [slots]);
  /** A word already found costs nothing to remake. */
  const previewKnown = preview ? Boolean(foundWords[preview.word]) : false;
  const cost = preview && !previewKnown ? tryCost(slots.length) : 0;
  const canAfford = sumi >= cost;
  const alreadyMade = preview ? weapons.some((w) => w.id === preview.id) : false;

  const toggle = (k: KanjiData) => {
    setMade(null);
    setSlots((s) => {
      const at = s.findIndex((x) => x.id === k.id);
      if (at !== -1) return s.filter((x) => x.id !== k.id);
      if (s.length >= 3) return s;
      return [...s, k];
    });
  };

  const craft = () => {
    if (!preview || alreadyMade || !canAfford) return;
    // Ink is spent on the attempt, not the result: a guess costs the same
    // whether it lands or not, which is what makes thinking first worthwhile.
    if (cost > 0 && !spendSumi(cost)) return;

    const recipe = craftWeapon(slots.map((k) => k.id));
    if (!recipe) return;

    if (preview.compound && !foundWords[preview.word]) {
      recordFound(preview.word, FoundVia.LUCKY);
      setDiscovered(preview.word);
    } else {
      if (!preview.compound) recordMiss(preview.word);
      setDiscovered(null);
    }

    setMade(preview);
    equipWeapon(recipe.id);
  };

  return (
    <div className="g-stage min-h-dvh pb-6">
      <Backdrop fixed />
      <ForgeTutorial />
      <header
        className="g-header sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      >
        <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={() => navigate(backTo)}>
          <span aria-hidden>◀</span>もどる
        </button>
        <h1 className="g-title text-base">
          <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
        </h1>
        <div className="flex gap-1.5">
          <span className="g-chip text-xs">
            <span className="tabular-nums">{owned.length}</span>
            <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
          </span>
          <span className="g-chip text-xs tabular-nums" title="すみ">
            <span aria-hidden>🖌</span>
            {sumi}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* スロット ----------------------------------------------------- */}
        <div className="g-panel mb-3 p-4">
          <p className="g-eyebrow mb-2">
            <RubyText showFurigana={showFurigana}>漢字(かんじ)を 2(に)〜3(さん)つ えらぶ</RubyText>
          </p>
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => {
              const k = slots[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => k && toggle(k)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl font-black transition-colors"
                  style={{
                    // Dashed while the slot is waiting, solid once it is
                    // filled — the shape alone says whether it still needs
                    // something, without relying on colour.
                    borderStyle: k ? 'solid' : 'dashed',
                    borderColor: k ? 'var(--accent)' : 'var(--line)',
                    background: k ? 'var(--panel-solid)' : 'transparent',
                    color: k ? 'var(--ink)' : 'var(--ink-3)',
                  }}
                  aria-label={k ? `${k.char} を はずす` : `${i + 1}つめ`}
                >
                  {k ? <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText> : '＋'}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--ink-3)' }}>
            <RubyText showFurigana={showFurigana}>
              じゅんばんで ちがう 武器(ぶき)に なります。
            </RubyText>
          </p>
        </div>

        {/* プレビュー --------------------------------------------------- */}
        <AnimatePresence mode="wait">
          {preview && (
            <motion.div
              key={preview.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="g-panel-solid mb-3 p-4"
              style={{ borderColor: preview.compound ? 'var(--color-gold)' : 'var(--line)' }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: `${ELEMENT_LABEL[preview.element].color}22`,
                    color: ELEMENT_LABEL[preview.element].color,
                  }}
                >
                  {preview && <GameIcon name={preview.icon} size={38} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="g-title text-[15px] leading-snug">
                    <RubyText showFurigana={showFurigana}>{preview.name}</RubyText>
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: RARITY_LABEL[preview.rarity].color }}>
                    {RARITY_LABEL[preview.rarity].ja}
                  </p>
                  <p className="mt-1 text-xs tabular-nums" style={{ color: 'var(--ink-2)' }}>
                    こうげき {preview.attack}
                    <span className="mx-1.5" aria-hidden>·</span>
                    <RubyText showFurigana={showFurigana}>
                      {`${ELEMENT_LABEL[preview.element].ja}(${ELEMENT_LABEL[preview.element].reading})`}
                    </RubyText>
                  </p>
                </div>
              </div>

              {/* 熟語かどうかを、はっきり 言う ---------------------------- */}
              <div
                className="mt-3 rounded-xl px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: preview.compound ? 'rgba(255,207,74,0.16)' : 'var(--panel)',
                  color: 'var(--ink-2)',
                }}
              >
                {preview.compound ? (
                  <>
                    <p className="g-title text-sm" style={{ color: 'var(--color-gold-2)' }}>
                      <RubyText showFurigana={showFurigana}>本当(ほんとう)に ある 言葉(ことば)！</RubyText>
                    </p>
                    <p className="mt-0.5">
                      <RubyText showFurigana={showFurigana}>
                        {`${preview.compound.word}(${preview.compound.reading})`}
                      </RubyText>
                      <span className="ml-2">{preview.compound.gloss}</span>
                    </p>
                  </>
                ) : (
                  <p>
                    <RubyText showFurigana={showFurigana}>
                      この 組(く)み合(あ)わせは、言葉(ことば)には なりません。武器(ぶき)は 作(つく)れますが、弱(よわ)いです。
                    </RubyText>
                  </p>
                )}
              </div>

              <button
                type="button"
                className="g-btn g-btn-primary mt-3 w-full"
                disabled={alreadyMade || !canAfford}
                onClick={craft}
              >
                {alreadyMade ? (
                  <RubyText showFurigana={showFurigana}>もう 持(も)って います</RubyText>
                ) : !canAfford ? (
                  <RubyText showFurigana={showFurigana}>
                    {`すみが たりません（🖌${cost} 要(い)ります）`}
                  </RubyText>
                ) : cost > 0 ? (
                  <RubyText showFurigana={showFurigana}>{`ためす（🖌${cost}）`}</RubyText>
                ) : (
                  <RubyText showFurigana={showFurigana}>作(つく)る</RubyText>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 持っている漢字 ----------------------------------------------- */}
        <p className="g-eyebrow g-onbg mb-2">
          <RubyText showFurigana={showFurigana}>持(も)って いる 漢字(かんじ)</RubyText>
        </p>
        {owned.length === 0 ? (
          <div className="g-panel p-6 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              まだ 1(ひと)つも ありません。ステージで 漢字(かんじ)を 10回(かい) 書(か)くと 手(て)に 入(はい)ります。
            </RubyText>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {owned.map((k) => {
              const picked = slots.some((s) => s.id === k.id);
              const el = ELEMENT_LABEL[elementOf(k)];
              // How many words using this character are still unfound — the
              // "there is more in here" signal that makes a character worth
              // returning to.
              const left = remainingForChar(k.char, ownedChars, foundSet);
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => toggle(k)}
                  aria-pressed={picked}
                  aria-label={left > 0 ? `${k.char}（のこり ${left} 語）` : k.char}
                  className="relative flex aspect-square items-center justify-center rounded-xl text-xl font-black transition-transform active:scale-95"
                  style={{
                    background: picked ? 'var(--accent)' : 'var(--panel-solid)',
                    color: picked ? '#fff' : 'var(--ink)',
                    border: `2px solid ${picked ? 'var(--accent)' : el.color + '55'}`,
                  }}
                >
                  <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText>
                  {left > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black tabular-nums"
                      style={{ background: 'var(--color-gold)', color: 'var(--color-gold-ink)' }}
                    >
                      {left > 9 ? '9+' : left}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* できた --------------------------------------------------------- */}
      <AnimatePresence>
        {made && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
            onClick={() => {
              setMade(null);
              setSlots([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.86, rotate: -3 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="g-panel-solid w-full max-w-sm p-6 text-center"
            >
              <p className="g-eyebrow" style={discovered ? { color: 'var(--color-gold-2)' } : undefined}>
                {discovered ? (
                  <RubyText showFurigana={showFurigana}>
                    {KIND_LABEL[discoveryKind(discovered, ownedChars, foundSet)]}
                  </RubyText>
                ) : (
                  'できた'
                )}
              </p>
              <p className="my-3 flex justify-center" style={{ color: ELEMENT_LABEL[made.element].color }}>
                <GameIcon name={made.icon} size={72} />
              </p>
              <p className="g-title text-lg">
                <RubyText showFurigana={showFurigana}>{made.name}</RubyText>
              </p>
              <p className="mt-1" style={{ color: RARITY_LABEL[made.rarity].color }}>
                {RARITY_LABEL[made.rarity].ja}
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{made.blurb}</RubyText>
              </p>
              <p className="mt-3 text-xs" style={{ color: 'var(--ink-3)' }}>
                <RubyText showFurigana={showFurigana}>そうびしました。</RubyText>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForgeScreen;
