import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMapPath } from '../../lib/nav';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { getKanjiById } from '../../lib/kanjiDb';
import { weaponOf } from '../../lib/forge/weapon';
import { preloadCharData } from '../../lib/strokeLoader';
import { preloadImages } from '../../lib/preload';
import { assetPath } from '../../lib/assetPath';
import { isVersusConfigured } from '../../lib/versusConfig';
import { playJingle, useBgm } from '../../lib/bgm';
import * as sfx from '../../lib/sfx';
import { getIndividual } from '../../data/individuals';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { SCENES } from '../picturebook/scenes';
import { useOwnedKanji } from '../moji/useOwnedKanji';
import { useCompactHeight } from '../../hooks/useCompactHeight';
import { networkManager, MatchCancelledError } from './NetworkManager';
import { BattleEventType, ratingChange, rankFor, type BattleEvent, type VersusProfile } from './types';
import { pickRound } from './round';
import { VersusFight } from './VersusFight';
import { cpuTurn } from './cpu';

/**
 * たいせん — two players, the same kanji, who writes them better.
 *
 * ロビー → さがす → VS（ふたりの なかまが 向き合い、3・2・1）→ 書き合い（NaniwaBattleView）
 * → 勝ち／負け. The relay is Supabase Realtime (NetworkManager); there are no
 * accounts, so each side introduces itself with a PROFILE — the なかま it
 * fights with, its rating, and the kanji it has, which the host uses to pick
 * a round both can write (round.ts).
 */

type Phase = 'idle' | 'searching' | 'matched' | 'fighting' | 'over';

/** The weapon's pull on a hit: at most +20%, so writing well always matters more. */
const MAX_WEAPON_BONUS = 0.2;
/** Nexmax himself, when no なかま is chosen. */
const NEXMAX_ART = 'img/chara/naniwa/nexmax_normal.webp';
const BACKDROP = SCENES.naniwa_lights_back?.photo ?? 'img/title/bg.webp';
/** After this long without a match, the search offers the CPU. */
const OFFER_CPU_AFTER_S = 8;
/** 1章's kanji: the round's last resort for two beginners. */
const BASIC = MOJI_CHAPTERS.find((c) => c.id === 'moji-1')?.kanji ?? [];

/**
 * The other side, when it fights without a なかま: not a second copy of this
 * side's Nexmax (two identical robots could not be told apart), but the rival.
 */
const RIVAL = 'ENTJ';
/** The なかま a profile fights with: its own if it has one we know, else the rival (other side) or none. */
const companionOf = (p: VersusProfile | null, rival: boolean) => getIndividual(p?.avatar ?? '') ?? (rival ? getIndividual(RIVAL) : undefined);
const artOf = (p: VersusProfile | null, rival = false) => companionOf(p, rival)?.art ?? NEXMAX_ART;
const nameOf = (p: VersusProfile | null) => companionOf(p, true)?.shortName ?? 'ネクマックス';

const Avatar = ({ src, mirrored = false, size }: { src: string; mirrored?: boolean; size: number }) => (
  <img
    src={assetPath(src)}
    alt=""
    aria-hidden
    draggable={false}
    className="pointer-events-none object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
    style={{ width: size, height: size * 1.25, transform: mirrored ? 'scaleX(-1)' : undefined }}
  />
);

const RankBadge = ({ rating, showFurigana }: { rating: number; showFurigana: boolean }) => {
  const rank = rankFor(rating);
  return (
    <span className="g-pill-night inline-flex items-center gap-1.5 px-3 py-1 text-sm font-black tabular-nums">
      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: rank.color }} />
      <RubyText showFurigana={showFurigana}>{rank.label}</RubyText>
      <span>{rating}</span>
    </span>
  );
};

