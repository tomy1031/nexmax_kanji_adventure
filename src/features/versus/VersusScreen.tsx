import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMapPath } from '../../lib/nav';
import { Backdrop } from '../../components/ui/Backdrop';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import KanjiWriterCanvas, { type KanjiWriterHandle } from '../../components/KanjiWriterCanvas';
import { RubyText } from '../../components/ui/Ruby';
import { useCanvasSize } from '../../hooks/useCanvasSize';
import { useGameStore } from '../../store/gameStore';
import { getKanjiByChar, getKanjiById, ALL_KANJI } from '../../lib/kanjiDb';
import { weaponOf } from '../../lib/forge/weapon';
import { preloadCharData } from '../../lib/strokeLoader';
import { isVersusConfigured } from '../../lib/supabaseClient';
import { networkManager, MatchCancelledError } from './NetworkManager';
import { BattleEventType, ratingChange, rankFor, type BattleEvent } from './types';
import { REPS_TO_OBTAIN } from '../../types/kanji';

/**
 * Versus.
 *
 * Both players get the same characters and race to write them. A clean write
 * hits; three slips and you take the hit instead.
 *
 * The weapon matters, but only a little — capped at a 20% swing — because the
 * point of a match is who writes better, not who saved more gems. A player
 * with a worse collection must still be able to win by knowing their kanji,
 * or the mode stops teaching anything.
 */

const MAX_HP = 100;
const BASE_DAMAGE = 12;
/** The most a weapon can add. Skill has to stay the dominant term. */
const MAX_WEAPON_BONUS = 0.2;
const ROUND_KANJI = 12;

type Phase = 'idle' | 'searching' | 'ready' | 'fighting' | 'over';

