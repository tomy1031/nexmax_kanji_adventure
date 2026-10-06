import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { faceStyle } from '../../lib/faceCrop';
import { linesFor } from '../../data/companionLines';
import { kanjiOf } from '../../data/charKanji';
import type { Individual } from '../../data/individuals';
import { WrittenWord } from './WrittenKanji';
import { TraceWord } from './TraceWord';
import { GachaCard } from './GachaCard';
import { StarBurst, StarFall } from './Sparkles';
import { star5PowerOf } from '../../lib/star5Power';
import * as sfx from '../../lib/sfx';
import { useGameStore } from '../../store/gameStore';
import { getKanjiByChar } from '../../lib/kanjiDb';

/**
 * One card comes out (docs/design/17 §2, 18 §3): from the book it comes to
 * the middle face down (its back the rarity's colour), turns over to paper,
 * and the companion's character — their name — writes itself on it in stroke
 * order; its reading comes under it. The companion's shadow rises behind the
 * card, the light bursts, and they step out: large, their character huge
 * behind them, their stars, their name, and their line cutting in on a band.
 *
 * `trace` (one pull): the player traces the character on the card to call
 * the companion (TraceWord, 2026-10-07) — or taps おまかせ and it writes itself.
 *
 * `short` (a ★3 among ten): the character is there at once, no shadow, and the
 * companion goes on by themselves after a moment. Any tap before the companion
 * (or スキップ) goes straight to them; on them a tap goes on. With ten,
 * 「ぜんぶ スキップ」 goes to the result at once.
 *
 * No filter anywhere (iPhone): glows are gradients, the shadow is the picture
 * used as a mask over a dark plate.
 */

type Phase = 'enter' | 'turn' | 'write' | 'read' | 'shadow' | 'burst' | 'entry';

const LIGHT: Record<number, { glow: string; rays: string; star: string; band: string }> = {
  3: { glow: 'rgba(205,220,245,0.85)', rays: 'rgba(220,230,250,0.14)', star: '#eef3ff', band: 'linear-gradient(90deg, #1d2b4a, #31476f)' },
  4: { glow: 'rgba(255,205,90,0.9)', rays: 'rgba(255,211,106,0.24)', star: '#ffd36a', band: 'linear-gradient(90deg, #3a2410, #6b4512)' },
  5: { glow: 'rgba(255,160,220,0.95)', rays: 'rgba(255,143,193,0.28)', star: '#ffd36a', band: 'linear-gradient(90deg, #3a1f5c, #6a2f6e)' },
};

