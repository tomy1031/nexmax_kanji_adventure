import { useState } from 'react';
import { Backdrop } from '../../components/ui/Backdrop';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import {
  pull,
  pullMany,
  PULL_COST,
  MULTI_COST,
  pullsUntilGuaranteed,
  type PullResult,
} from '../../lib/gacha';
import { Rank } from '../../data/individuals';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { CLASS_LABEL } from '../../lib/forge/weapon';
import { DAILY_TOTAL } from '../../data/dailyTasks';

/**
 * The gem shop.
 *
 * The odds, the ceiling and the ten-pull's guarantee are printed on the
 * screen rather than buried, and the reveal is a steady flip of ten cards —
 * no spinning, no near-miss, no escalating drum roll. A study app should not
 * be teaching anyone to enjoy pulling; it should make a week of saved-up
 * study feel like it paid off.
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

  const [results, setResults] = useState<PullResult[] | null>(null);
  /** How many of the ten have been turned face-up. */
  const [revealed, setRevealed] = useState(0);
  const [busy, setBusy] = useState(false);

  const canSingle = gems >= PULL_COST && !busy;
  const canMulti = gems >= MULTI_COST && !busy;

  const apply = (rs: PullResult[]) => {
    for (const r of rs) {
      grantIndividual(r.individual.id);
      if (r.refund) addGems(r.refund);
    }
  };

  const doSingle = () => {
    if (!canSingle || !spendGems(PULL_COST)) return;
    setBusy(true);
    const r = pull(owned, pity);
    setTimeout(() => {
      apply([r]);
      if (r.individual.rank === Rank.SPECIAL) resetPity();
      else bumpPity();
      setResults([r]);
      setRevealed(1);
      setBusy(false);
    }, 500);
  };

  const doMulti = () => {
    if (!canMulti || !spendGems(MULTI_COST)) return;
    setBusy(true);
    const { results: rs, pityAfter } = pullMany(owned, pity);
    setTimeout(() => {
      apply(rs);
      resetPity();
      for (let i = 0; i < pityAfter; i++) bumpPity();
      setResults(rs);
      setRevealed(0);
      setBusy(false);
    }, 500);
  };

  const close = () => {
    setResults(null);
    setRevealed(0);
  };

  const isMulti = results !== null && results.length > 1;
  const allRevealed = results !== null && revealed >= results.length;
  const daysToMulti = Math.ceil(Math.max(0, MULTI_COST - gems) / DAILY_TOTAL);

  return (
    <div className="g-stage min-h-dvh pb-8">
      <Backdrop fixed />
      <header
        className="g-header sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      >
        <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={() => navigate('/map/mukashi')}>
          <span aria-hidden>◀</span>もどる
        </button>
        <h1 className="g-title text-base">ガチャ</h1>
        <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
      </header>

      <div className="mx-auto max-w-md px-4 pt-6 text-center">
        <div className="g-frame px-4 pt-4 pb-4">
          <img
            src={assetPath('img/chara/variants_sheet.webp')}
            alt=""
            aria-hidden
            className="mx-auto mb-4 w-44 rounded-2xl opacity-90"
          />

          <h2 className="g-title text-lg">
            <RubyText showFurigana={showFurigana}>ネクマックスの 個体(こたい)</RubyText>
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
            <RubyText showFurigana={showFurigana}>
              なかまが ふえると、得意(とくい)な 武器(ぶき)が つよく なります。
            </RubyText>
          </p>

          {/* 10連を主役にする ------------------------------------------- */}
          <button type="button" className="g-btn g-btn-primary mt-5 w-full !min-h-[64px] text-lg" disabled={!canMulti} onClick={doMulti}>
            {busy ? (
              '…'
            ) : (
              <span className="flex flex-col leading-tight">
                <RubyText showFurigana={showFurigana}>{`10回(かい) ひく`}</RubyText>
                <span className="text-xs font-bold opacity-80">
                  ◆{MULTI_COST}
                  <span className="mx-1">·</span>
                  <RubyText showFurigana={showFurigana}>1回(かい)ぶん おトク</RubyText>
                </span>
              </span>
            )}
          </button>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-gold-2)' }}>
            <RubyText showFurigana={showFurigana}>
              10回(かい)の 中(なか)に、めずらしい 個体(こたい)が かならず 1体(たい) 入(はい)ります。
            </RubyText>
          </p>

          <button type="button" className="g-btn g-btn-ghost mt-3 w-full" disabled={!canSingle} onClick={doSingle}>
            <RubyText showFurigana={showFurigana}>{`1回(かい) ひく（◆${PULL_COST}）`}</RubyText>
          </button>

          {!canMulti && (
            <p className="mt-2 text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                {daysToMulti > 0
                  ? `10回(かい)ぶんまで あと ◆${MULTI_COST - gems}。毎日(まいにち)の やることを 全部(ぜんぶ) おわらせると、あと ${daysToMulti}日(にち)。`
                  : 'ジェムが たりません。'}
              </RubyText>
            </p>
          )}

        </div>

        {/* 確率と天井を かくさない ------------------------------------- */}
        <div className="g-panel mt-6 p-4 text-left text-xs" style={{ color: 'var(--ink-2)' }}>
          <p className="g-eyebrow mb-1.5">
            <RubyText showFurigana={showFurigana}>かくりつ</RubyText>
          </p>
          <ul className="space-y-1">
            <li>
              <RubyText showFurigana={showFurigana}>めずらしい 個体(こたい)：8%（1回(かい)ごと）</RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>
                10回(かい) ひくと、その 中(なか)に かならず 1体(たい)
              </RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>
                {`あと ${pullsUntilGuaranteed(pity)} 回(かい) ひくと、かならず めずらしい 個体(こたい)が 出(で)ます`}
              </RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>同(おな)じ 個体(こたい)が 出(で)たら ◆40 が もどります</RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>お金(かね)は つかいません。</RubyText>
            </li>
          </ul>
        </div>
      </div>

      {/* 結果 ------------------------------------------------------------ */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 px-5 py-6"
          >
            {isMulti ? (
              <>
                <p className="g-eyebrow mb-3 text-white/80">
                  <RubyText showFurigana={showFurigana}>
                    {allRevealed ? '10回(かい)の けっか' : 'カードを タップして めくる'}
                  </RubyText>
                </p>

                <div className="grid w-full max-w-sm grid-cols-5 gap-2">
                  {results.map((r, i) => {
                    const face = i < revealed;
                    const special = r.individual.rank === Rank.SPECIAL;
                    return (
                      <motion.button
                        key={`${r.individual.id}-${i}`}
                        type="button"
                        onClick={() => setRevealed((n) => Math.max(n, i + 1))}
                        initial={false}
                        animate={{ rotateY: face ? 0 : 180, scale: face ? 1 : 0.96 }}
                        transition={{ duration: 0.28 }}
                        className="flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-lg p-1"
                        style={{
                          background: face ? 'var(--panel-solid)' : 'rgba(255,255,255,0.14)',
                          border: `2px solid ${face && special ? 'var(--color-gold)' : 'transparent'}`,
                        }}
                        aria-label={face ? r.individual.shortName : `${i + 1}まいめ`}
                      >
                        {face ? (
                          <>
                            <img src={assetPath(r.individual.art)} alt="" aria-hidden className="h-auto w-full object-contain" />
                            <span className="w-full truncate text-[9px] font-bold" style={{ color: 'var(--ink-2)' }}>
                              {r.individual.shortName}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl text-white/70" aria-hidden>
                            ?
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-4 flex w-full max-w-sm gap-2">
                  {!allRevealed && (
                    <button
                      type="button"
                      className="g-btn g-btn-ghost flex-1 !bg-white/90"
                      onClick={() => setRevealed(results.length)}
                    >
                      <RubyText showFurigana={showFurigana}>ぜんぶ めくる</RubyText>
                    </button>
                  )}
                  {allRevealed && (
                    <button type="button" className="g-btn g-btn-primary flex-1" onClick={close}>
                      OK
                    </button>
                  )}
                </div>

                {allRevealed && (
                  <p className="mt-3 text-center text-xs text-white/85">
                    <RubyText showFurigana={showFurigana}>
                      {`新(あたら)しい なかま ${results.filter((r) => !r.duplicate).length}体(たい)`}
                    </RubyText>
                    {results.some((r) => r.refund > 0) && (
                      <span className="ml-2">
                        ◆{results.reduce((n, r) => n + r.refund, 0)}{' '}
                        <RubyText showFurigana={showFurigana}>もどりました</RubyText>
                      </span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.85, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="g-panel-solid w-full max-w-sm p-6 text-center"
              >
                {results[0].guaranteed && (
                  <p className="g-eyebrow" style={{ color: 'var(--color-gold-2)' }}>
                    <RubyText showFurigana={showFurigana}>てんじょう</RubyText>
                  </p>
                )}
                <img src={assetPath(results[0].individual.art)} alt="" aria-hidden className="mx-auto my-2 h-44 object-contain" />
                <p className="g-title text-lg">
                  <RubyText showFurigana={showFurigana}>{results[0].individual.name}</RubyText>
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>
                  <RubyText showFurigana={showFurigana}>{results[0].individual.tagline}</RubyText>
                </p>
                <p className="mt-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                  <RubyText showFurigana={showFurigana}>
                    {`得意(とくい)な 武器(ぶき)：${CLASS_LABEL[results[0].individual.favours].ja}(${CLASS_LABEL[results[0].individual.favours].reading})`}
                  </RubyText>
                </p>
                {results[0].duplicate && (
                  <p className="g-chip g-chip-gold mt-3 text-xs">
                    <RubyText showFurigana={showFurigana}>
                      {`もう 持(も)って いました。◆${results[0].refund} もどりました`}
                    </RubyText>
                  </p>
                )}
                <button type="button" className="g-btn g-btn-primary mt-5 w-full" onClick={close}>
                  OK
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GachaScreen;
