import { useEffect, useRef, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import {
  BANNERS,
  BOND_REFUND,
  STAR5_CEILING,
  daysToNextPickup,
  pickupOf,
  pityAfter,
  pull,
  pullMany,
  pullsUntilStar5,
  weekOf,
  type BannerId,
  type PullResult,
} from '../../lib/gacha';
import { getIndividual, type Individual } from '../../data/individuals';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { DAILY_TOTAL } from '../../data/dailyTasks';
import { SKILL_INFO, SKILL_OF } from '../../lib/companionSkill';
import { linesFor } from '../../data/companionLines';
import { useBgm } from '../../lib/bgm';
import * as sfx from '../../lib/sfx';

/**
 * The gem shop (docs/design/11 §5).
 *
 * Three gachas, each with its odds and ceiling printed under its buttons. The
 * reveal is honest: a card's back already shows its rarity (silver ★3, gold
 * ★4, rainbow ★5) before it turns, and a ★5 only takes a beat longer. A
 * duplicate raises that card's きずな, and gives gems back once it is full.
 */

/** A pull as it is shown: what it gave, and what the duplicate turned into. */
interface Shown extends PullResult {
  bondTo: number | null;
  refund: number;
}

const BACK: Record<number, string> = {
  3: 'linear-gradient(145deg, #d9dee8, #9aa3b5)',
  4: 'linear-gradient(145deg, #ffe39a, #d9a12b)',
  5: 'linear-gradient(145deg, #ff8fc1, #ffd36a 35%, #8be0a8 60%, #7fb2ff 85%, #c58bff)',
};
const FRAME: Record<number, string> = { 3: '#b8c0cf', 4: '#e8a317', 5: '#d0567a' };

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`★${n}`} className="leading-none" style={{ color: n === 5 ? '#d0567a' : '#e8a317' }}>
    {'★'.repeat(n)}
  </span>
);

/** The banner's picture: its cards standing together. */
const BannerArt = ({ cards }: { cards: Individual[] }) => (
  <div className="relative mx-auto flex h-40 items-end justify-center" aria-hidden>
    <div className="absolute inset-x-6 bottom-2 h-24 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255,214,110,0.55), transparent 70%)' }} />
    {cards.map((c, i) => (
      <img
        key={c.id}
        src={assetPath(c.art)}
        alt=""
        className="relative object-contain"
        style={{ height: i === 0 ? '100%' : '72%', order: i === 0 ? 1 : i === 1 ? 0 : 2, marginInline: '-4%' }}
      />
    ))}
  </div>
);