export const VersusScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const size = useCanvasSize(200, 0.24);
  const writerRef = useRef<KanjiWriterHandle>(null);

  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const weapons = useGameStore((s) => s.weapons);
  const equippedId = useGameStore((s) => s.equippedWeapon);
  const versus = useGameStore((s) => s.versus);
  const recordVersus = useGameStore((s) => s.recordVersusResult);
  const recordReview = useGameStore((s) => s.recordReview);

  const [phase, setPhase] = useState<Phase>('idle');
  const [waiting, setWaiting] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [myHp, setMyHp] = useState(MAX_HP);
  const [theirHp, setTheirHp] = useState(MAX_HP);
  const [round, setRound] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [delta, setDelta] = useState(0);

  const settled = useRef(false);

  const weapon = useMemo(() => {
    const recipe = weapons.find((w) => w.id === equippedId);
    if (!recipe) return null;
    const kanji = recipe.kanjiIds.map((id) => getKanjiById(id)).filter((k) => k != null);
    return kanji.length === recipe.kanjiIds.length ? weaponOf(kanji) : null;
  }, [weapons, equippedId]);

  /** 1.0 with nothing equipped, at most 1.2 with the best weapon. */
  const weaponBonus = weapon ? 1 + Math.min(MAX_WEAPON_BONUS, (weapon.attack / 96) * MAX_WEAPON_BONUS) : 1;

  /** Characters this player owns — the pool a host draws the round from. */
  const ownedChars = useMemo(
    () => ALL_KANJI.filter((k) => progress[k.id]?.reps >= REPS_TO_OBTAIN).map((k) => k.char),
    [progress],
  );

  const finish = useCallback(
    (didWin: boolean) => {
      if (settled.current) return;
      settled.current = true;
      // Both sides rate against a notional equal opponent: the relay carries no
      // account, so there is no trustworthy opponent rating to read.
      const change = ratingChange(versus.rating, versus.rating, didWin);
      recordVersus(didWin, change);
      setDelta(change);
      setWon(didWin);
      setPhase('over');
      networkManager.disconnect();
    },
    [versus.rating, recordVersus],
  );

  // --- wire ---------------------------------------------------------------
  useEffect(() => {
    const off = networkManager.onEvent((e: BattleEvent) => {
      switch (e.type) {
        case BattleEventType.HANDSHAKE: {
          // The host picks the round so both sides write the same characters.
          if (e.data?.kanji?.length) {
            setRound(e.data.kanji);
            void preloadCharData(e.data.kanji);
            setPhase('fighting');
          }
          break;
        }
        case BattleEventType.HIT: {
          const dmg = e.data?.damage ?? 0;
          setMyHp((hp) => {
            const next = Math.max(0, hp - dmg);
            if (next === 0) finish(false);
            return next;
          });
          setFlash(`あいての こうげき！ ${dmg}`);
          break;
        }
        case BattleEventType.DISCONNECT:
          setError('あいてとの つうしんが きれました。');
          setPhase('over');
          break;
        default:
          break;
      }
    });
    return off;
  }, [finish]);

  useEffect(() => () => networkManager.disconnect(), []);

  // --- matchmaking --------------------------------------------------------
  const search = async () => {
    setError(null);
    setPhase('searching');
    settled.current = false;
    setMyHp(MAX_HP);
    setTheirHp(MAX_HP);
    setIndex(0);
    setFlash(null);

    try {
      await networkManager.findOpponent({ onWaiting: setWaiting });
      setPhase('ready');

      // Give presence a moment to settle, then the host publishes the round.
      setTimeout(() => {
        if (networkManager.isHosting()) {
          const pool = ownedChars.length >= ROUND_KANJI ? ownedChars : ALL_KANJI.slice(0, 40).map((k) => k.char);
          const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, ROUND_KANJI);
          networkManager.send({
            type: BattleEventType.HANDSHAKE,
            timestamp: Date.now(),
            data: { kanji: picked },
          });
          setRound(picked);
          void preloadCharData(picked);
          setPhase('fighting');
        }
      }, 900);
    } catch (e) {
      if (e instanceof MatchCancelledError) {
        setPhase('idle');
        return;
      }
      setError(e instanceof Error ? e.message : 'つながりませんでした。');
      setPhase('idle');
    }
  };

  const cancel = () => {
    networkManager.cancel();
    setPhase('idle');
  };

  // --- writing ------------------------------------------------------------
  const target = round[index % Math.max(1, round.length)];
  const targetKanji = target ? getKanjiByChar(target) : undefined;
  const reading = targetKanji?.kun[0]?.replace(/\(.*\)/, '') || targetKanji?.on[0] || '';

  const onComplete = useCallback(
    (summary: { totalMistakes: number }) => {
      if (phase !== 'fighting' || settled.current) return;
      const mistakes = summary.totalMistakes;

      if (targetKanji && progress[targetKanji.id]?.obtainedAt != null) {
        recordReview(targetKanji.id, mistakes);
      }

      if (mistakes >= 3) {
        // A failed write costs you, rather than the opponent.
        const dmg = Math.round(BASE_DAMAGE * 0.75);
        setMyHp((hp) => {
          const next = Math.max(0, hp - dmg);
          if (next === 0) finish(false);
          return next;
        });
        setFlash(`3回(かい)いじょう まちがえた。${dmg} うけた`);
      } else {
        const accuracy = mistakes === 0 ? 1.5 : mistakes === 1 ? 1.1 : 0.8;
        const dmg = Math.max(1, Math.round(BASE_DAMAGE * accuracy * weaponBonus));
        setTheirHp((hp) => {
          const next = Math.max(0, hp - dmg);
          if (next === 0) finish(true);
          return next;
        });
        networkManager.send({
          type: BattleEventType.HIT,
          timestamp: Date.now(),
          data: { damage: dmg, index },
        });
        setFlash(mistakes === 0 ? `かんぺき！ ${dmg} あたえた` : `${dmg} あたえた`);
      }
      setIndex((i) => i + 1);
    },
    [phase, targetKanji, progress, recordReview, weaponBonus, index, finish],
  );

  const rank = rankFor(versus.rating);

  // --- 未設定 -------------------------------------------------------------
  if (!isVersusConfigured) {
    return (
      <div className="g-stage flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Backdrop fixed />
        <h1 className="g-title text-lg">
          <RubyText showFurigana={showFurigana}>たいせん</RubyText>
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            たいせんは まだ つかえません。サーバーの せっていが 要(い)ります。
          </RubyText>
        </p>
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          <RubyText showFurigana={showFurigana}>
            VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を 設定(せってい)して ビルドすると 使(つか)えます（docs/versus.md）。
          </RubyText>
        </p>
        <button type="button" className="g-btn g-btn-primary" onClick={() => navigate(mapPath)}>
          もどる
        </button>
      </div>
    );
  }

  return (
    <div className="g-stage flex min-h-dvh flex-col">
      <header
        className="g-header sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      >
        <button
          type="button"
          className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm"
          onClick={() => {
            networkManager.disconnect();
            navigate(mapPath);
          }}
        >
          もどる
        </button>
        <h1 className="g-title text-base">
          <RubyText showFurigana={showFurigana}>たいせん</RubyText>
        </h1>
        <span className="g-chip text-xs" style={{ color: rank.color }}>
          <RubyText showFurigana={showFurigana}>{rank.label}</RubyText>
          <span className="tabular-nums">{versus.rating}</span>
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
        {/* 待機 / 開始 ------------------------------------------------- */}
        {(phase === 'idle' || phase === 'searching' || phase === 'ready') && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                おなじ 漢字(かんじ)を 書(か)いて、はやく 正(ただ)しく 書(か)いたほうが 勝(か)ちます。
              </RubyText>
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              <RubyText showFurigana={showFurigana}>
                武器(ぶき)の 差(さ)は 2わり までです。字(じ)が 書(か)ければ 勝(か)てます。
              </RubyText>
            </p>

            {phase === 'idle' && (
              <button type="button" className="g-btn g-btn-primary w-full text-lg" onClick={search}>
                <RubyText showFurigana={showFurigana}>あいてを さがす</RubyText>
              </button>
            )}

            {phase === 'searching' && (
              <>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="g-title"
                >
                  <RubyText showFurigana={showFurigana}>さがしています…</RubyText>
                </motion.p>
                <p className="text-xs tabular-nums" style={{ color: 'var(--ink-3)' }}>
                  <RubyText showFurigana={showFurigana}>{`まっている 人(ひと)：${waiting}`}</RubyText>
                </p>
                <button type="button" className="g-btn g-btn-ghost w-full" onClick={cancel}>
                  やめる
                </button>
              </>
            )}

            {phase === 'ready' && (
              <p className="g-title">
                <RubyText showFurigana={showFurigana}>あいてが 見(み)つかりました！</RubyText>
              </p>
            )}

            {error && (
              <p className="text-sm" style={{ color: 'var(--color-danger)' }} aria-live="polite">
                <RubyText showFurigana={showFurigana}>{error}</RubyText>
              </p>
            )}
          </div>
        )}

        {/* 対戦中 ------------------------------------------------------ */}
        {phase === 'fighting' && targetKanji && (
          <>
            <div className="g-panel mb-2 p-3">
              <p className="mb-1 text-xs" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>あいて</RubyText>
              </p>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-danger)' }}
                  animate={{ width: `${(theirHp / MAX_HP) * 100}%` }}
                />
              </div>
            </div>

            <div className="g-panel mb-3 p-3">
              <p className="mb-1 text-xs" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>じぶん</RubyText>
                {weapon && (
                  <span className="ml-2">
                    <RubyText showFurigana={showFurigana}>{weapon.name}</RubyText>
                  </span>
                )}
              </p>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-success)' }}
                  animate={{ width: `${(myHp / MAX_HP) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-center text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>この ことばを 書(か)く</RubyText>
            </p>
            <p className="g-title mb-2 text-center text-lg">
              {reading}
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--ink-2)' }}>
                {targetKanji.meanings.join(' / ')}
              </span>
            </p>

            <div className="flex justify-center">
              <KanjiWriterCanvas
                ref={writerRef}
                key={`${targetKanji.id}-${index}`}
                char={targetKanji.char}
                size={size}
                quizMode
                onComplete={onComplete}
              />
            </div>

            <div className="mt-2 h-8 text-center" aria-live="polite">
              <AnimatePresence mode="wait">
                {flash && (
                  <motion.p
                    key={flash + index}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="g-title text-sm"
                  >
                    <RubyText showFurigana={showFurigana}>{flash}</RubyText>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="g-btn g-btn-ghost mx-auto mt-1 !min-h-[38px] !px-4 text-xs"
              onClick={() => writerRef.current?.animateStroke()}
            >
              <RubyText showFurigana={showFurigana}>わからない</RubyText>
            </button>
          </>
        )}

        {/* 決着 -------------------------------------------------------- */}
        {phase === 'over' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="g-title text-2xl">
              {error ? (
                <RubyText showFurigana={showFurigana}>{error}</RubyText>
              ) : won ? (
                <RubyText showFurigana={showFurigana}>勝(か)ち！</RubyText>
              ) : (
                <RubyText showFurigana={showFurigana}>負(ま)け</RubyText>
              )}
            </p>
            {!error && (
              <p className="g-chip" style={{ color: rank.color }}>
                <RubyText showFurigana={showFurigana}>レート</RubyText>
                <span className="tabular-nums">
                  {versus.rating} ({delta >= 0 ? '+' : ''}
                  {delta})
                </span>
              </p>
            )}
            <div className="flex w-full gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1" onClick={() => navigate(mapPath)}>
                もどる
              </button>
              <button
                type="button"
                className="g-btn g-btn-primary flex-1"
                onClick={() => {
                  setError(null);
                  setPhase('idle');
                }}
              >
                <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersusScreen;
