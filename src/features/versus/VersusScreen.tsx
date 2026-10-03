import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useMapPath } from '../../lib/nav';
import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';
import { getKanjiByChar, getKanjiById } from '../../lib/kanjiDb';
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
import { BattleEventType, nextRank, ratingChange, rankFor, type BattleEvent, type VersusProfile } from './types';
import { pickRound } from './round';
import { VersusFight } from './VersusFight';
import KanjiCard from '../zukan/KanjiCard';
import { charRuby } from '../../lib/reading';
import { cpuTurn } from './cpu';
import { SELF_HIT } from './rules';

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
/** How long a room waits for the friend who has its あいことば. */
const FRIEND_WAIT_MS = 5 * 60 * 1000;
const newCode = () => String(1000 + Math.floor(Math.random() * 9000));
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
  const [incoming, setIncoming] = useState<{ n: number; damage: number; self?: boolean } | null>(null);
  /** Characters the other side has finished, for its name plate. */
  const [theirDone, setTheirDone] = useState(0);
  /** Won because the other side left mid-match. */
  const [walkover, setWalkover] = useState(false);
  /** What this side wrote in the match, latest result per character — the result's review. */
  const [writes, setWrites] = useState<{ char: string; mistakes: number }[]>([]);
  /** The review's kanji opened as a card (ずかん's 字カード). */
  const [card, setCard] = useState<number | null>(null);
  /** The rank just reached by this match, for the result's celebration. */
  const [rankUp, setRankUp] = useState<string | null>(null);
  /** The other side's latest stamp. */
  const [stampIn, setStampIn] = useState<{ n: number; stamp: number } | null>(null);
  const [won, setWon] = useState(false);
  const [delta, setDelta] = useState(0);
  const [count, setCount] = useState(3);
  /** Playing the CPU (no relay, no rating), not a person. */
  const [cpu, setCpu] = useState(false);
  /** ともだちと: the room's あいことば and whether this side made it. Unrated, like the CPU. */
  const [room, setRoom] = useState<{ code: string; host: boolean } | null>(null);
  /** The ともだちと sheet: choosing, or typing a friend's code. */
  const [friendMenu, setFriendMenu] = useState<'closed' | 'choose' | 'enter'>('closed');
  const [typed, setTyped] = useState('');

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
  const roomRef = useRef<{ code: string; host: boolean } | null>(null);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const settled = useRef(false);
  /** Leaving the room a moment after the result — called off if the next match starts first. */
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveSoon = () => {
    if (leaving.current) clearTimeout(leaving.current);
    leaving.current = setTimeout(() => {
      leaving.current = null;
      networkManager.disconnect();
    }, 1500);
  };
  const finish = useCallback(
    (didWin: boolean) => {
      if (settled.current) return;
      settled.current = true;
      if (cpuRef.current || roomRef.current) {
        // Practice and friends: the result, without the rating.
        setDelta(0);
        setWon(didWin);
        setPhase('over');
        if (didWin) {
          if (!playJingle()) sfx.fanfare();
        } else sfx.lose();
        if (roomRef.current) {
          if (didWin) networkManager.send({ type: BattleEventType.VICTORY, timestamp: Date.now() });
          leaveSoon();
        }
        return;
      }
      // Both sides rate against a notional equal opponent: the relay carries no
      // account, so there is no trustworthy opponent rating to read.
      const change = ratingChange(versus.rating, versus.rating, didWin);
      const before = rankFor(versus.rating).label;
      recordVersus(didWin, change);
      // The store keeps the rating's floor; read what it made of the change.
      const after = useGameStore.getState().versus.rating;
      if (after > versus.rating && rankFor(after).label !== before) setRankUp(rankFor(after).label);
      setDelta(change);
      setWon(didWin);
      setPhase('over');
      if (didWin) {
        if (!playJingle()) sfx.fanfare();
      } else sfx.lose();
      // The winner says so, and both stay a moment before leaving: leaving at
      // once dropped the last hit, and the loser saw 「つうしんが きれました」.
      if (didWin) networkManager.send({ type: BattleEventType.VICTORY, timestamp: Date.now() });
      leaveSoon();
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
        case BattleEventType.MISS:
          hitNo.current += 1;
          setIncoming({ n: hitNo.current, damage: e.data?.damage ?? 0, self: e.type === BattleEventType.MISS });
          setTheirDone((d) => Math.max(d, (e.data?.index ?? d) + 1));
          break;
        case BattleEventType.EMOTE:
          if (typeof e.data?.emote === 'number') setStampIn({ n: Date.now(), stamp: e.data.emote });
          break;
        case BattleEventType.VICTORY:
          // The other side brought this side's HP to 0 — even if its last hit was lost.
          finish(false);
          break;
        case BattleEventType.DISCONNECT:
          // Leaving after the result is the normal end of a match.
          if (settled.current) break;
          stopResend();
          if (phaseRef.current === 'fighting') {
            // Leaving a match is losing it: the one who stayed wins.
            setWalkover(true);
            finish(true);
          } else if (phaseRef.current === 'matched') {
            lost('あいてが いなく なりました。');
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
  /** A fresh match: nothing carried over from the last one. */
  const resetMatch = () => {
    sfx.tap();
    if (leaving.current) clearTimeout(leaving.current);
    leaving.current = null;
    setError(null);
    setPhase('searching');
    setSeconds(0);
    setCount(3);
    settled.current = false;
    roundRef.current = null;
    hitNo.current = 0;
    setIncoming(null);
    setTheirDone(0);
    setWalkover(false);
    setWrites([]);
    setRankUp(null);
    setThem(null);
    setFriendMenu('closed');
  };

  /** The host speaks first, once the guest is in the room; the guest answers (PROFILE → HANDSHAKE → READY). */
  const hostHandshake = () =>
    repeat(
      () => {
        if (!roundRef.current) networkManager.send({ type: BattleEventType.PROFILE, timestamp: Date.now(), data: { profile: meRef.current } });
      },
      () => {
        if (!roundRef.current) lost('あいてと つながりませんでした。');
      },
    );

  const failed = (e: unknown) => {
    if (e instanceof MatchCancelledError) return;
    setError(e instanceof Error ? e.message : 'つながりませんでした。');
    setPhase('idle');
  };

  const search = async () => {
    resetMatch();
    setCpu(false);
    setRoom(null);
    try {
      await networkManager.findOpponent({ onWaiting: setWaiting });
      if (!networkManager.isHosting()) return;
      if (!(await networkManager.waitForPartner())) {
        lost('あいてが いなく なりました。');
        return;
      }
      hostHandshake();
    } catch (e) {
      failed(e);
    }
  };

  /** ともだちと: make a room (host) or go into a friend's (guest), by its あいことば. */
  const enterRoom = async (code: string, host: boolean) => {
    resetMatch();
    setCpu(false);
    setRoom({ code, host });
    try {
      await networkManager.joinRoom(code, host);
      // The maker waits for the friend; the friend waits for the maker to be there.
      const there = await networkManager.waitForPartner(host ? FRIEND_WAIT_MS : 15000);
      if (!there) {
        lost(host ? 'ともだちが きませんでした。' : 'その あいことばの へやが ありません。');
        return;
      }
      if (host) hostHandshake();
    } catch (e) {
      failed(e);
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
    setTheirDone(0);
    setWalkover(false);
    setWrites([]);
    setRankUp(null);
    setError(null);
    setCpu(true);
    setRoom(null);
    setFriendMenu('closed');
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
        hitNo.current += 1;
        setIncoming(turn.damage > 0 ? { n: hitNo.current, damage: turn.damage } : { n: hitNo.current, damage: SELF_HIT, self: true });
        setTheirDone((d) => d + 1);
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
  const nextUp = nextRank(versus.rating);
  const myArt = artOf(me);

  if (phase === 'fighting' && round.length) {
    return (
      <VersusFight
        round={round}
        opponentName={`${cpu ? 'CPU' : nameOf(them)} ✍️${Math.min(theirDone, round.length)}/${round.length}`}
        opponentImg={artOf(them, true)}
        weaponBonus={weaponBonus}
        incoming={incoming}
        onHit={(damage, index) => {
          if (!cpu) networkManager.send({ type: BattleEventType.HIT, timestamp: Date.now(), data: { damage, index } });
        }}
        onSelfHit={(damage, index) => {
          if (!cpu) networkManager.send({ type: BattleEventType.MISS, timestamp: Date.now(), data: { damage, index } });
        }}
        onEnd={finish}
        onForfeit={() => finish(false)}
        onWrite={(char, mistakes) => setWrites((w) => [...w.filter((x) => x.char !== char), { char, mistakes }])}
        stampIn={stampIn}
        onStamp={(stamp) => {
          if (!cpu) networkManager.send({ type: BattleEventType.EMOTE, timestamp: Date.now(), data: { emote: stamp } });
          // The CPU answers a greeting now and then.
          else if (Math.random() < 0.6) setTimeout(() => setStampIn({ n: Date.now(), stamp: stamp === 3 ? 3 : 1 }), 900);
        }}
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
            {rankUp && (
              <motion.p
                className="g-plate-brass rounded-full px-4 py-1 text-base font-black"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: [0.4, 1.15, 1], opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                🎉 <RubyText showFurigana={showFurigana}>{`ランクアップ！ ${rankUp}`}</RubyText>
              </motion.p>
            )}
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
            {walkover && (
              <p className="text-sm font-bold opacity-90">
                <RubyText showFurigana={showFurigana}>あいてが いなく なったので、あなたの 勝(か)ち。</RubyText>
              </p>
            )}
            {room && (
              <p className="g-pill-night px-4 py-1.5 text-sm font-black">
                👫 <RubyText showFurigana={showFurigana}>ともだちと たいせん（レートは かわりません）</RubyText>
              </p>
            )}
            {cpu && (
              <p className="g-pill-night px-4 py-1.5 text-sm font-black">
                🤖 <RubyText showFurigana={showFurigana}>CPU と れんしゅう（レートは かわりません）</RubyText>
              </p>
            )}
            {!error && !cpu && !room && (
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
            {writes.length > 0 && (
              <div className="w-full">
                <p className="text-xs font-bold opacity-90">
                  <RubyText showFurigana={showFurigana}>この たいせんで 書(か)いた 字(じ)</RubyText>
                </p>
                <ul className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                  {writes.map((w, i) => {
                    const mark = w.mistakes === 0 ? { m: '◎', c: '#ffd36a' } : w.mistakes < 3 ? { m: '○', c: '#9be37a' } : { m: '✕', c: '#ff9a8a' };
                    return (
                      <li key={w.char}>
                        <button
                          type="button"
                          className="g-plate-brass relative flex h-12 w-11 items-center justify-center rounded-lg text-2xl font-black"
                          aria-label={`${w.char} ${mark.m}`}
                          onClick={() => setCard(i)}
                        >
                          <RubyText showFurigana={showFurigana}>{charRuby(w.char)}</RubyText>
                          <span className="absolute -right-1 -bottom-1 text-xs font-black" style={{ color: mark.c, textShadow: '0 1px 2px #000' }}>
                            {mark.m}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-1 text-[10px] opacity-75">
                  <RubyText showFurigana={showFurigana}>◎ きれい ○ ミス ありで 書(か)けた ✕ 3こ ミス ・ 字(じ)を おすと くわしく</RubyText>
                </p>
              </div>
            )}
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
                  else if (room) void enterRoom(room.code, room.host);
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
              {phase === 'searching' && room ? (
                <>
                  <p className="text-sm font-bold">
                    <RubyText showFurigana={showFurigana}>{room.host ? '👫 ともだちに この あいことばを おしえてね' : 'あいことばの へやに はいって います…'}</RubyText>
                  </p>
                  <p className="mt-2 flex justify-center gap-2" aria-label={`あいことば ${room.code}`}>
                    {[...room.code].map((d, i) => (
                      <span key={i} className="g-plate-brass flex h-14 w-12 items-center justify-center rounded-xl text-3xl font-black tabular-nums">
                        {d}
                      </span>
                    ))}
                  </p>
                  <motion.p
                    animate={still ? undefined : { opacity: [0.55, 1, 0.55] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="mt-2 text-xs font-bold opacity-90 tabular-nums"
                  >
                    <RubyText showFurigana={showFurigana}>{`まっています… ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</RubyText>
                  </motion.p>
                  <button type="button" className="g-btn g-btn-night mt-3 w-full" onClick={cancel}>
                    <RubyText showFurigana={showFurigana}>やめる</RubyText>
                  </button>
                </>
              ) : phase === 'searching' ? (
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
                  {/* A short phone keeps the lobby on one screen: the three rule cards say it already. */}
                  {!compact && (
                    <p className="mb-2.5 text-sm font-bold">
                      <RubyText showFurigana={showFurigana}>おなじ 字(じ)を 書(か)いて、はやく 正(ただ)しく 書(か)いた ほうが 勝(か)ち。</RubyText>
                    </p>
                  )}
                  <ul className="grid grid-cols-3 gap-1.5 text-[11px] leading-snug font-bold">
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
                  {nextUp && (
                    <div className="mx-auto mt-1.5 w-4/5">
                      <p className="text-[11px] font-bold opacity-90 tabular-nums">
                        <RubyText showFurigana={showFurigana}>{`${nextUp.label}まで あと ${nextUp.at - versus.rating}`}</RubyText>
                      </p>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-[#ffd36a]"
                          style={{ width: `${Math.max(4, ((versus.rating - nextUp.from) / (nextUp.at - nextUp.from)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
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
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="g-btn g-btn-night flex-1 !min-h-[40px] !px-2 text-xs whitespace-nowrap"
                      onClick={() => {
                        sfx.tap();
                        setTyped('');
                        setFriendMenu('choose');
                      }}
                    >
                      👫 <RubyText showFurigana={showFurigana}>ともだちと</RubyText>
                    </button>
                    <button type="button" className="g-btn g-btn-night flex-1 !min-h-[40px] !px-2 text-xs whitespace-nowrap" onClick={startCpu}>
                      🤖 <RubyText showFurigana={showFurigana}>CPU と れんしゅう</RubyText>
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      {card != null && writes[card] && getKanjiByChar(writes[card].char) && (
        <KanjiCard
          kanji={getKanjiByChar(writes[card].char)!}
          onClose={() => setCard(null)}
          onPrev={card > 0 ? () => setCard(card - 1) : undefined}
          onNext={card < writes.length - 1 ? () => setCard(card + 1) : undefined}
          position={`${card + 1} / ${writes.length}`}
        />
      )}

      {/* ともだちと — make an あいことば, or type a friend's. */}
      <AnimatePresence>
        {friendMenu !== 'closed' && (
          <motion.div
            key="friends"
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/55 px-4 pb-[max(20px,env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFriendMenu('closed')}
          >
            <motion.section
              className="g-novel-night w-full max-w-md rounded-2xl px-4 py-4 text-center"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-lg font-black">
                👫 <RubyText showFurigana={showFurigana}>ともだちと たいせん</RubyText>
              </p>
              {friendMenu === 'choose' ? (
                <>
                  <p className="mt-1 text-xs opacity-85">
                    <RubyText showFurigana={showFurigana}>4けたの あいことばで、ともだちと だけ たいせん します。</RubyText>
                  </p>
                  <button type="button" className="g-btn g-btn-primary g-shine mt-3 w-full !min-h-[52px]" onClick={() => void enterRoom(newCode(), true)}>
                    <span className="relative z-10">
                      🔑 <RubyText showFurigana={showFurigana}>あいことばを つくる</RubyText>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="g-btn g-btn-night mt-2 w-full !min-h-[48px]"
                    onClick={() => {
                      sfx.tap();
                      setFriendMenu('enter');
                    }}
                  >
                    🔢 <RubyText showFurigana={showFurigana}>あいことばを いれる</RubyText>
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-2 flex justify-center gap-2" aria-live="polite">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="g-plate-brass flex h-14 w-12 items-center justify-center rounded-xl text-3xl font-black tabular-nums">
                        {typed[i] ?? ''}
                      </span>
                    ))}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        aria-label={k === '⌫' ? 'けす' : k === 'OK' ? 'はいる' : k}
                        disabled={k === 'OK' && typed.length < 4}
                        className={`g-btn ${k === 'OK' ? 'g-btn-primary' : 'g-btn-night'} !min-h-[48px] text-xl font-black disabled:opacity-40`}
                        onClick={() => {
                          sfx.tap();
                          if (k === '⌫') setTyped((t) => t.slice(0, -1));
                          else if (k === 'OK') void enterRoom(typed, false);
                          else setTyped((t) => (t.length < 4 ? t + k : t));
                        }}
                      >
                        {k === 'OK' ? <RubyText showFurigana={showFurigana}>はいる</RubyText> : k}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button type="button" className="mt-3 text-xs font-bold underline opacity-80" onClick={() => setFriendMenu('closed')}>
                <RubyText showFurigana={showFurigana}>とじる</RubyText>
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

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
