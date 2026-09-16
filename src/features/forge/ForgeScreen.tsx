import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../lib/kanjiDb';
import { forgeWeapon, RARITY_LABEL, type Weapon } from '../../lib/forge/weapon';
import { ELEMENT_LABEL, elementOf } from '../../lib/forge/elements';
import { RubyText } from '../../components/ui/Ruby';
import type { KanjiData } from '../../types/kanji';
import { GameIcon } from '../../components/ui/GameIcon';
import ForgeTutorial from './ForgeTutorial';

/**
 * The forge.
 *
 * Pick two or three owned kanji; see what they make before committing. The
 * preview is the teaching surface: it tells the learner *while they are
 * choosing* whether the combination is a real word, and what it means.
 */

export const ForgeScreen = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // When the forge is opened mid-stage, 'back' returns to that stage's
  // encounter instead of dumping the player on the map.
  const backTo = params.get('back') ?? '/map';
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const weapons = useGameStore((s) => s.weapons);
  const craftWeapon = useGameStore((s) => s.craftWeapon);
  const equipWeapon = useGameStore((s) => s.equipWeapon);

  const [slots, setSlots] = useState<KanjiData[]>([]);
  const [made, setMade] = useState<Weapon | null>(null);

  const owned = useMemo(
    () =>
      ALL_KANJI.filter((k) => progress[k.id]?.obtainedAt != null).sort(
        (a, b) => (progress[b.id]!.obtainedAt ?? 0) - (progress[a.id]!.obtainedAt ?? 0),
      ),
    [progress],
  );

  const preview = useMemo(() => (slots.length >= 2 ? forgeWeapon(slots) : null), [slots]);
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
    if (!preview || alreadyMade) return;
    const recipe = craftWeapon(slots.map((k) => k.id));
    if (recipe) {
      setMade(preview);
      equipWeapon(recipe.id);
    }
  };

  return (
    <div className="g-stage min-h-dvh pb-6">
      <ForgeTutorial />
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: 'var(--panel)' }}
      >
        <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => navigate(backTo)}>
          もどる
        </button>
        <h1 className="g-title text-base">
          <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
        </h1>
        <span className="g-chip text-xs">
          <span className="tabular-nums">{owned.length}</span>
          <RubyText showFurigana={showFurigana}>字(じ)</RubyText>
        </span>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* スロット ----------------------------------------------------- */}
        <div className="g-panel mb-3 p-4">
          <p className="g-eyebrow mb-2">
            <RubyText showFurigana={showFurigana}>漢字(かんじ)を 2〜3(に〜さん)つ えらぶ</RubyText>
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
                  {k?.char ?? '＋'}
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
                disabled={alreadyMade}
                onClick={craft}
              >
                {alreadyMade ? (
                  <RubyText showFurigana={showFurigana}>もう 持(も)って います</RubyText>
                ) : (
                  <RubyText showFurigana={showFurigana}>作(つく)る</RubyText>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 持っている漢字 ----------------------------------------------- */}
        <p className="g-eyebrow mb-2">
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
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => toggle(k)}
                  aria-pressed={picked}
                  className="flex aspect-square items-center justify-center rounded-xl text-xl font-black transition-transform active:scale-95"
                  style={{
                    background: picked ? 'var(--accent)' : 'var(--panel-solid)',
                    color: picked ? '#fff' : 'var(--ink)',
                    border: `2px solid ${picked ? 'var(--accent)' : el.color + '55'}`,
                  }}
                >
                  {k.char}
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
              <p className="g-eyebrow">できた</p>
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