export const VersusScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const weapons = useGameStore((s) => s.weapons);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const activeIndividual = useGameStore((s) => s.activeIndividual);
  const versus = useGameStore((s) => s.versus);
  const recordVersus = useGameStore((s) => s.recordVersusResult);
  const owned = useOwnedKanji();
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(useReducedMotion() || reduced);
  // A short phone (SE) keeps the lobby on one screen with a smaller Nexmax.
  const compact = useCompactHeight();

  const [phase, setPhase] = useState<Phase>('idle');
  const [waiting, setWaiting] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<string[]>([]);
  const [them, setThem] = useState<VersusProfile | null>(null);
  const [incoming, setIncoming] = useState<{ n: number; damage: number } | null>(null);
  const [won, setWon] = useState(false);
  const [delta, setDelta] = useState(0);
  const [count, setCount] = useState(3);
  /** Playing the CPU (no relay, no rating), not a person. */
  const [cpu, setCpu] = useState(false);

  useBgm(phase === 'fighting' ? 'boss' : phase === 'over' ? null : 'map');

  const weapon = useMemo(() => {
    const recipe = weapons.find((w) => w.id === equippedId);
    if (!recipe) return null;
    const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
    return kanji.length === recipe.kanjiIds.length ? weaponOf(kanji) : null;
  }, [weapons, equippedId]);
  /** 1.0 with nothing equipped, at most 1.2 with the best weapon. */
  const weaponBonus = weapon ? 1 + Math.min(MAX_WEAPON_BONUS, (weapon.attack / 96) * MAX_WEAPON_BONUS) : 1;

  const me: VersusProfile = useMemo(
    () => ({ avatar: activeIndividual, rating: versus.rating, wins: versus.wins, losses: versus.losses, known: [...owned] }),
    [activeIndividual, versus, owned],
  );
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // --- result -------------------------------------------------------------
  const cpuRef = useRef(false);
  useEffect(() => {
    cpuRef.current = cpu;
  }, [cpu]);

  const settled = useRef(false);
  const finish = useCallback(
    (didWin: boolean) => {
      if (settled.current) return;
      settled.current = true;
      if (cpuRef.current) {
        // Practice: the result, without the rating.
        setDelta(0);
        setWon(didWin);
        setPhase('over');
        if (didWin) {
          if (!playJingle()) sfx.fanfare();
        } else sfx.lose();
        return;
      }
      // Both sides rate against a notional equal opponent: the relay carries no
      // account, so there is no trustworthy opponent rating to read.
      const change = ratingChange(versus.rating, versus.rating, didWin);
      recordVersus(didWin, change);
      setDelta(change);
      setWon(didWin);
      setPhase('over');
      if (didWin) {
        if (!playJingle()) sfx.fanfare();
      } else sfx.lose();
      // The winner says so, and both stay a moment before leaving: leaving at
      // once dropped the last hit, and the loser saw 「つうしんが きれました」.
      if (didWin) networkManager.send({ type: BattleEventType.VICTORY, timestamp: Date.now() });
      setTimeout(() => networkManager.disconnect(), 1500);
    },
    [versus.rating, recordVersus],
  );

  // --- the handshake --------------------------------------------------------
  /** A message repeated until the other side answers (a broadcast misses whoever has not subscribed yet). */
  const resend = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopResend = () => {
    if (resend.current) clearInterval(resend.current);
    resend.current = null;
  };
  const repeat = (send: () => void, onGiveUp: () => void) => {
    stopResend();
    let tries = 0;
    send();
    resend.current = setInterval(() => {
      tries += 1;
      if (tries > 8) {
        stopResend();
        onGiveUp();
        return;
      }
      send();
    }, 1200);
  };
  const lost = (message: string) => {
    stopResend();
    setError(message);
    networkManager.disconnect();
    setPhase('idle');
  };

  const phaseRef = useRef<Phase>('idle');
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const roundRef = useRef<string[] | null>(null);
  const hitNo = useRef(0);

  useEffect(() => {
    const off = networkManager.onEvent((e: BattleEvent) => {
      switch (e.type) {
        case BattleEventType.PROFILE: {
          if (!e.data?.profile) break;
          setThem(e.data.profile);
          if (networkManager.isHosting()) {
            // The guest is here and has said what it knows: choose the round, and repeat it until READY.
            if (roundRef.current) break;
            const picked = pickRound(meRef.current.known, e.data.profile.known, BASIC);
            roundRef.current = picked;
            void preloadCharData(picked);
            repeat(
              () => networkManager.send({ type: BattleEventType.HANDSHAKE, timestamp: Date.now(), data: { kanji: picked, profile: meRef.current } }),
              () => lost('あいてと つながりませんでした。'),
            );
          } else {
            networkManager.send({ type: BattleEventType.PROFILE, timestamp: Date.now(), data: { profile: meRef.current } });
          }
          break;
        }
        case BattleEventType.HANDSHAKE: {
          // Every copy is answered; the round is taken once.
          if (!e.data?.kanji?.length) break;
          networkManager.send({ type: BattleEventType.READY, timestamp: Date.now(), data: { profile: meRef.current } });
          if (phaseRef.current !== 'searching') break;
          if (e.data.profile) setThem(e.data.profile);
          setRound(e.data.kanji);
          void preloadCharData(e.data.kanji);
          setPhase('matched');
          break;
        }
        case BattleEventType.READY: {
          if (!networkManager.isHosting() || !roundRef.current || phaseRef.current !== 'searching') break;
          stopResend();
          if (e.data?.profile) setThem(e.data.profile);
          setRound(roundRef.current);
          setPhase('matched');
          break;
        }
        case BattleEventType.HIT:
          hitNo.current += 1;
          setIncoming({ n: hitNo.current, damage: e.data?.damage ?? 0 });
          break;
        case BattleEventType.VICTORY:
          // The other side brought this side's HP to 0 — even if its last hit was lost.
          finish(false);
          break;
        case BattleEventType.DISCONNECT:
          // Leaving after the result is the normal end of a match.
          if (settled.current) break;
          stopResend();
          if (phaseRef.current === 'fighting' || phaseRef.current === 'matched') {
            setError('あいてが いなく なりました。');
            setPhase('over');
          }
          break;
        default:
          break;
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registered once; reads live values through refs
  }, [finish]);

  useEffect(
    () => () => {
      stopResend();
      networkManager.disconnect();
    },
    [],
  );

  // --- matchmaking --------------------------------------------------------
  const search = async () => {
    sfx.tap();
    setCpu(false);
    setError(null);
    setPhase('searching');
    setSeconds(0);
    setCount(3);
    settled.current = false;
    roundRef.current = null;
    hitNo.current = 0;
    setIncoming(null);
    setThem(null);
    try {
      await networkManager.findOpponent({ onWaiting: setWaiting });
      // The host speaks first, once the guest is in the room; the guest answers (PROFILE → HANDSHAKE → READY).
      if (!networkManager.isHosting()) return;
      if (!(await networkManager.waitForPartner())) {
        lost('あいてが いなく なりました。');
        return;
      }
      repeat(
        () => {
          if (!roundRef.current) networkManager.send({ type: BattleEventType.PROFILE, timestamp: Date.now(), data: { profile: meRef.current } });
        },
        () => {
          if (!roundRef.current) lost('あいてと つながりませんでした。');
        },
      );
    } catch (e) {
      if (e instanceof MatchCancelledError) return;
      setError(e instanceof Error ? e.message : 'つながりませんでした。');
      setPhase('idle');
    }
  };

  const cancel = () => {
    stopResend();
    networkManager.cancel();
    setPhase('idle');
  };

  /** Practice with the CPU: the same round rules, from the kanji this player has. */
  const startCpu = () => {
    sfx.tap();
    stopResend();
    networkManager.cancel();
    settled.current = false;
    hitNo.current = 0;
    setIncoming(null);
    setError(null);
    setCpu(true);
    setThem({ avatar: null, rating: versus.rating, wins: 0, losses: 0, known: [] });
    const picked = pickRound(meRef.current.known, meRef.current.known, BASIC);
    void preloadCharData(picked);
    setRound(picked);
    setCount(3);
    setPhase('matched');
  };

  // The CPU writes its own round: a hit every few seconds while the fight lasts.
  useEffect(() => {
    if (!cpu || phase !== 'fighting') return;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      const turn = cpuTurn(versus.rating);
      timer = setTimeout(() => {
        if (turn.damage > 0) {
          hitNo.current += 1;
          setIncoming({ n: hitNo.current, damage: turn.damage });
        }
        next();
      }, turn.ms);
    };
    next();
    return () => clearTimeout(timer);
  }, [cpu, phase, versus.rating]);

  // The search clock.
  useEffect(() => {
    if (phase !== 'searching') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // VS: the two face each other, then 3・2・1.
  useEffect(() => {
    if (phase !== 'matched') return;
    preloadImages([artOf(them, true), BACKDROP]);
    sfx.clang();
    const ticks = [1300, 2100, 2900].map((ms, i) =>
      setTimeout(() => {
        setCount(2 - i);
        if (i < 2) sfx.tap();
        else sfx.slash(0.8);
      }, ms),
    );
    const go = setTimeout(() => setPhase('fighting'), still ? 1200 : 3500);
    return () => {
      ticks.forEach(clearTimeout);
      clearTimeout(go);
    };
  }, [phase, them, still]);

  const rank = rankFor(versus.rating);
  const myArt = artOf(me);

  if (phase === 'fighting' && round.length) {
    return (
      <VersusFight
        round={round}
        opponentName={cpu ? 'CPU' : nameOf(them)}
        opponentImg={artOf(them, true)}
        weaponBonus={weaponBonus}
        incoming={incoming}
        onHit={(damage, index) => {
          if (!cpu) networkManager.send({ type: BattleEventType.HIT, timestamp: Date.now(), data: { damage, index } });
        }}
        onEnd={finish}
        onForfeit={() => finish(false)}
      />
    );
  }

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden text-[#f4f1ff]">
      {/* The town with every light back on — where the fights are held. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#120f2b]">
        <img src={assetPath(BACKDROP)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(14,11,40,0.55) 0%, rgba(18,14,46,0.35) 40%, rgba(10,8,28,0.88) 100%)' }} />
      </div>

      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          className="g-btn g-btn-night !min-h-[40px] !px-3.5 text-sm"
          onClick={() => {
            cancel();
            navigate(mapPath);
          }}
        >
          <span aria-hidden>◀</span>
          <RubyText showFurigana={showFurigana}>もどる</RubyText>
        </button>
        <h1 className="text-center text-xl leading-tight font-black tracking-widest" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>
          <RubyText showFurigana={showFurigana}>たいせん</RubyText>
          <span lang="en" className="block text-[10px] font-bold tracking-normal opacity-80">
            Versus
          </span>
        </h1>
        <RankBadge rating={versus.rating} showFurigana={showFurigana} />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-end gap-3 px-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        {!isVersusConfigured ? (
          <div className="g-novel-night w-full rounded-2xl p-4 text-center text-sm">
            <RubyText showFurigana={showFurigana}>たいせんは いま つかえません。</RubyText>
          </div>
        ) : phase === 'over' ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="g-novel-night flex w-full flex-col items-center gap-3 rounded-2xl px-4 py-5 text-center"
          >
            <p
              className="text-4xl font-black tracking-widest"
              style={{ color: error ? '#d9d2f5' : won ? '#ffd36a' : '#9fb3d9', textShadow: '0 3px 0 rgba(0,0,0,0.45)' }}
            >
              <RubyText showFurigana={showFurigana}>{error ?? (won ? '勝(か)ち！' : '負(ま)け')}</RubyText>
            </p>
            <div className="flex items-end gap-6">
              <Avatar src={myArt} size={88} />
              <Avatar src={artOf(them, true)} mirrored size={88} />
            </div>
            {cpu && (
              <p className="g-pill-night px-4 py-1.5 text-sm font-black">
                🤖 <RubyText showFurigana={showFurigana}>CPU と れんしゅう（レートは かわりません）</RubyText>
              </p>
            )}
            {!error && !cpu && (
              <p className="g-pill-night px-4 py-1.5 text-base font-black tabular-nums" style={{ color: rank.color }}>
                <RubyText showFurigana={showFurigana}>{`レート ${versus.rating}`}</RubyText>
                <span className="ml-2" style={{ color: delta >= 0 ? '#9be37a' : '#ff9a8a' }}>
                  {delta >= 0 ? '+' : ''}
                  {delta}
                </span>
              </p>
            )}
            <p className="text-xs opacity-80 tabular-nums">
              <RubyText showFurigana={showFurigana}>{`${versus.wins}勝(しょう) ${versus.losses}敗(はい)`}</RubyText>
            </p>
            <div className="flex w-full gap-2">
              <button type="button" className="g-btn g-btn-night flex-1" onClick={() => navigate(mapPath)}>
                <RubyText showFurigana={showFurigana}>もどる</RubyText>
              </button>
              <button
                type="button"
                className="g-btn g-btn-primary g-shine flex-1"
                onClick={() => {
                  setError(null);
                  if (cpu) startCpu();
                  else void search();
                }}
              >
                <span className="relative z-10">
                  <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
                </span>
              </button>
            </div>
          </motion.section>
        ) : (
          <>
            {/* Nexmax (or the chosen なかま), with the search rings around him. */}
            <div className="relative flex flex-1 items-end justify-center">
              {phase === 'searching' && !still && (
                <>
                  {[0, 0.7, 1.4].map((d) => (
                    <motion.span
                      key={d}
                      aria-hidden
                      className="absolute bottom-[18%] left-1/2 h-40 w-40 -translate-x-1/2 rounded-full border-2 border-[#ffd36a]"
                      initial={{ opacity: 0.7, scale: 0.4 }}
                      animate={{ opacity: 0, scale: 1.8 }}
                      transition={{ repeat: Infinity, duration: 2.1, delay: d, ease: 'easeOut' }}
                    />
                  ))}
                </>
              )}
              <motion.div animate={phase === 'searching' && !still ? { y: [0, -6, 0] } : undefined} transition={{ repeat: Infinity, duration: 1.6 }}>
                <Avatar src={myArt} size={compact ? 118 : 170} />
              </motion.div>
            </div>

            <section className="g-novel-night w-full rounded-2xl px-4 py-4 text-center">
              {phase === 'searching' ? (
                <>
                  <motion.p
                    animate={still ? undefined : { opacity: [0.55, 1, 0.55] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="text-lg font-black"
                  >
                    <RubyText showFurigana={showFurigana}>あいてを さがして います…</RubyText>
                  </motion.p>
                  <p className="mt-1 text-xs opacity-80 tabular-nums">
                    <RubyText showFurigana={showFurigana}>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} ・ まっている 人(ひと) ${Math.max(1, waiting)}`}</RubyText>
                  </p>
                  {seconds >= OFFER_CPU_AFTER_S && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <p className="mt-2 text-xs opacity-80">
                        <RubyText showFurigana={showFurigana}>いまは まっている 人(ひと)が いない みたい。</RubyText>
                      </p>
                      <button type="button" className="g-btn g-btn-primary g-shine mt-2 w-full" onClick={startCpu}>
                        <span className="relative z-10">
                          🤖 <RubyText showFurigana={showFurigana}>CPU と れんしゅう</RubyText>
                        </span>
                      </button>
                    </motion.div>
                  )}
                  <button type="button" className="g-btn g-btn-night mt-2 w-full" onClick={cancel}>
                    <RubyText showFurigana={showFurigana}>やめる</RubyText>
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">
                    <RubyText showFurigana={showFurigana}>おなじ 字(じ)を 書(か)いて、はやく 正(ただ)しく 書(か)いた ほうが 勝(か)ち。</RubyText>
                  </p>
                  <ul className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11px] leading-snug font-bold">
                    <li className="g-pill-night flex flex-col items-center rounded-xl px-1 py-1.5">
                      <span aria-hidden className="text-xl">
                        ✍️⚡
                      </span>
                      <RubyText showFurigana={showFurigana}>きれいに 書(か)くと こうげき</RubyText>
                    </li>
                    <li className="g-pill-night flex flex-col items-center rounded-xl px-1 py-1.5">
                      <span aria-hidden className="text-xl">
                        ❌❌❌
                      </span>
                      <RubyText showFurigana={showFurigana}>3こ まちがえると じぶんに</RubyText>
                    </li>
                    <li className="g-pill-night flex flex-col items-center rounded-xl px-1 py-1.5">
                      <span aria-hidden className="text-xl">
                        🗡️
                      </span>
                      <RubyText showFurigana={showFurigana}>ぶきの 差(さ)は 2わりまで</RubyText>
                    </li>
                  </ul>
                  <p className="mt-2 text-xs opacity-80 tabular-nums">
                    <RubyText showFurigana={showFurigana}>{`${versus.wins}勝(しょう) ${versus.losses}敗(はい)`}</RubyText>
                  </p>
                  {error && (
                    <p className="mt-1 text-sm font-bold text-[#ffb4a8]" aria-live="polite">
                      <RubyText showFurigana={showFurigana}>{error}</RubyText>
                    </p>
                  )}
                  <button type="button" className="g-btn g-btn-primary g-shine mt-3 w-full !min-h-[56px] text-lg" onClick={() => void search()}>
                    <span className="relative z-10">
                      ⚔️ <RubyText showFurigana={showFurigana}>あいてを さがす</RubyText>
                    </span>
                  </button>
                  <button type="button" className="g-btn g-btn-night mt-2 w-full !min-h-[40px] text-sm" onClick={startCpu}>
                    🤖 <RubyText showFurigana={showFurigana}>CPU と れんしゅう</RubyText>
                  </button>
                </>
              )}
            </section>
          </>
        )}
      </main>

      {/* VS — the two なかま face each other, then 3・2・1. */}
      <AnimatePresence>
        {phase === 'matched' && (
          <motion.div
            key="vs"
            className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(115deg, #1d3f8f 0%, #1a2a66 49.6%, #f2c45a 49.8%, #f2c45a 50.4%, #6b1630 50.6%, #3a0d22 100%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex w-full max-w-md items-end justify-between px-3">
              <motion.div className="flex flex-col items-center" initial={still ? false : { x: -160, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
                <Avatar src={myArt} size={128} />
                <span className="mt-1 text-sm font-black">
                  <RubyText showFurigana={showFurigana}>じぶん</RubyText>
                </span>
                <RankBadge rating={versus.rating} showFurigana={showFurigana} />
              </motion.div>
              <motion.div className="flex flex-col items-center" initial={still ? false : { x: 160, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.1 }}>
                <Avatar src={artOf(them, true)} mirrored size={128} />
                <span className="mt-1 text-sm font-black">
                  <RubyText showFurigana={showFurigana}>{`あいて・${cpu ? 'CPU' : nameOf(them)}`}</RubyText>
                </span>
                <RankBadge rating={them?.rating ?? 1000} showFurigana={showFurigana} />
              </motion.div>
            </div>
            <motion.p
              className="absolute top-[34%] text-7xl font-black italic"
              style={{ color: '#ffd36a', textShadow: '0 4px 0 #8a4b12, 0 0 24px rgba(255,190,80,0.7)' }}
              initial={still ? false : { scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 14 }}
            >
              VS
            </motion.p>
            <AnimatePresence mode="wait">
              <motion.p
                key={count}
                className="absolute bottom-[16%] text-6xl font-black tabular-nums"
                style={{ textShadow: '0 3px 0 rgba(0,0,0,0.5)' }}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
              >
                {count > 0 ? count : <RubyText showFurigana={showFurigana}>書(か)け！</RubyText>}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VersusScreen;
