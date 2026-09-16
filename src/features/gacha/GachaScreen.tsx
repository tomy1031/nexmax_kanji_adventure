import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { pull, PULL_COST, pullsUntilGuaranteed, type PullResult } from '../../lib/gacha';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { CLASS_LABEL } from '../../lib/forge/weapon';

/**
 * The gem shop.
 *
 * The odds and the ceiling are printed on the screen rather than buried, and
 * the reveal is one short beat — no spinning, no near-miss. A study app should
 * not be teaching anyone to enjoy pulling.
 */
export const GachaScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const gems = useGameStore((s) => s.gems);
  const owned = useGameStore((s) => s.individuals);
  const pity = useGameStore((s) => s.pityCount);
  const spendGems = useGameStore((s) => s.spendGems);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const bumpPity = useGameStore((s) => s.bumpPity);
  const resetPity = useGameStore((s) => s.resetPity);

  const [result, setResult] = useState<PullResult | null>(null);
  const [spinning, setSpinning] = useState(false);

  const canPull = gems >= PULL_COST && !spinning;

  const doPull = () => {
    if (!canPull) return;
    if (!spendGems(PULL_COST)) return;

    setSpinning(true);
    const outcome = pull(owned, pity);

    setTimeout(() => {
      grantIndividual(outcome.individual.id);
      if (outcome.refund) addGems(outcome.refund);
      if (outcome.individual.rank === 'SPECIAL') resetPity();
      else bumpPity();
      setResult(outcome);
      setSpinning(false);
    }, 700);
  };

  return (
    <div className="g-stage min-h-dvh pb-8">
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: 'var(--panel)' }}
      >
        <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => navigate('/map')}>
          もどる
        </button>
        <h1 className="g-title text-base">ガチャ</h1>
        <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
      </header>

      <div className="mx-auto max-w-md px-4 pt-6 text-center">
        <img
          src={assetPath('img/chara/variants_sheet.webp')}
          alt=""
          aria-hidden
          className="mx-auto mb-4 w-48 rounded-2xl opacity-90"
        />

        <h2 className="g-title text-lg">
          <RubyText showFurigana={showFurigana}>ネクマックスの 個体(こたい)</RubyText>
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            なかまが ふえると、得意(とくい)な 武器(ぶき)が つよく なります。
          </RubyText>
        </p>

        <button type="button" className="g-btn g-btn-primary mt-6 w-full text-lg" disabled={!canPull} onClick={doPull}>
          {spinning ? (
            '…'
          ) : (
            <RubyText showFurigana={showFurigana}>{`◆${PULL_COST} で 1回(かい) ひく`}</RubyText>
          )}
        </button>

        {gems < PULL_COST && (
          <p className="mt-2 text-xs" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              ジェムが たりません。毎日(まいにち)の やることを おわらせると もらえます。
            </RubyText>
          </p>
        )}

        {/* 確率と天井を かくさない ------------------------------------- */}
        <div className="g-panel mt-6 p-4 text-left text-xs" style={{ color: 'var(--ink-2)' }}>
          <p className="g-eyebrow mb-1.5">
            <RubyText showFurigana={showFurigana}>かくりつ</RubyText>
          </p>
          <ul className="space-y-1">
            <li>
              <RubyText showFurigana={showFurigana}>めずらしい 個体(こたい)：8%</RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>
                {`あと ${pullsUntilGuaranteed(pity)} 回(かい) ひくと、かならず めずらしい 個体(こたい)が 出(で)ます`}
              </RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>
                同(おな)じ 個体(こたい)が 出(で)たら ◆40 が もどります
              </RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>お金(かね)は つかいません。</RubyText>
            </li>
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="g-panel-solid w-full max-w-sm p-6 text-center"
            >
              {result.guaranteed && (
                <p className="g-eyebrow" style={{ color: 'var(--color-gold-2)' }}>
                  <RubyText showFurigana={showFurigana}>てんじょう</RubyText>
                </p>
              )}
              <img
                src={assetPath(result.individual.art)}
                alt=""
                aria-hidden
                className="mx-auto my-2 h-44 object-contain"
              />
              <p className="g-title text-lg">
                <RubyText showFurigana={showFurigana}>{result.individual.name}</RubyText>
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{result.individual.tagline}</RubyText>
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                <RubyText showFurigana={showFurigana}>
                  {`得意(とくい)な 武器(ぶき)：${CLASS_LABEL[result.individual.favours].ja}(${CLASS_LABEL[result.individual.favours].reading})`}
                </RubyText>
              </p>

              {result.duplicate && (
                <p className="g-chip g-chip-gold mt-3 text-xs">
                  <RubyText showFurigana={showFurigana}>
                    {`もう 持(も)って いました。◆${result.refund} もどりました`}
                  </RubyText>
                </p>
              )}

              <button type="button" className="g-btn g-btn-primary mt-5 w-full" onClick={() => setResult(null)}>
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GachaScreen;