export const KanjiReveal = ({
  card,
  fresh,
  note,
  showFurigana,
  still,
  short = false,
  arrived = false,
  count,
  trace = false,
  onClose,
  onSkipAll,
}: {
  card: Individual;
  fresh: boolean;
  /** Why this card was certain (the first ticket, the ceiling). */
  note?: string;
  showFurigana: boolean;
  still: boolean;
  /** A ★3 among ten: quick, and it goes on by itself. */
  short?: boolean;
  /** The card is already where it waits (one pull: the book put it there). */
  arrived?: boolean;
  /** Among ten: which this is, e.g. "3 / 10". */
  count?: string;
  /** The player traces the character to call the companion (one pull). */
  trace?: boolean;
  onClose: () => void;
  /** Among ten: skip the rest and go to the result. */
  onSkipAll?: () => void;
}) => {
  const k = kanjiOf(card.char);
  const light = LIGHT[card.rarity];
  /** A ★5 has its own, louder show (2026-10-06「星5の演出はスペシャルに」). */
  const five = card.rarity === 5;
  const power = star5PowerOf(card.id);
  // 動きを 少なく keeps every step (2026-10-06: it used to jump to the companion) — only gentler.
  const [phase, setPhase] = useState<Phase>('enter');
  // The card's width: big on a phone, not huge on a tablet.
  const [cardW] = useState(() => Math.round(Math.min(window.innerWidth * 0.56, window.innerHeight * 0.3, 240)));
  const line = linesFor(card).start;
  const english = useGameStore((s) => s.settings.english);
  const meaning = [...k.kanji]
    .map((c) => getKanjiByChar(c)?.meanings[0])
    .filter((m) => m != null)
    .join(' + ');
  // なぞって よぶ: tracing until it is written, or おまかせ (it writes itself).
  const [auto, setAuto] = useState(!trace);
  const [traced, setTraced] = useState(false);
  const tracing = phase === 'write' && !auto;
  /** The player has tapped this card: no going on by itself. */
  const [touched, setTouched] = useState(false);
  /** Goes on once, whatever asks first. */
  const gone = useRef(false);
  const goOn = () => {
    if (gone.current) return;
    gone.current = true;
    onClose();
  };

  useEffect(() => {
    const after: Partial<Record<Phase, [Phase, number]>> = {
      enter: ['turn', arrived ? 200 : short ? 300 : 520],
      turn: ['write', 360],
      // A beat longer than the reading alone: its meaning (EN) is under it.
      read: short ? ['burst', 420] : ['shadow', 1000],
      shadow: ['burst', card.rarity === 5 ? 1300 : 900],
      burst: ['entry', 340],
    };
    if (phase === 'turn') sfx.tap();
    if (phase === 'read') sfx.chime();
    if (phase === 'burst') sfx.beam();
    if (phase === 'entry') {
      if (card.rarity === 5) sfx.fanfare();
      else sfx.star(card.rarity === 4 ? 2 : 0);
    }
    const step = after[phase];
    if (step) {
      const t = setTimeout(() => setPhase(step[0]), step[1]);
      return () => clearTimeout(t);
    }
    // A ★3 among ten goes on by itself — unless the player has tapped this
    // card: then they lead, and only their tap goes on (2026-10-06 タップと
    // 自動が 同時に 起こる).
    if (phase === 'entry' && short && !touched) {
      const t = setTimeout(goOn, 1300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, card.rarity, short, touched]);

  const entry = phase === 'entry';
  const tap = () => {
    setTouched(true);
    if (entry) goOn();
    else setPhase('entry');
  };
  const cardShown = phase !== 'burst' && phase !== 'entry';
  const written = phase === 'read' || phase === 'shadow';

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`★${card.rarity} ${card.shortName}`}
      className="fixed inset-0 z-[60] overflow-hidden"
      style={{ background: '#0d0618' }}
      // No fade in: it takes over from the book (or the card before) at once.
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={tap}
    >
      {!entry && (
        <>
          <img src={assetPath('img/gacha/portal.webp')} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <motion.div
            aria-hidden
            className="absolute top-[38%] left-1/2 aspect-square w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, ${light.glow}, transparent 62%)`, willChange: 'transform, opacity' }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={phase === 'shadow' || phase === 'burst' ? { scale: 1.25, opacity: 1 } : { scale: 0.8, opacity: 0.7 }}
            transition={{ duration: phase === 'shadow' ? 0.8 : 0.5, ease: 'easeOut' }}
          />
        </>
      )}

      {/* A ★5: lightning while the shadow rises. */}
      {five && phase === 'shadow' && !still && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(197,139,255,0.6))' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.75, 0, 0, 0.6, 0, 0.35, 0] }}
          transition={{ duration: 1.2, times: [0, 0.06, 0.16, 0.45, 0.5, 0.6, 0.8, 1] }}
        />
      )}

      {/* The companion's shadow, rising in the light behind the card. */}
      {(phase === 'shadow' || phase === 'burst') && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 top-[4%] h-[66dvh]"
          style={{
            background: '#1a0f2e',
            WebkitMaskImage: `url(${assetPath(card.art)})`,
            maskImage: `url(${assetPath(card.art)})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            willChange: 'transform, opacity',
          }}
          initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.86, y: 30 }}
          animate={still ? { opacity: 0.92 } : { opacity: 0.92, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}

      {/* A ★5: a rainbow ring turns behind the card from the moment it comes (still, with 動きを 少なく). */}
      {five && cardShown && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-[38%] left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: cardW * 2.1, background: 'conic-gradient(from 0deg, rgba(255,143,193,0.75), rgba(255,211,106,0.75), rgba(139,224,168,0.75), rgba(127,178,255,0.75), rgba(197,139,255,0.75), rgba(255,143,193,0.75))', maskImage: 'radial-gradient(circle, transparent 38%, #000 40%, #000 52%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, transparent 38%, #000 40%, #000 52%, transparent 70%)', willChange: 'transform' }}
          initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
          animate={still ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 360 }}
          transition={{ opacity: { duration: 0.4 }, scale: { duration: 0.5 }, rotate: { duration: 3, repeat: Infinity, ease: 'linear' } }}
        />
      )}

      {/* The card: in face down, over, and the name written on its paper. */}
      {cardShown && (
        <motion.div
          aria-hidden
          className="absolute top-[38%] left-1/2"
          style={{ width: cardW, marginLeft: -cardW / 2, marginTop: -cardW * 0.75, willChange: 'transform, opacity' }}
          initial={arrived ? { y: 0, scale: 1, rotate: 0, opacity: 1 } : still ? { y: 0, scale: 1, rotate: 0, opacity: 0 } : { y: '-40vh', scale: 0.4, rotate: -14, opacity: 0 }}
          animate={phase === 'shadow' ? { y: 0, scale: still ? 1 : 0.7, rotate: 0, opacity: 0.92 } : { y: 0, scale: 1, rotate: 0, opacity: 1 }}
          transition={phase === 'enter' ? { type: 'spring', stiffness: 170, damping: 18 } : { duration: 0.6, ease: 'easeInOut' }}
        >
          {/* It turns: the back narrows away, the paper widens in. */}
          <motion.div
            key={phase === 'enter' ? 'back' : 'paper'}
            initial={still ? { opacity: phase === 'enter' ? 1 : 0 } : { scaleX: phase === 'enter' ? 1 : 0 }}
            animate={still ? { opacity: 1 } : { scaleX: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {phase === 'enter' ? (
              <GachaCard card={card} face="back" width={cardW} showFurigana={showFurigana} />
            ) : (
              <GachaCard card={card} face="paper" width={cardW} showFurigana={showFurigana}>
                {phase !== 'turn' &&
                  (tracing ? (
                    <TraceWord
                      word={k.kanji}
                      size={Math.round(cardW * 0.7)}
                      onDone={() => {
                        setTraced(true);
                        setPhase((p) => (p === 'write' ? 'read' : p));
                      }}
                    />
                  ) : (
                    <WrittenWord word={k.kanji} size={Math.round(cardW * 0.7)} still={short || traced} onDone={() => setPhase((p) => (p === 'write' ? 'read' : p))} />
                  ))}
              </GachaCard>
            )}
          </motion.div>
          {tracing && (
            // No words needed: a hand, a brush, and the model to follow.
            <>
              <motion.p
                className="g-outline-text absolute inset-x-[-30%] -top-14 text-center text-2xl font-black text-white"
                initial={{ opacity: 0, y: 8 }}
                animate={still ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -4, 0] }}
                transition={still ? { duration: 0.3 } : { y: { duration: 1, repeat: Infinity }, opacity: { duration: 0.3 } }}
              >
                ✍️ <RubyText showFurigana={showFurigana}>書(か)いて よびましょう！</RubyText>
              </motion.p>
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  data-tap
                  className="rounded-full border-2 border-white/40 bg-black/40 px-4 text-sm leading-[2.2] font-black text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAuto(true);
                  }}
                >
                  <RubyText showFurigana={showFurigana}>おまかせ ▶</RubyText>
                </button>
              </div>
            </>
          )}
          {written && (
            <motion.p
              className="g-outline-text mt-1 text-center text-3xl font-black text-white"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: phase === 'shadow' ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {k.reading}
              {/* What the character means, in English (on by default): a reason to care about it before reading it. */}
              {english && meaning && (
                <span lang="en" className="block text-base font-bold text-[#ffe9a8]">
                  {meaning}
                </span>
              )}
            </motion.p>
          )}
        </motion.div>
      )}

      {phase === 'burst' && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 38%, #fff, ${light.glow} 55%, #fff)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
        />
      )}
      {five && phase === 'burst' && !still && (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[38%] h-0">
          {[0, 1, 2].map((k) => (
            <motion.span
              key={k}
              className="absolute top-0 left-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px]"
              style={{ width: '30vmin', borderColor: ['#ff8fc1', '#ffd36a', '#7fb2ff'][k] }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 4.5, opacity: 0 }}
              transition={{ delay: k * 0.08, duration: 0.6, ease: 'easeOut' }}
            />
          ))}
          <StarBurst n={20} />
        </div>
      )}

      {entry && (
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 38%, ${card.rarity === 5 ? '#4a2470' : card.rarity === 4 ? '#5a3a12' : '#26314a'}, #0d0618 75%)` }}
          initial={{ opacity: still ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          {card.rarity >= 4 && (
            <motion.div
              aria-hidden
              className="absolute top-[38%] left-1/2 aspect-square w-[170vmax] -translate-x-1/2 -translate-y-1/2"
              style={{
                background: `repeating-conic-gradient(from 0deg, ${light.rays} 0deg 7deg, transparent 7deg 15deg${card.rarity === 5 ? ', rgba(127,178,255,0.24) 15deg 22deg, transparent 22deg 30deg' : ''})`,
                willChange: 'transform',
              }}
              animate={still ? undefined : { rotate: 360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            />
          )}
          {/* Their character, huge, behind them (two stand one above the other). */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-[34%] left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none font-black"
            style={{
              fontSize: k.kanji.length > 1 ? 'min(50vw, 29dvh)' : 'min(88vw, 52dvh)',
              color: 'rgba(255,224,160,0.2)',
              textShadow: '0 0 30px rgba(255,200,120,0.35)',
              writingMode: k.kanji.length > 1 ? 'vertical-rl' : undefined,
            }}
            initial={{ scale: still ? 1 : 1.35, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {k.kanji}
          </motion.span>
          <div aria-hidden className="absolute top-[32%] left-1/2 aspect-square w-[82vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${light.glow}, transparent 66%)`, opacity: 0.55 }} />

          <motion.img
            src={assetPath(card.art)}
            alt=""
            aria-hidden
            className="absolute top-[6%] left-1/2 h-[54dvh] w-auto max-w-[92vw] -translate-x-1/2 object-contain"
            initial={{ scale: still ? 1 : 1.35, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 190, damping: 17 }}
          />

          {/* Their stars and name, under the picture. */}
          <div className="absolute inset-x-0 top-[57%] flex flex-col items-center px-4">
            {note && (
              <p className="g-chip g-chip-gold mb-1 text-xs">
                <RubyText showFurigana={showFurigana}>{note}</RubyText>
              </p>
            )}
            <p className="flex gap-1 text-3xl leading-none" aria-hidden>
              {Array.from({ length: card.rarity }, (_, i) => (
                <motion.span
                  key={i}
                  style={{ color: light.star, textShadow: card.rarity === 5 ? '0 0 10px #ff8fc1' : '0 0 8px rgba(0,0,0,0.6)' }}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: still ? 0 : 0.25 + i * 0.1, type: 'spring', stiffness: 400, damping: 14 }}
                >
                  ★
                </motion.span>
              ))}
            </p>
            {/* 「役職：名前」: the title, then the name large. */}
            <motion.p
              className="g-outline-text mt-1 text-center font-black text-white"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: still ? 0 : 0.6 }}
            >
              <span className="text-lg">
                <RubyText showFurigana={showFurigana}>{`${card.title}：`}</RubyText>
              </span>
              <span className="text-3xl">
                <RubyText showFurigana={showFurigana}>{card.shortName}</RubyText>
              </span>
            </motion.p>
          </div>

          {/* セリフの カットイン: a slanted band runs in, the companion's face and their line on it. */}
          <motion.div
            className="absolute inset-x-[-6%] top-[76%] flex items-center gap-3 overflow-hidden border-y-[3px] border-[#e8c26a] py-2 pr-[10%] pl-[9%]"
            style={{ background: light.band, rotate: '-4deg', boxShadow: '0 6px 18px rgba(0,0,0,0.45)' }}
            initial={still ? { x: 0, opacity: 0 } : { x: '110%' }}
            animate={still ? { x: 0, opacity: 1 } : { x: 0 }}
            transition={{ delay: still ? 0 : 0.75, type: 'spring', stiffness: 260, damping: 26 }}
          >
            <span aria-hidden className="h-16 w-16 shrink-0 rounded-full border-[3px] border-[#e8c26a] bg-[#fff8e6]" style={faceStyle(card.art, 58, 1.15)} />
            <p className="g-outline-text min-w-0 flex-1 text-lg leading-[1.85] font-black text-white">
              「<RubyText showFurigana={showFurigana}>{line}</RubyText>」
            </p>
            {!still && (
              // A light runs along the band once it is in.
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3"
                style={{ background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                initial={{ left: '-40%' }}
                animate={{ left: '110%' }}
                transition={{ delay: 1.05, duration: 0.7, ease: 'easeOut' }}
              />
            )}
          </motion.div>

          {card.rarity >= 4 && !still && <StarFall n={five ? 22 : 10} rainbow={five} />}
          {five && power && (
            // ★5 だけの ちから: what makes this card special, said at once (docs/design/18 §2).
            <motion.div
              className="absolute inset-x-3 top-[max(52px,calc(env(safe-area-inset-top)+44px))] rounded-2xl border-2 border-[#ffd36a] px-3 py-1.5 text-center"
              style={{ background: 'linear-gradient(90deg, rgba(122,63,208,0.92), rgba(208,86,122,0.92))', boxShadow: '0 0 18px rgba(255,180,230,0.7)' }}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: still ? 0 : 1.3, type: 'spring', stiffness: 300, damping: 20 }}
            >
              <p className="text-sm font-black text-[#ffe9a8]">
                <RubyText showFurigana={showFurigana}>{`★5 だけの ちから「${power.name}」`}</RubyText>
              </p>
              <p className="text-xs leading-[1.8] font-bold text-white">
                <RubyText showFurigana={showFurigana}>{power.says}</RubyText>
              </p>
            </motion.div>
          )}
          {fresh && (
            <motion.span
              className={`absolute right-[7%] rounded-xl border-4 border-white bg-[#e2453c] px-3 py-1 text-2xl font-black text-white ${five && power ? 'top-[20%]' : 'top-[8%]'}`}
              initial={{ scale: 3, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ delay: still ? 0 : 1, type: 'spring', stiffness: 500, damping: 18 }}
            >
              NEW!
            </motion.span>
          )}
          {!short && (
            <p className="absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] text-center text-xs text-white/70">
              <RubyText showFurigana={showFurigana}>タップで つぎへ</RubyText>
            </p>
          )}
        </motion.div>
      )}

      {/* Among ten: which card this is, and 「ぜんぶ スキップ」. */}
      {count && (
        <p className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 rounded-full bg-black/45 px-3 py-1 text-sm font-black text-white tabular-nums">{count}</p>
      )}
      {onSkipAll ? (
        <button
          type="button"
          data-tap
          className="absolute top-[max(10px,env(safe-area-inset-top))] right-3 rounded-full border-2 border-white/80 bg-black/50 px-4 py-2 text-base font-black text-white"
          onClick={(e) => {
            e.stopPropagation();
            onSkipAll();
          }}
        >
          <RubyText showFurigana={showFurigana}>ぜんぶ スキップ ▶▶</RubyText>
        </button>
      ) : (
        !entry && (
          <button
            type="button"
            data-tap
            className="absolute right-4 bottom-[max(16px,env(safe-area-inset-bottom))] rounded-full border-2 border-white/70 bg-black/40 px-4 py-1.5 text-sm font-black text-white"
            onClick={(e) => {
              e.stopPropagation();
              setTouched(true);
              setPhase('entry');
            }}
          >
            スキップ ▶
          </button>
        )
      )}
    </motion.div>
  );
};

export default KanjiReveal;
