import { useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { NightStreetBackdrop } from '../write/NightStreet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { afterEpisodePath } from '../../data/mojiFlow';
import { UNLOCKED_ON_MOJI } from '../../data/unlocks';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SummonOverlay } from './SummonOverlay';
import { KanjiReveal } from './KanjiReveal';
import { SingleResult } from './SingleResult';
import { MultiResult } from './MultiResult';
import { NexmaxSays } from '../../components/ui/Chrome';
import { kanjiOf } from '../../data/charKanji';
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
import { useBgm } from '../../lib/bgm';

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

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`★${n}`} className="leading-none" style={{ color: n === 5 ? '#d0567a' : '#e8a317' }}>
    {'★'.repeat(n)}
  </span>
);

/** The banner's three faces: the chosen ones the story has met, topped up with others it can give. */
const showcase = (ids: string[], banner: Banner, met: Met): Individual[] => {
  const chosen = ids.map((id) => getIndividual(id)!).filter(met);
  const more = CARDS.filter((c) => banner.has(c) && met(c) && !chosen.includes(c)).sort((a, b) => b.rarity - a.rarity);
  return [...chosen, ...more].slice(0, 3);
};

/** The banner's picture: its cards standing together, the first one's character large behind them (docs/design/17 §4). */
const BannerArt = ({ cards }: { cards: Individual[] }) => {
  const big = cards[0] ? kanjiOf(cards[0].char).kanji : null;
  return (
    <div className="relative mx-auto flex h-40 items-end justify-center" aria-hidden>
      {big && (
        // Up to the left, above the shorter card beside the first, where the pictures leave it showing.
        <span className="absolute -top-2 left-1 leading-none font-black" style={{ fontSize: big.length > 1 ? 80 : 112, color: 'rgba(214,140,20,0.42)' }}>
          {big}
        </span>
      )}
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
};

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
  const [busy, setBusy] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  /** The pull being shown coming out of the book (SummonOverlay), before its cards come out one by one. */
  const [summon, setSummon] = useState<Shown[] | null>(null);
  /** The cards coming out one by one (KanjiReveal), and which one is out now (docs/design/18 §3). */
  const [seq, setSeq] = useState<{ list: Shown[]; at: number } | null>(null);
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);

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

  /** Out of the book: the cards come out one by one, then the result. */
  const dealt = () => {
    const list = summon ?? [];
    setSummon(null);
    setResults(list);
    setBusy(false);
    setSeq({ list, at: 0 });
  };
  /** The card out now has gone: the next one, or the result. */
  const nextCard = () => setSeq((q) => (q && q.at + 1 < q.list.length ? { ...q, at: q.at + 1 } : null));

  const close = () => {
    setResults(null);
    if (firstPulled && !firstDone) setHowTo(true);
  };

  const isMulti = results !== null && results.length > 1;
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

          {/* Nexmax waits by the buttons (docs/design/17 §4). */}
          <div className="mt-2 flex justify-center">
            <NexmaxSays text="どんな なかまに 出会(であ)えるかな？" pose="hello" size={56} flip />
          </div>

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

      {/* ひく 演出 (docs/design/17・18 §3): the book, then the cards one by one. */}
      <AnimatePresence>{summon && <SummonOverlay key="summon" rarities={summon.map((r) => r.card.rarity)} still={still} showFurigana={showFurigana} onDone={dealt} />}</AnimatePresence>
      <AnimatePresence>
        {seq && (
          <KanjiReveal
            key={`${seq.at}-${seq.list[seq.at].card.id}`}
            card={seq.list[seq.at].card}
            fresh={!seq.list[seq.at].duplicate}
            note={seq.list[seq.at].note ?? (seq.list[seq.at].guaranteed ? 'てんじょう' : undefined)}
            showFurigana={showFurigana}
            still={still}
            // One pull's card is already where it waits; among ten a ★3 is quick.
            arrived={seq.list.length === 1}
            short={seq.list.length > 1 && seq.list[seq.at].card.rarity === 3}
            count={seq.list.length > 1 ? `${seq.at + 1} / ${seq.list.length}` : undefined}
            onClose={nextCard}
            onSkipAll={seq.list.length > 1 ? () => setSeq(null) : undefined}
          />
        )}
      </AnimatePresence>

      {/* 結果 ------------------------------------------------------------ */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // The result reads on its own: the screen behind goes almost dark.
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0618]/95 px-4 py-6"
          >
            {isMulti ? (
              !seq && (
              <MultiResult
                results={results}
                still={still}
                showFurigana={showFurigana}
                isPickup={(c) => bannerId === 'pickup' && (c.id === pick.five.id || pick.fours.some((f) => f.id === c.id))}
                onClose={close}
                again={
                  canMulti
                    ? {
                        cost: banner.multi,
                        go: () => {
                          close();
                          doMulti();
                        },
                      }
                    : null
                }
              />
              )
            ) : (
              // After the companion has come out of their character (KanjiReveal), not under it.
              !seq && <SingleResult r={results[0]} showFurigana={showFurigana} still={still} onClose={close} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GachaScreen;
