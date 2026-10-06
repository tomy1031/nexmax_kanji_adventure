import { useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { afterEpisodePath } from '../../data/mojiFlow';
import { UNLOCKED_ON_MOJI } from '../../data/unlocks';
import { motion, AnimatePresence } from 'framer-motion';
import { SummonOverlay } from './SummonOverlay';
import { KanjiReveal } from './KanjiReveal';
import { SingleResult } from './SingleResult';
import { MultiResult } from './MultiResult';
import { BannerHero, BannerInfo, CardCompare } from './GachaBanner';
import { useGameStore } from '../../store/gameStore';
import {
  BANNERS,
  BANNER_ORDER,
  WEEKDAY_ELEMENT,
  WEEKDAY_KANJI,
  dayOf,
  featuredOf,
  kanjiBoost,
  weekdayBoost,
  type Boost,
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
import { CLASS_LABEL, CLASS_OF_ELEMENT } from '../../lib/forge/weapon';
import { ELEMENT_LABEL } from '../../lib/forge/elements';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { MOJI_OWN_REPS } from '../../lib/mastery';
import { kanjiOf } from '../../data/charKanji';
import { todayKey } from '../../store/gameStore';
import { useStill } from '../../hooks/useStill';

/**
 * The gem shop (docs/design/11 §5).
 *
 * Five gachas (lib/gacha.ts BANNER_ORDER), each with a picture on its tab and
 * its odds and ceiling printed under its buttons, and one free pull a day. The
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

export const GachaScreen = () => {
  useBgm('shop');
  const navigate = useNavigate();
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
  // 曜日の ガチャ: today's element. 字の ガチャ: the friends whose own kanji are written (★1).
  const [day] = useState(() => dayOf());
  const progress = useGameStore((s) => s.progress);
  const written = (c: string) => {
    const k = getKanjiByChar(c);
    return k != null && (progress[k.id]?.reps ?? 0) >= MOJI_OWN_REPS;
  };
  const boost: Boost | undefined = bannerId === 'weekday' ? weekdayBoost(day) : bannerId === 'kanji' ? kanjiBoost(written) : undefined;
  const boosted = boost ? CARDS.filter((c) => met(c) && boost(c)) : [];
  const dayClass = CLASS_LABEL[CLASS_OF_ELEMENT[WEEKDAY_ELEMENT[day]]];
  // One free pull a day, on any gacha.
  const freeDay = useGameStore((s) => s.freePullDay);
  const spendFree = useGameStore((s) => s.useFreePull);
  const freeToday = freeDay !== todayKey();

  const [results, setResults] = useState<Shown[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  /** The pull being shown coming out of the book (SummonOverlay), before its cards come out one by one. */
  const [summon, setSummon] = useState<Shown[] | null>(null);
  /** The cards coming out one by one (KanjiReveal), and which one is out now (docs/design/18 §3). */
  const [seq, setSeq] = useState<{ list: Shown[]; at: number } | null>(null);
  const still = useStill();

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
    const r = pull(bannerId, owned, pity, week, Math.random, first, met, boost);
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
    const r = pull(bannerId, owned, pity, week, Math.random, false, met, boost);
    setPity(pityAfter(bannerId, pity, r));
    setSummon(apply([r]));
  };

  /** Today's free pull, on the gacha shown. */
  const doFree = () => {
    if (busy || !spendFree()) return;
    setBusy(true);
    const r = pull(bannerId, owned, pity, week, Math.random, false, met, boost);
    setPity(pityAfter(bannerId, pity, r));
    setSummon(apply([r]).map((s) => ({ ...s, note: s.note ?? 'きょうの むりょう' })));
  };

  const doMulti = () => {
    if (!canMulti || !spendGems(banner.multi)) return;
    setBusy(true);
    const { results: rs, pityAfter: p } = pullMany(bannerId, owned, pity, week, Math.random, met, boost);
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
  /** The banner's star (docs/design/18 §5): this week's ★5, the best boosted friend, or the best card the banner shows. */
  const bestBoosted = [...boosted].sort((a, b) => b.rarity - a.rarity)[0];
  const featured =
    bannerId === 'pickup'
      ? pick.five
      : bestBoosted ?? showcase(bannerId === 'town' ? ['rin-4', 'teacher', 'baker-4'] : ['ENTJ-5', 'ISTJ-5', 'rin-5'], banner, met)[0];
  const featuredLabel =
    bannerId === 'pickup'
      ? `今週(こんしゅう)の ピックアップ ★${featured.rarity}`
      : bestBoosted
        ? `${bannerId === 'weekday' ? 'きょうの' : '書(か)いた 字(じ)の'} なかま ★${featured.rarity}`
        : `この ガチャの 目(め)玉(だま) ★${featured.rarity}`;
  const ribbon =
    bannerId === 'pickup'
      ? `ピックアップは あと ${daysLeft}日(にち)`
      : bannerId === 'town'
        ? '町(まち)の なかまだけ・★4が 出(で)やすい'
        : bannerId === 'weekday'
          ? `${dayClass.ja}(${dayClass.reading})が とくいな なかま ↑`
          : bannerId === 'kanji'
            ? boosted.length > 0
              ? `書(か)いた 字(じ)の なかま ↑（${boosted.length}人(にん)）`
              : '字(じ)を 書(か)くと なかまが ふえる'
            : 'ぜんぶの なかまが 出(で)る';
  const isFeaturedCard = (c: Individual) => featuredOf(bannerId, c.rarity, week, met, boost).some((f) => f.id === c.id);

  return (
    <div className="relative min-h-dvh bg-[#0d0618] pb-8">
      {/* The gacha square at dusk (docs/design/18 §5). */}
      <img src={assetPath('img/gacha/pickup_bg.webp')} alt="" aria-hidden className="pointer-events-none fixed inset-0 h-full w-full object-cover" />
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: 'linear-gradient(180deg, rgba(13,6,24,0.55), rgba(13,6,24,0.15) 30%, rgba(13,6,24,0.35) 65%, rgba(13,6,24,0.8))' }} />
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
        {/* Five gachas: a picture on each tab, so they are told apart without reading. */}
        <div className="-mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]" role="tablist" aria-label="ガチャの しゅるい">
          {BANNER_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={bannerId === id}
              onClick={() => setBannerId(id)}
              className="g-btn shrink-0 !min-h-[44px] !gap-1 !px-2.5 text-xs"
              style={{ background: bannerId === id ? 'var(--accent)' : 'var(--panel-solid)', color: bannerId === id ? '#fff' : 'var(--ink)' }}
            >
              <span aria-hidden className="text-base">
                {BANNERS[id].tab.icon}
              </span>
              <RubyText showFurigana={showFurigana}>{BANNERS[id].tab.label}</RubyText>
            </button>
          ))}
        </div>
      </header>

      <main className="relative mx-auto max-w-md px-3 pt-2 text-center">
        {/* The title plate. */}
        <div className="relative mx-auto w-[96%]">
          <img src={assetPath('img/gacha/title_plate.webp')} alt="" aria-hidden className="w-full" />
          <h2 className="g-outline-text absolute inset-x-[14%] top-[56%] -translate-y-1/2 text-[min(7.5vw,30px)] leading-tight font-black text-[#ffe9a8]">
            <RubyText showFurigana={showFurigana}>{banner.name}</RubyText>
          </h2>
        </div>
        <p className="g-outline-text -mt-1 text-xs font-bold text-white/90">
          <RubyText showFurigana={showFurigana}>字(じ)が つなぐ、あたらしい なかま</RubyText>
        </p>

        {/* 曜日: the week's kanji — the first the town gave back — with today's lit. 字: the friends' kanji already written. */}
        {bannerId === 'weekday' && (
          <div className="mt-1 flex justify-center gap-1" aria-label={`きょうは ${WEEKDAY_KANJI[day][0]}よう日`}>
            {WEEKDAY_KANJI.map((k, i) => (
              <span
                key={k}
                className="flex h-11 w-10 items-end justify-center rounded-lg border-2 pb-0.5 text-xl leading-none font-black"
                style={
                  i === day
                    ? { background: ELEMENT_LABEL[WEEKDAY_ELEMENT[i]].color, borderColor: '#fff3b0', color: '#1a0f26', boxShadow: `0 0 12px ${ELEMENT_LABEL[WEEKDAY_ELEMENT[i]].color}`, transform: 'scale(1.15)' }
                    : { background: 'rgba(20,12,6,0.6)', borderColor: 'rgba(255,233,168,0.35)', color: 'rgba(255,233,168,0.6)' }
                }
              >
                <RubyText showFurigana={showFurigana}>{k}</RubyText>
              </span>
            ))}
          </div>
        )}
        {bannerId === 'kanji' && (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {CARDS.filter((c) => c.id === c.char && met(c)).map((c) => {
              const k = kanjiOf(c.char).kanji;
              const on = [...k].every(written);
              return (
                <span
                  key={c.id}
                  className="flex h-7 min-w-7 items-center justify-center rounded-md border px-1 text-sm leading-none font-black"
                  style={on ? { background: '#fff8e6', borderColor: '#f2c45a', color: '#24180d' } : { background: 'rgba(20,12,6,0.6)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.35)' }}
                >
                  {on ? <RubyText showFurigana={false}>{k}</RubyText> : '？'}
                </span>
              );
            })}
          </div>
        )}

        <BannerHero card={featured} showFurigana={showFurigana} still={still} />

        <div className="relative z-[1] mx-auto -mt-3 w-[82%]">
          <img src={assetPath('img/gacha/ribbon.webp')} alt="" aria-hidden className="w-full" />
          <p className="g-outline-text absolute inset-x-[16%] top-1/2 -translate-y-1/2 text-[13px] font-black text-white">
            <RubyText showFurigana={showFurigana}>{ribbon}</RubyText>
          </p>
        </div>

        <BannerInfo card={featured} label={featuredLabel} showFurigana={showFurigana} />
        {bannerId === 'pickup' && (
          <p className="g-outline-text mt-1 text-xs font-bold text-white/90">
            <RubyText showFurigana={showFurigana}>{`★4 ピックアップ：${pick.fours[0].shortName}・${pick.fours[1].shortName}`}</RubyText>
          </p>
        )}

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

          {freeToday && (
            // One free pull a day (2026-10-07): the reason to open the gacha today.
            <motion.button
              type="button"
              data-tap
              className="g-btn mt-3 w-full !min-h-[56px] text-base"
              style={{ background: 'linear-gradient(180deg,#9df0b0,#3fae5a)', color: '#0f2a14', borderColor: '#e3ffe8' }}
              disabled={busy}
              onClick={doFree}
              animate={still ? undefined : { scale: [1, 1.03, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              <span aria-hidden className="text-2xl">
                🎁
              </span>
              <RubyText showFurigana={showFurigana}>きょうの 1回(かい) むりょう！</RubyText>
            </motion.button>
          )}

          {/* 1回 and 10回, side by side. */}
          <div className="mt-3 flex gap-2">
            <button type="button" className="relative flex h-16 flex-1 items-center justify-center disabled:opacity-45" disabled={!canSingle} onClick={doSingle}>
              <img src={assetPath('img/gacha/btn_blue.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
              <span className="g-outline-text relative flex flex-col leading-tight font-black text-white">
                <span className="text-lg">
                  <RubyText showFurigana={showFurigana}>1回(かい) ひく</RubyText>
                </span>
                <span className="text-xs">◆{banner.single}</span>
              </span>
            </button>
            <button type="button" className="relative flex h-16 flex-1 items-center justify-center disabled:opacity-45" disabled={!canMulti} onClick={doMulti}>
              <img src={assetPath('img/gacha/btn_gold.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
              <span className="relative flex flex-col leading-tight font-black text-[#3a2414]">
                <span className="text-lg">
                  <RubyText showFurigana={showFurigana}>10回(かい) ひく</RubyText>
                </span>
                <span className="text-xs">◆{banner.multi}</span>
              </span>
            </button>
          </div>
          <p className="g-outline-text mt-1 text-xs font-black text-[#ffe9a8]">
            <RubyText showFurigana={showFurigana}>10回(かい)で ★4 いじょうが かならず 1まい！</RubyText>
          </p>
          {banner.ceiling && (
            // How far the ★5 ceiling is, at a glance (docs/design/16 §6).
            <div className="mt-2 rounded-xl bg-black/35 px-3 py-1.5 text-left text-[11px] font-black text-white">
              <div className="flex justify-between">
                <RubyText showFurigana={showFurigana}>{`★5 かくてい まで あと ${pullsUntilStar5(pity)}回(かい)`}</RubyText>
                <span className="tabular-nums">
                  {pity} / {STAR5_CEILING}
                </span>
              </div>
              <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full" style={{ width: `${(pity / STAR5_CEILING) * 100}%`, background: 'linear-gradient(90deg,#ff8fc1,#ffd36a,#8be0a8,#7fb2ff)' }} />
              </div>
            </div>
          )}
          {!canMulti && !busy && (
            <p className="g-outline-text mt-1.5 text-xs text-white/90">
              <RubyText showFurigana={showFurigana}>
                {daysToMulti > 0
                  ? `10回(かい)ぶんまで あと ◆${banner.multi - gems}。毎日(まいにち)の やること 全部(ぜんぶ)で あと ${daysToMulti}日(にち)。`
                  : 'ジェムが たりません。'}
              </RubyText>
            </p>
          )}

          {/* かくりつ・キャラ・きまり: nothing hidden, one tap away. */}
          <div className="mt-3 flex gap-2">
            {(
              [
                ['かくりつ', () => setRatesOpen(true)],
                ['キャラ', () => setCompareOpen(true)],
                ['きまり', () => setRulesOpen(true)],
              ] as const
            ).map(([label, open]) => (
              <button key={label} type="button" data-tap className="relative flex h-11 flex-1 items-center justify-center" onClick={open}>
                <img src={assetPath('img/gacha/btn_menu.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
                <span className="relative text-sm font-black text-[#ffe9a8]">{label}</span>
              </button>
            ))}
          </div>
      </main>

      <AnimatePresence>
        {compareOpen && <CardCompare card={featured} owned={owned} showFurigana={showFurigana} still={still} onClose={() => setCompareOpen(false)} />}
      </AnimatePresence>
      {/* きまり: the rules in words — chances, the ceiling, きずな, and that money is never used. */}
      <AnimatePresence>
        {rulesOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRulesOpen(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="rules-title" className="g-panel-solid w-full max-w-sm p-4 text-left text-xs" style={{ color: 'var(--ink-2)' }} onClick={(e) => e.stopPropagation()}>
              <h2 id="rules-title" className="g-title text-base">
                <RubyText showFurigana={showFurigana}>{`${banner.name}の きまり`}</RubyText>
              </h2>
              <ul className="mt-2 space-y-1.5">
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
                {bannerId === 'weekday' && (
                  <li>
                    <RubyText showFurigana={showFurigana}>{`まいにち かわります。きょうは ${dayClass.ja}(${dayClass.reading})が とくいな なかまが、★ごとに 半分(はんぶん) 出(で)ます`}</RubyText>
                  </li>
                )}
                {bannerId === 'kanji' && (
                  <li>
                    <RubyText showFurigana={showFurigana}>なかまの 字(じ)を 書(か)くと（★1）、その なかまが ★ごとに 半分(はんぶん) 出(で)ます</RubyText>
                  </li>
                )}
                <li>
                  <RubyText showFurigana={showFurigana}>1日(にち)に 1回(かい) むりょうで ひけます</RubyText>
                </li>
                {banner.ceiling && (
                  <li>
                    <RubyText showFurigana={showFurigana}>{`★5は ${STAR5_CEILING}回(かい)で かならず 出(で)ます（町(まち)の ガチャ いがい）`}</RubyText>
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
              <button type="button" data-tap className="g-btn g-btn-primary mt-3 w-full" onClick={() => setRulesOpen(false)}>
                <RubyText showFurigana={showFurigana}>とじる</RubyText>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                {cardRates(bannerId, owned, week, met, boost).map(({ card, rate }) => (
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
                <RubyText showFurigana={showFurigana}>チケットで なかまを よびましょう！</RubyText>
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
            // One pull: the player traces its character to call the companion (なぞって よぶ).
            trace={seq.list.length === 1}
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
                isPickup={isFeaturedCard}
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