export const GachaScreen = () => {
  useBgm('shop');
  const navigate = useNavigate();
  const moji = useGameStore((st) => st.lastArc) === 'moji';
  const mapPath = useMapPath();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const gems = useGameStore((s) => s.gems);
  const owned = useGameStore((s) => s.individuals);
  const pity = useGameStore((s) => s.pityCount);
  const spendGems = useGameStore((s) => s.spendGems);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const addBond = useGameStore((s) => s.addBond);

  const [bannerId, setBannerId] = useState<BannerId>('pickup');
  const banner = BANNERS[bannerId];
  const [week] = useState(() => weekOf());
  const [daysLeft] = useState(() => daysToNextPickup());
  const pick = pickupOf(week);

  const [results, setResults] = useState<Shown[] | null>(null);
  /** How many of the cards have been turned face-up. */
  const [revealed, setRevealed] = useState(0);
  const [busy, setBusy] = useState(false);
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => flipTimers.current.forEach(clearTimeout), []);

  const canSingle = gems >= banner.single && !busy;
  const canMulti = gems >= banner.multi && !busy;

  /** Into the save: new cards join, duplicates raise きずな or give gems back. */
  const apply = (rs: PullResult[]): Shown[] =>
    rs.map((r) => {
      if (!r.duplicate) {
        grantIndividual(r.card.id);
        return { ...r, bondTo: null, refund: 0 };
      }
      const bondTo = addBond(r.card.id);
      const refund = bondTo == null ? BOND_REFUND[r.card.rarity] : 0;
      if (refund) addGems(refund);
      return { ...r, bondTo, refund };
    });

  const setPity = (n: number) => useGameStore.setState({ pityCount: n });

  const doSingle = () => {
    if (!canSingle || !spendGems(banner.single)) return;
    setBusy(true);
    const r = pull(bannerId, owned, pity, week);
    setTimeout(() => {
      setResults(apply([r]));
      setPity(pityAfter(bannerId, pity, r));
      setRevealed(0);
      setBusy(false);
      flipTo(1, [r]);
    }, 450);
  };

  const doMulti = () => {
    if (!canMulti || !spendGems(banner.multi)) return;
    setBusy(true);
    const { results: rs, pityAfter: p } = pullMany(bannerId, owned, pity, week);
    setTimeout(() => {
      setResults(apply(rs));
      setPity(p);
      setRevealed(0);
      setBusy(false);
    }, 450);
  };

  /** Turn cards over up to `n`, one after another; a ★5 waits a beat first. */
  const flipTo = (n: number, list: PullResult[] = results ?? []) => {
    flipTimers.current.forEach(clearTimeout);
    flipTimers.current = [];
    let at = 0;
    for (let i = revealed; i < n; i++) {
      const r = list[i];
      at += r.card.rarity === 5 ? 800 : 260;
      flipTimers.current.push(
        setTimeout(() => {
          setRevealed((v) => Math.max(v, i + 1));
          if (r.card.rarity === 5) sfx.fanfare();
          else if (r.card.rarity === 4) sfx.chime();
          else sfx.tap();
        }, at),
      );
    }
  };

  const close = () => {
    flipTimers.current.forEach(clearTimeout);
    setResults(null);
    setRevealed(0);
  };

  const isMulti = results !== null && results.length > 1;
  const allRevealed = results !== null && revealed >= results.length;
  const daysToMulti = Math.ceil(Math.max(0, banner.multi - gems) / DAILY_TOTAL);
  const bannerCards =
    bannerId === 'pickup'
      ? [pick.five, ...pick.fours]
      : bannerId === 'town'
        ? ['rin-4', 'teacher', 'baker-4'].map((id) => getIndividual(id)!)
        : ['ENTJ-5', 'ISTJ-5', 'rin-5'].map((id) => getIndividual(id)!);

  return (
    <div className="g-stage min-h-dvh pb-8">
      {/* The world being played behind it: the night town on 文字が 消えた 町 (08 §3.8). */}
      {moji ? <NightStreetBackdrop /> : <Backdrop fixed />}
      <header className="g-header sticky top-0 z-20 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center justify-between">
          <button type="button" className="g-btn g-btn-accent !min-h-[38px] !gap-1 !px-3.5 text-sm" onClick={() => navigate(mapPath)}>
            <span aria-hidden>◀</span>もどる
          </button>
          <h1 className="g-title text-center text-base leading-tight">
            ガチャ
            <span lang="en" className="block text-[10px] font-bold opacity-80">
              Friends
            </span>
          </h1>
          <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
        </div>
        <div className="mt-2 flex gap-1.5" role="tablist" aria-label="ガチャの しゅるい">
          {(['pickup', 'standard', 'town'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={bannerId === id}
              onClick={() => setBannerId(id)}
              className="g-btn flex-1 !min-h-[38px] !px-1 text-xs"
              style={{ background: bannerId === id ? 'var(--accent)' : 'var(--panel-solid)', color: bannerId === id ? '#fff' : 'var(--ink)' }}
            >
              <RubyText showFurigana={showFurigana}>{BANNERS[id].name}</RubyText>
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4 text-center">
        <div className="g-frame px-4 pt-3 pb-4">
          <BannerArt cards={bannerCards} />
          <h2 className="g-title mt-1 text-lg">
            <RubyText showFurigana={showFurigana}>{banner.name}</RubyText>
          </h2>
          <p className="mt-1 text-sm leading-snug" style={{ color: 'var(--ink-2)' }}>
            {bannerId === 'pickup' ? (
              <>
                <Stars n={5} /> <RubyText showFurigana={showFurigana}>{`「${pick.five.name}」が 出(で)やすい！`}</RubyText>
                <span className="block text-xs">
                  <RubyText showFurigana={showFurigana}>{`★4「${pick.fours[0].name}」「${pick.fours[1].name}」も。あと ${daysLeft}日(にち)で 入(い)れかわり`}</RubyText>
                </span>
              </>
            ) : bannerId === 'town' ? (
              <RubyText showFurigana={showFurigana}>町(まち)の なかまだけ。★4が 出(で)やすく、ねだんも やすい。</RubyText>
            ) : (
              <RubyText showFurigana={showFurigana}>ぜんぶの なかまの カードが 出(で)ます。</RubyText>
            )}
          </p>

          {/* 10連を主役にする ------------------------------------------- */}
          <button type="button" className="g-btn g-btn-primary mt-4 w-full !min-h-[64px] text-lg" disabled={!canMulti} onClick={doMulti}>
            {busy ? (
              '…'
            ) : (
              <span className="flex flex-col leading-tight">
                <RubyText showFurigana={showFurigana}>10回(かい) ひく</RubyText>
                <span className="text-xs font-bold opacity-80">
                  ◆{banner.multi}
                  <span className="mx-1">·</span>
                  <RubyText showFurigana={showFurigana}>1回(かい)ぶん おトク</RubyText>
                </span>
              </span>
            )}
          </button>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-gold-2)' }}>
            <RubyText showFurigana={showFurigana}>10回(かい)の 中(なか)に ★4 いじょうが かならず 1枚(まい)</RubyText>
          </p>
          <button type="button" className="g-btn g-btn-ghost mt-3 w-full" disabled={!canSingle} onClick={doSingle}>
            <RubyText showFurigana={showFurigana}>{`1回(かい) ひく（◆${banner.single}）`}</RubyText>
          </button>
          {!canMulti && (
            <p className="mt-2 text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                {daysToMulti > 0
                  ? `10回(かい)ぶんまで あと ◆${banner.multi - gems}。毎日(まいにち)の やること 全部(ぜんぶ)で あと ${daysToMulti}日(にち)。`
                  : 'ジェムが たりません。'}
              </RubyText>
            </p>
          )}
        </div>

        {/* 確率と天井を かくさない ------------------------------------- */}
        <div className="g-panel mt-4 p-4 text-left text-xs" style={{ color: 'var(--ink-2)' }}>
          <p className="g-eyebrow mb-1.5">
            <RubyText showFurigana={showFurigana}>かくりつ</RubyText>
          </p>
          <ul className="space-y-1">
            <li>
              {banner.rates[5] > 0 && (
                <>
                  <Stars n={5} /> {Math.round(banner.rates[5] * 100)}%・
                </>
              )}
              <Stars n={4} /> {Math.round(banner.rates[4] * 100)}%・<Stars n={3} /> {Math.round(banner.rates[3] * 100)}%
              <RubyText showFurigana={showFurigana}>（1回(かい)ごと）</RubyText>
            </li>
            {bannerId === 'pickup' && (
              <li>
                <RubyText showFurigana={showFurigana}>★5・★4が 出(で)たら、その 半分(はんぶん)は 今週(こんしゅう)の カード</RubyText>
              </li>
            )}
            {banner.ceiling && (
              <li>
                <RubyText showFurigana={showFurigana}>
                  {`★5は ${STAR5_CEILING}回(かい)で かならず 出(で)ます。あと ${pullsUntilStar5(pity)}回(かい)（いつもの と ピックアップ）`}
                </RubyText>
              </li>
            )}
            <li>
              <RubyText showFurigana={showFurigana}>
                {`同(おな)じ カード → きずな ＋1。きずなが いっぱい → ◆が もどる（★3 ◆${BOND_REFUND[3]}・★4 ◆${BOND_REFUND[4]}・★5 ◆${BOND_REFUND[5]}）`}
              </RubyText>
            </li>
            <li>
              <RubyText showFurigana={showFurigana}>お金(かね)は つかいません。ジェムは 書(か)いて もらえます。</RubyText>
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-5 py-6"
          >
            {isMulti ? (
              <>
                <p className="g-eyebrow mb-3 text-white/80">
                  <RubyText showFurigana={showFurigana}>{allRevealed ? '10回(かい)の けっか' : 'カードを タップして めくる'}</RubyText>
                </p>
                <div className="grid w-full max-w-sm grid-cols-5 gap-2">
                  {results.map((r, i) => {
                    const face = i < revealed;
                    return (
                      <motion.button
                        key={`${r.card.id}-${i}`}
                        type="button"
                        onClick={() => flipTo(i + 1)}
                        initial={false}
                        animate={{ rotateY: face ? 0 : 180, scale: face ? 1 : 0.96 }}
                        transition={{ duration: 0.28 }}
                        className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-lg p-1"
                        style={{
                          background: face ? 'var(--panel-solid)' : BACK[r.card.rarity],
                          border: `2px solid ${FRAME[r.card.rarity]}`,
                          boxShadow: r.card.rarity === 5 ? '0 0 14px rgba(255,150,200,0.8)' : r.card.rarity === 4 ? '0 0 10px rgba(255,210,90,0.6)' : undefined,
                        }}
                        aria-label={face ? r.card.shortName : `${i + 1}まいめ ★${r.card.rarity}`}
                      >
                        {face ? (
                          <>
                            <img src={assetPath(r.card.art)} alt="" aria-hidden className="h-auto w-full object-contain" />
                            <span className="text-[8px] leading-none">
                              <Stars n={r.card.rarity} />
                            </span>
                            {!r.duplicate && (
                              <span className="absolute top-0.5 left-0.5 rounded bg-[#e2453c] px-0.5 text-[8px] leading-[1.4] font-black text-white">NEW</span>
                            )}
                            {r.duplicate && (
                              <span className="absolute top-0.5 left-0.5 rounded bg-[#d0567a] px-0.5 text-[8px] leading-[1.4] font-black text-white">
                                {r.bondTo ? `♥${r.bondTo}` : `◆${r.refund}`}
                              </span>
                            )}
                          </>
                        ) : (
                          // The card is turned away (rotateY 180): turn the label back so it reads.
                          <span className="text-lg font-black text-white/90 drop-shadow" style={{ transform: 'scaleX(-1)' }} aria-hidden>
                            ★{r.card.rarity}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="mt-4 flex w-full max-w-sm gap-2">
                  {!allRevealed ? (
                    <button type="button" className="g-btn g-btn-ghost flex-1 !bg-white/90" onClick={() => flipTo(results.length)}>
                      <RubyText showFurigana={showFurigana}>ぜんぶ めくる</RubyText>
                    </button>
                  ) : (
                    <button type="button" className="g-btn g-btn-primary flex-1" onClick={close}>
                      OK
                    </button>
                  )}
                </div>
                {allRevealed && (
                  <p className="mt-3 text-center text-xs text-white/85">
                    <RubyText showFurigana={showFurigana}>
                      {[
                        `新(あたら)しい カード ${results.filter((r) => !r.duplicate).length}枚(まい)`,
                        results.some((r) => r.bondTo) ? `きずな ＋${results.filter((r) => r.bondTo).length}` : '',
                        results.some((r) => r.refund) ? `◆${results.reduce((n, r) => n + r.refund, 0)} もどりました` : '',
                      ]
                        .filter(Boolean)
                        .join(' ・ ')}
                    </RubyText>
                  </p>
                )}
              </>
            ) : (
              <SingleCard r={results[0]} face={revealed > 0} showFurigana={showFurigana} onClose={close} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** One pull: the card turns, then the companion says hello. */
const SingleCard = ({ r, face, showFurigana, onClose }: { r: Shown; face: boolean; showFurigana: boolean; onClose: () => void }) => {
  const kind = SKILL_OF[r.card.char];
  const info = SKILL_INFO[kind];
  return (
    <motion.div
      initial={{ scale: 0.85, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="g-panel-solid w-full max-w-sm p-5 text-center"
      style={{ borderColor: FRAME[r.card.rarity], boxShadow: r.card.rarity === 5 ? '0 0 28px rgba(255,150,200,0.7)' : undefined }}
    >
      {!face ? (
        <div className="mx-auto flex h-60 w-44 items-center justify-center rounded-2xl text-4xl font-black text-white" style={{ background: BACK[r.card.rarity] }}>
          ★{r.card.rarity}
        </div>
      ) : (
        <>
          {r.guaranteed && (
            <p className="g-eyebrow" style={{ color: 'var(--color-gold-2)' }}>
              <RubyText showFurigana={showFurigana}>てんじょう</RubyText>
            </p>
          )}
          <Stars n={r.card.rarity} />
          <img src={assetPath(r.card.art)} alt="" aria-hidden className="mx-auto my-1 h-48 object-contain" />
          <p className="g-title text-lg">
            <RubyText showFurigana={showFurigana}>{r.card.name}</RubyText>
          </p>
          <p className="mt-1 rounded-2xl bg-white/70 px-3 py-1.5 text-sm leading-snug font-bold">
            「<RubyText showFurigana={showFurigana}>{linesFor(r.card).start}</RubyText>」
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--ink-2)' }}>
            {info.icon} <RubyText showFurigana={showFurigana}>{`わざ「${info.name}」`}</RubyText>
          </p>
          {r.duplicate ? (
            <p className="g-chip g-chip-gold mt-3 text-xs">
              <RubyText showFurigana={showFurigana}>{r.bondTo ? `もう いる カード。きずな ♥${r.bondTo}` : `きずなは いっぱい。◆${r.refund} もどりました`}</RubyText>
            </p>
          ) : (
            <p className="g-chip mt-3 text-xs" style={{ background: '#e2453c', color: '#fff', borderColor: 'transparent' }}>
              <RubyText showFurigana={showFurigana}>新(あたら)しい なかま！</RubyText>
            </p>
          )}
        </>
      )}
      <button type="button" className="g-btn g-btn-primary mt-4 w-full" onClick={onClose}>
        OK
      </button>
    </motion.div>
  );
};

export default GachaScreen;
