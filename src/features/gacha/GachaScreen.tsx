import { useEffect, useRef, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { afterEpisodePath } from '../../data/mojiFlow';
import { UNLOCKED_ON_MOJI } from '../../data/unlocks';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SummonOverlay } from './SummonOverlay';
import { Star5CutIn } from './Star5CutIn';
import { useGameStore } from '../../store/gameStore';
import {
  BANNERS,
  BOND_REFUND,
  STAR5_CEILING,
  cardRates,
  daysToNextPickup,
  pickupOf,
  isMet,
  type Banner,
  type Met,
  pityAfter,
  pull,
  pullMany,
  pullsUntilStar5,
  weekOf,
  type BannerId,
  type PullResult,
} from '../../lib/gacha';
import { CARDS, getIndividual, type Individual } from '../../data/individuals';
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
  /** Why this card was certain, when it was not the ceiling (the first ticket). */
  note?: string;
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
/** The banner's three faces: the chosen ones the story has met, topped up with others it can give. */
const showcase = (ids: string[], banner: Banner, met: Met): Individual[] => {
  const chosen = ids.map((id) => getIndividual(id)!).filter(met);
  const more = CARDS.filter((c) => banner.has(c) && met(c) && !chosen.includes(c)).sort((a, b) => b.rarity - a.rarity);
  return [...chosen, ...more].slice(0, 3);
};

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
  // Town people come out only once the story has met them (Individual.meets).
  const cleared = useGameStore((s) => s.clearedStages);
  const met = (c: Individual) => isMet(c, cleared);
  const spendGems = useGameStore((s) => s.spendGems);
  const addGems = useGameStore((s) => s.addGems);
  const grantIndividual = useGameStore((s) => s.grantIndividual);
  const addBond = useGameStore((s) => s.addBond);

  const [bannerId, setBannerId] = useState<BannerId>('pickup');
  const banner = BANNERS[bannerId];
  const [week] = useState(() => weekOf());
  const [daysLeft] = useState(() => daysToNextPickup());
  const pick = pickupOf(week, met);

  const [results, setResults] = useState<Shown[] | null>(null);
  /** How many of the cards have been turned face-up. */
  const [revealed, setRevealed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  /** The pull being shown coming down (SummonOverlay), before its cards are dealt. */
  const [summon, setSummon] = useState<Shown[] | null>(null);
  /** A ★5 just turned: its cut-in, and how far to keep turning after it. */
  const [cutIn, setCutIn] = useState<{ r: Shown; resume: number } | null>(null);
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => flipTimers.current.forEach(clearTimeout), []);

  const canSingle = gems >= banner.single && !busy;

  // ガチャチケット and the first pull, shown how (docs/design/16 §3).
  const tickets = useGameStore((s) => s.gachaTickets);
  const spendTicket = useGameStore((s) => s.useGachaTicket);
  const firstDone = useGameStore((s) => s.tutorials.gacha);
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const [params] = useSearchParams();
  /** Brought here by 1章 4話 with its ticket: point at it, and say what a friend does after. */
  const first = !firstDone && (params.get('first') === '1' || tickets > 0);
  const [firstPulled, setFirstPulled] = useState<Shown | null>(null);
  const [howTo, setHowTo] = useState(false);
  const doTicket = () => {
    if (busy || !spendTicket()) return;
    setBusy(true);
    // The first is a ★4 or better: a friend worth taking into the next fight.
    const r = pull(bannerId, owned, pity, week, Math.random, first, met);
    setPity(pityAfter(bannerId, pity, r));
    const shown = apply([r]).map((s) => (first ? { ...s, guaranteed: false, note: 'はじめての ★4 かくてい' } : s));
    if (first) setFirstPulled(shown[0]);
    setSummon(shown);
  };
  const endFirst = () => {
    markTutorialSeen('gacha');
    setHowTo(false);
    navigate(afterEpisodePath(UNLOCKED_ON_MOJI.gacha, useGameStore.getState().clearedStages) ?? mapPath);
  };
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
    const r = pull(bannerId, owned, pity, week, Math.random, false, met);
    setPity(pityAfter(bannerId, pity, r));
    setSummon(apply([r]));
  };

  const doMulti = () => {
    if (!canMulti || !spendGems(banner.multi)) return;
    setBusy(true);
    const { results: rs, pityAfter: p } = pullMany(bannerId, owned, pity, week, Math.random, met);
    setPity(p);
    setSummon(apply(rs));
  };

  /** The light has burst: deal the cards. One card turns by itself. */
  const dealt = () => {
    const list = summon ?? [];
    setSummon(null);
    setResults(list);
    setRevealed(0);
    setBusy(false);
    if (list.length === 1) flipTo(1, list, 0);
  };

  /**
   * Turn cards over up to `n`, one after another; a ★5 waits a beat first,
   * then has the whole screen (Star5CutIn) before the rest go on turning.
   */
  const flipTo = (n: number, list: Shown[] = results ?? [], from = revealed) => {
    flipTimers.current.forEach(clearTimeout);
    flipTimers.current = [];
    let at = 0;
    for (let i = from; i < n; i++) {
      const r = list[i];
      at += r.card.rarity === 5 ? 800 : 260;
      flipTimers.current.push(
        setTimeout(() => {
          setRevealed((v) => Math.max(v, i + 1));
          if (r.card.rarity === 5) setCutIn({ r, resume: n });
          else if (r.card.rarity === 4) sfx.chime();
          else sfx.tap();
        }, at),
      );
      if (r.card.rarity === 5) break;
    }
  };
  const closeCutIn = () => {
    const c = cutIn;
    setCutIn(null);
    if (c && c.resume > revealed) flipTo(c.resume, results ?? [], revealed);
  };

  const close = () => {
    flipTimers.current.forEach(clearTimeout);
    setResults(null);
    setRevealed(0);
    if (firstPulled && !firstDone) setHowTo(true);
  };

  const isMulti = results !== null && results.length > 1;
  const allRevealed = results !== null && revealed >= results.length;
  const daysToMulti = Math.ceil(Math.max(0, banner.multi - gems) / DAILY_TOTAL);
  const bannerCards =
    bannerId === 'pickup'
      ? [pick.five, ...pick.fours]
      : showcase(bannerId === 'town' ? ['rin-4', 'teacher', 'baker-4'] : ['ENTJ-5', 'ISTJ-5', 'rin-5'], banner, met);

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
          <span className="flex items-center gap-1">
            {tickets > 0 && (
              <span className="g-chip text-xs tabular-nums" aria-label={`チケット ${tickets}`}>
                <img src={assetPath('img/gacha/ticket.webp')} alt="" aria-hidden className="h-4 w-auto" /> {tickets}
              </span>
            )}
            <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
          </span>
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

          {tickets > 0 && (
            // A ticket: one pull without gems. Above everything while there is one.
            <motion.button
              type="button"
              data-tap
              className={`g-btn mt-4 w-full !min-h-[68px] text-lg ${first ? 'relative z-[45]' : ''}`}
              style={{ background: 'linear-gradient(180deg,#ffe39a,#e8a317)', color: '#3a2414', borderColor: '#fff3b0' }}
              disabled={busy}
              onClick={doTicket}
              animate={first ? { scale: [1, 1.04, 1] } : undefined}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <img src={assetPath('img/gacha/ticket.webp')} alt="" aria-hidden className="h-10 w-auto" />
              <span className="flex flex-col leading-tight">
                <RubyText showFurigana={showFurigana}>チケットで 1回(かい) ひく</RubyText>
                <span className="text-xs font-bold opacity-80">
                  <RubyText showFurigana={showFurigana}>{first ? '★4 いじょう かくてい！' : `のこり ${tickets}まい`}</RubyText>
                </span>
              </span>
            </motion.button>
          )}

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
          {banner.ceiling && (
            // How far the ★5 ceiling is, at a glance (docs/design/16 §6).
            <div className="mt-2 text-left text-[11px] font-black" style={{ color: 'var(--ink-2)' }}>
              <div className="flex justify-between">
                <RubyText showFurigana={showFurigana}>{`★5 かくてい まで あと ${pullsUntilStar5(pity)}回(かい)`}</RubyText>
                <span className="tabular-nums">
                  {pity} / {STAR5_CEILING}
                </span>
              </div>
              <div className="mt-0.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <div className="h-full rounded-full" style={{ width: `${(pity / STAR5_CEILING) * 100}%`, background: 'linear-gradient(90deg,#ff8fc1,#ffd36a,#8be0a8,#7fb2ff)' }} />
              </div>
            </div>
          )}
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
          <button type="button" data-tap className="g-btn g-btn-ghost mt-3 w-full !min-h-[40px] text-xs" onClick={() => setRatesOpen(true)}>
            <RubyText showFurigana={showFurigana}>くわしい かくりつ（カードごと） ▶</RubyText>
          </button>
        </div>
      </div>

      {/* くわしい かくりつ: every card this gacha can give now, and its chance (docs/design/16 §6). */}
      <AnimatePresence>
        {ratesOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
            onClick={() => setRatesOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="rates-title"
              className="g-panel-solid flex max-h-full w-full max-w-sm flex-col p-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="rates-title" className="g-title text-base">
                <RubyText showFurigana={showFurigana}>{`${banner.name} の かくりつ`}</RubyText>
              </h2>
              <p className="mt-1 text-[11px] leading-[1.8]" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>1回(かい)ごとの かくりつです。まだ もって いない カードが 先(さき)に 出(で)ます。お話(はなし)で まだ 会(あ)って いない 町(まち)の 人(ひと)は 出(で)ません。</RubyText>
              </p>
              <ul className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1 text-xs">
                {cardRates(bannerId, owned, week, met).map(({ card, rate }) => (
                  <li key={card.id} className="flex items-center gap-2 border-b py-1" style={{ borderColor: 'var(--line)' }}>
                    <Stars n={card.rarity} />
                    <span className="min-w-0 flex-1 truncate font-bold">
                      <RubyText showFurigana={showFurigana}>{card.name}</RubyText>
                    </span>
                    <span className="tabular-nums">{(rate * 100).toFixed(rate < 0.001 ? 3 : 2)}%</span>
                  </li>
                ))}
              </ul>
              <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={() => setRatesOpen(false)}>
                <RubyText showFurigana={showFurigana}>とじる</RubyText>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* はじめての ガチャ: everything dim but the ticket, and a hand at it (docs/design/16 §3). */}
      <AnimatePresence>
        {first && tickets > 0 && !summon && !results && (
          <motion.div key="coach" className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="g-parchment absolute inset-x-6 top-[max(70px,12dvh)] mx-auto max-w-sm px-4 py-3 text-center">
              <p className="text-base leading-[2] font-black">
                <img src={assetPath('img/gacha/ticket.webp')} alt="" aria-hidden className="mr-1 inline h-6 w-auto align-middle" />
                <RubyText showFurigana={showFurigana}>チケットで なかまを よぼう！</RubyText>
              </p>
              <p className="text-sm leading-[1.9]" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>はじめての 1回(かい)は ★4 いじょうが 出(で)ます。</RubyText>
              </p>
              <motion.p aria-hidden className="mt-1 text-3xl" animate={{ y: [0, 8, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                👇
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {howTo && firstPulled && (
          <motion.div key="howto" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="howto-title" className="g-parchment w-full max-w-xs px-5 py-4 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <img src={assetPath(firstPulled.card.art)} alt="" aria-hidden className="mx-auto h-28 object-contain" />
              <p id="howto-title" className="mt-1 text-base leading-[2] font-black">
                <RubyText showFurigana={showFurigana}>{`${firstPulled.card.shortName}が なかまに なりました！`}</RubyText>
              </p>
              <p className="mt-1 text-sm leading-[1.95]">
                <RubyText showFurigana={showFurigana}>じゅんびで なかまを えらぶと、たたかいで わざを つかいます。</RubyText>
              </p>
              <p className="mt-1 text-xs leading-[1.9]" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{`わざ「${SKILL_INFO[SKILL_OF[firstPulled.card.char]].name}」 ${SKILL_INFO[SKILL_OF[firstPulled.card.char]].icon}`}</RubyText>
              </p>
              <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={endFirst}>
                <RubyText showFurigana={showFurigana}>つぎの 話(わ)へ ▶</RubyText>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ひく 演出 (docs/design/16 §5) */}
      <AnimatePresence>{summon && <SummonOverlay key="summon" rarities={summon.map((r) => r.card.rarity)} still={still} onDone={dealt} />}</AnimatePresence>
      <AnimatePresence>{cutIn && <Star5CutIn key={cutIn.r.card.id} card={cutIn.r.card} fresh={!cutIn.r.duplicate} showFurigana={showFurigana} still={still} onClose={closeCutIn} />}</AnimatePresence>

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
                        // Dealt in one by one, then turned on a tap.
                        initial={{ opacity: 0, y: -60, rotateY: 180, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, rotateY: face ? 0 : 180, scale: face ? 1 : 0.96 }}
                        transition={{ duration: 0.3, delay: face || still ? 0 : i * 0.07 }}
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
                          <>
                            {/* The card is turned away (rotateY 180): turn the label back so it reads. */}
                            <span className="text-lg font-black text-white/90 drop-shadow" style={{ transform: 'scaleX(-1)' }} aria-hidden>
                              ★{r.card.rarity}
                            </span>
                            {r.card.rarity >= 4 && !still && (
                              // A ★4 or ★5 face down shimmers: something good is under it.
                              <motion.span
                                aria-hidden
                                className="pointer-events-none absolute inset-0"
                                style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.75) 50%, transparent 70%)', willChange: 'transform' }}
                                animate={{ x: ['-120%', '120%'] }}
                                transition={{ duration: r.card.rarity === 5 ? 0.9 : 1.4, repeat: Infinity, repeatDelay: 0.3 }}
                              />
                            )}
                          </>
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
          {(r.note || r.guaranteed) && (
            <p className="g-eyebrow" style={{ color: 'var(--color-gold-2)' }}>
              <RubyText showFurigana={showFurigana}>{r.note ?? 'てんじょう'}</RubyText>
            </p>
          )}
          {/* Its stars, one by one, then the friend steps out of the light. */}
          <p aria-label={`★${r.card.rarity}`} className="flex justify-center gap-0.5 text-xl leading-none">
            {Array.from({ length: r.card.rarity }, (_, i) => (
              <motion.span
                key={i}
                aria-hidden
                style={{ color: r.card.rarity === 5 ? '#d0567a' : '#e8a317' }}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 420, damping: 14 }}
              >
                ★
              </motion.span>
            ))}
          </p>
          <motion.img
            src={assetPath(r.card.art)}
            alt=""
            aria-hidden
            className="mx-auto my-1 h-48 object-contain"
            style={{ filter: `drop-shadow(0 0 14px ${r.card.rarity === 5 ? 'rgba(255,150,200,0.8)' : r.card.rarity === 4 ? 'rgba(255,210,90,0.8)' : 'rgba(200,215,240,0.7)'})` }}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          />
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
            <motion.p
              className="g-chip mt-3 text-sm"
              style={{ background: '#e2453c', color: '#fff', borderColor: 'transparent' }}
              initial={{ scale: 2.4, rotate: -14, opacity: 0 }}
              animate={{ scale: 1, rotate: -3, opacity: 1 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 480, damping: 16 }}
            >
              <RubyText showFurigana={showFurigana}>NEW! 新(あたら)しい なかま！</RubyText>
            </motion.p>
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
