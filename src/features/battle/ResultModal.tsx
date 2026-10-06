import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GiCrossedSwords, GiOpenBook, GiAnvil, GiPathDistance } from 'react-icons/gi';
import { RubyText } from '../../components/ui/Ruby';
import { LogoText } from '../../components/ui/LogoText';
import { useGameStore } from '../../store/gameStore';
import { FEATURE_INTRO, type Feature } from '../../data/unlocks';
import { KanjiWord } from '../../components/ui/Readings';
import type { KanjiData } from '../../types/kanji';
import type { Stars } from '../../lib/mastery';
import { NEXT_STAR_GAIN } from '../../data/starPerks';
import { hpBonus, patienceBonus } from '../../lib/level';
import * as sfx from '../../lib/sfx';
import { playJingle } from '../../lib/bgm';
import { useStill } from '../../hooks/useStill';
import { faceStyle } from '../../lib/faceCrop';

/**
 * The end of a fight, as a game says it (2026-09-24「動線 その他の 動きに
 * ついても、アプリゲームとして 成立するように」).
 *
 *   win  — クリア！ drops in, the stars land one by one with rising notes,
 *          the gems count up, confetti falls. The main button leads on:
 *          つぎの 話へ. Replaying and the forge stay one tap away.
 *   lose — the verdict is plain (まけ), and the next step is the one that
 *          actually helps: れんしゅうする (the characters not yet owned are
 *          why the fight was lost). もう一度 and the forge sit beside it.
 */

type Outcome = { kind: 'win'; stars: 1 | 2 | 3 } | { kind: 'lose' };

const CONFETTI = ['#ffd24a', '#ff7a59', '#5cc0ff', '#7ed36b', '#ff9ad5', '#ffffff'];

/** What the companion did, as short chips (ResultModal growth.help). */
const helpChips = (h?: { bonus: number; guarded: number; healed: number; calmed: number; looks: number; powered: number; favoured: number; comboKept: number }): string[] =>
  !h
    ? []
    : [
        h.guarded > 0 ? `🛡️ ${h.guarded}回(かい) まもった` : '',
        h.healed > 0 ? `💚 HP ＋${h.healed}` : '',
        h.calmed > 0 ? `🍃 ミス −${h.calmed}` : '',
        h.looks > 0 ? `💡 ${h.looks}回(かい) ただで 見(み)た` : '',
        h.powered > 0 ? `💥 ${h.powered}回(かい) つよく` : '',
        h.comboKept > 0 ? `🔥 コンボ ${h.comboKept}回(かい) まもった` : '',
        h.favoured > 0 ? `⚔ ＋${h.bonus}% ×${h.favoured}回(かい)` : '',
      ].filter((c) => c !== '');

export const ResultModal = ({
  outcome,
  bossName,
  mistakes,
  gems,
  perfect = false,
  hard = false,
  milestone,
  showGems = true,
  newFriend,
  opened,
  tutorial,
  hasNext,
  nextLabel,
  loseHint,
  easyWin = false,
  onNext,
  onStages,
  onRetry,
  onPractice,
  onForge,
  onFeature,
  onTutorialDone,
  route,
  growth,
}: {
  outcome: Outcome;
  bossName: string;
  mistakes: number;
  gems: number;
  /** The first かんぺき (★3) clear of this stage: a 👑 and a little more (data/clearRewards.ts). */
  perfect?: boolean;
  /** The first Hard win of this stage: a 👹 and a bonus (lib/difficulty.ts). */
  hard?: boolean;
  /** The first win that closes something: 「1章 クリア！」 (まとめの ボス). */
  milestone?: string;
  /** Whether gems are worth showing yet (the new route shows them once the gacha is open). */
  showGems?: boolean;
  newFriend: boolean;
  opened: Feature[];
  tutorial: boolean;
  hasNext: boolean;
  /** The win's main button, when it does not lead on to the story (Hard goes back to じゅんび). */
  nextLabel?: string;
  /** What to do about a loss, when writing more is not the answer (Hard: fewer slips). */
  loseHint?: string;
  /** Won on やさしい (with the model): the next step is ふつう, without it. */
  easyWin?: boolean;
  onNext: () => void;
  onStages: () => void;
  onRetry: () => void;
  onPractice: () => void;
  onForge: () => void;
  onFeature: (f: Feature) => void;
  onTutorialDone: () => void;
  /**
   * 文字が 消えた 町 (08 §3.8): the win leads on into the episode's closing
   * scene (つづきへ); the forge is not offered here — it is reached from
   * じゅんび and もちもの once the story has shown it — and gems, which have
   * no use on this route yet, are not announced.
   */
  route?: 'moji';
  /**
   * What this fight did for the learner (文字が 消えた 町): the kanji whose ★
   * went up, and the reading turns got right. Shown win or lose — the
   * writing counted either way. `goal`: the kanji closest to its next star,
   * and what that star brings (🎯), so there is a reason to write again.
   */
  growth?: {
    starUps: { kanji: KanjiData; stars: Stars }[];
    read: { right: number; total: number };
    /** The kanji written in this fight (each once, furigana notation) and how many writes in all: the practice, seen. */
    written?: { chars: string[]; total: number };
    goal?: { kanji: KanjiData; left: number; next: 2 | 3 } | null;
    /** ネクマックスの 経験値 (lib/level.ts): what this fight added, the level before and after, and the ceiling. */
    exp?: { gained: number; before: number; after: number; atCap: boolean; kanjiToRaiseCap: number };
    /** What the companion did (BattleScene): so its being there is seen to count. */
    help?: { name: string; art: string; bonus: number; guarded: number; healed: number; calmed: number; looks: number; powered: number; favoured: number; comboKept: number };
  };
}) => {
  const moji = route === 'moji';
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const still = useStill();
  const win = outcome.kind === 'win';
  const stars = win ? outcome.stars : 0;
  const [shownGems, setShownGems] = useState(still ? gems : 0);

  // Sound and the count-up follow the drop-in of each star.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (win) {
      // The win jingle over the music; the synth fanfare when music is off.
      if (!playJingle()) sfx.fanfare();
      for (let i = 0; i < stars; i++) timers.push(setTimeout(() => sfx.star(i), 650 + i * 280));
      if (gems > 0 && !still) {
        const start = 650 + stars * 280;
        const steps = 12;
        for (let i = 1; i <= steps; i++) timers.push(setTimeout(() => setShownGems(Math.round((gems * i) / steps)), start + i * 45));
      }
    } else {
      sfx.lose();
    }
    return () => timers.forEach(clearTimeout);
  }, [win, stars, gems, still]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Scrolls when the card is taller than a short screen (a level-up adds lines).
      className="fixed inset-0 z-50 overflow-y-auto px-5"
      style={{ background: win ? 'radial-gradient(circle at 50% 40%, rgba(255,220,120,0.35), rgba(0,0,0,0.7) 70%)' : 'rgba(10,15,30,0.72)' }}
    >
      {win && !still && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 36 }, (_, i) => (
            <motion.span
              key={i}
              className="absolute top-0 block rounded-sm"
              style={{ left: `${(i * 29) % 100}%`, width: 7, height: 12, background: CONFETTI[i % CONFETTI.length] }}
              initial={{ y: -30, rotate: 0, opacity: 1 }}
              animate={{ y: '105dvh', rotate: 360 + i * 40, x: [0, (i % 2 ? 1 : -1) * 30, 0] }}
              transition={{ duration: 2.4 + (i % 5) * 0.35, delay: 0.3 + (i % 9) * 0.12, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}

      <div className="relative flex min-h-full items-center justify-center pt-10 pb-4">
      <motion.div
        initial={{ scale: 0.7, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="g-frame relative w-full max-w-sm px-5 pt-3 pb-5 text-center"
      >
        <div className="-mt-10 mb-1">
          <LogoText tone={win ? 'gold' : 'blue'} className="text-[46px] leading-[1.5]">
            {win ? 'クリア！' : 'まけ…'}
          </LogoText>
        </div>

        {win && (
          <div className="flex items-end justify-center gap-1" aria-label={`ほし ${stars}こ`}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-[46px] leading-none"
                style={{
                  color: i < stars ? '#ffc81f' : '#d8c9a8',
                  filter: i < stars ? 'drop-shadow(0 2px 0 #9a5a00) drop-shadow(0 0 10px rgba(255,210,80,0.9))' : 'none',
                  fontSize: i === 1 ? 58 : 46,
                }}
                initial={still ? false : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.55 + i * 0.28 }}
              >
                ★
              </motion.span>
            ))}
          </div>
        )}

        <p className="mt-2 text-lg font-black">
          <RubyText showFurigana={showFurigana}>
            {win ? (tutorial ? `${bossName}は にげた！` : `${bossName} に かった！`) : 'まけました……'}
          </RubyText>
        </p>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>
            {win
              ? `ミス ${mistakes}`
              : loseHint
                ? loseHint
                : moji
                ? '★が 少(すく)ない 字(じ)を 書(か)きましょう。つよく なります！'
                : 'まだ 持(も)って いない 字(じ)を 書(か)きましょう。つよく なります！'}
          </RubyText>
        </p>

        {growth && (growth.starUps.length > 0 || growth.read.total > 0 || growth.goal || (growth.exp && growth.exp.gained > 0) || helpChips(growth.help).length > 0 || (growth.written?.total ?? 0) > 0) && (
          <div className="mt-3 rounded-xl px-3 py-2 text-left" style={{ background: 'rgba(255,255,255,0.55)', border: '2px solid #e0c48a' }}>
            <p className="text-xs font-black" style={{ color: 'var(--ink-2)' }}>
              この たたかいで
            </p>
            {growth.exp && growth.exp.gained > 0 && (
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm leading-[1.9] font-black">
                <span>✨ EXP ＋{growth.exp.gained}</span>
                {growth.exp.after > growth.exp.before && (
                  <motion.span
                    className="rounded-full bg-[#2f8fe0] px-2 text-xs leading-[1.9] text-white"
                    initial={still ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring', stiffness: 380, damping: 14 }}
                  >
                    Lv UP! Lv{growth.exp.before} → Lv{growth.exp.after}
                  </motion.span>
                )}
                {growth.exp.after > growth.exp.before && (
                  <span className="text-xs" style={{ color: '#2f8fe0' }}>
                    ❤＋{hpBonus(growth.exp.after) - hpBonus(growth.exp.before)}
                    {patienceBonus(growth.exp.after) > patienceBonus(growth.exp.before) && ' ✋＋1'}
                  </span>
                )}
              </p>
            )}
            {growth.exp?.atCap && (
              <p className="text-xs font-black" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>{`Lv 上限(じょうげん)：新(あたら)しい 字(じ) あと ${growth.exp.kanjiToRaiseCap}つで アップ`}</RubyText>
              </p>
            )}
            {growth.starUps.length > 0 && (
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                {growth.starUps.map(({ kanji, stars: s }) => (
                  <span
                    key={kanji.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#fff6dd] px-1.5 text-base leading-[1.75] font-black"
                    style={{ border: '1.5px solid #f2b53a' }}
                  >
                    <KanjiWord kanji={kanji} showFurigana={showFurigana} />
                    <span className="text-xs" style={{ color: '#e8a317' }} aria-label={`★${s}`}>
                      {'★'.repeat(s)}
                    </span>
                  </span>
                ))}
                <span className="text-xs font-black">に なった！</span>
              </div>
            )}
            {growth.written && growth.written.total > 0 && (
              // What was practised: the kanji written, each once, and the count.
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-sm font-black">
                <span>✍️</span>
                <RubyText showFurigana={showFurigana}>書(か)いた 字(じ)：</RubyText>
                <span className="text-lg">
                  <RubyText showFurigana={showFurigana}>{growth.written.chars.join(' ')}</RubyText>
                </span>
                <RubyText showFurigana={showFurigana}>{`（${growth.written.total}回(かい)）`}</RubyText>
              </p>
            )}
            {growth.read.total > 0 && (
              <p className="mt-0.5 text-sm font-black">
                📖 <RubyText showFurigana={showFurigana}>{`読(よ)めた ${growth.read.right} / ${growth.read.total}`}</RubyText>
              </p>
            )}
            {growth.help && helpChips(growth.help).length > 0 && (
              // The companion's part, in pictures and numbers.
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <span aria-hidden className="h-7 w-7 shrink-0 rounded-full border-2 border-[#d4a04a] bg-[#fff8e6]" style={faceStyle(growth.help.art, 28, 1.25)} />
                <span className="text-xs font-black">
                  <RubyText showFurigana={showFurigana}>{`${growth.help.name}：`}</RubyText>
                </span>
                {helpChips(growth.help).map((c) => (
                  <span key={c} className="rounded-full bg-[#fff1cf] px-2 text-xs leading-[1.9] font-black text-[#5a3a12]">
                    <RubyText showFurigana={showFurigana}>{c}</RubyText>
                  </span>
                ))}
              </div>
            )}
            {growth.goal && (
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1 text-sm leading-[2] font-black">
                🎯 <span>つぎ</span>
                <span className="text-base">
                  <KanjiWord kanji={growth.goal.kanji} showFurigana={showFurigana} />
                </span>
                <RubyText showFurigana={showFurigana}>
                  {`あと ${growth.goal.left}回(かい)で ★${growth.goal.next}・${NEXT_STAR_GAIN[growth.goal.next]}`}
                </RubyText>
              </p>
            )}
          </div>
        )}

        {perfect && (
          <p className="mt-2 text-sm font-black" style={{ color: '#b0741a' }}>
            <RubyText showFurigana={showFurigana}>👑 かんぺき！ はじめて ミス なしで 勝(か)ちました</RubyText>
          </p>
        )}
        {hard && (
          <p className="mt-2 text-sm font-black" style={{ color: 'var(--color-danger)' }}>
            <RubyText showFurigana={showFurigana}>👹 ハードに はじめて 勝(か)った！</RubyText>
          </p>
        )}
        {win && easyWin && (
          // The way up: the same fight without the model.
          <p className="mt-2 text-sm font-black" style={{ color: '#2f7d4a' }}>
            <RubyText showFurigana={showFurigana}>🌱 つぎは「ふつう」で、手本(てほん) なしで 書(か)きましょう！</RubyText>
          </p>
        )}
        {milestone && (
          <p className="g-chip g-chip-gold mt-2 !text-base font-black">
            🏁 <RubyText showFurigana={showFurigana}>{milestone}</RubyText>
          </p>
        )}
        {gems > 0 && showGems && (
          <motion.p
            className="g-chip g-chip-gold mt-3 !text-base tabular-nums"
            initial={still ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + stars * 0.28, type: 'spring', stiffness: 380, damping: 14 }}
          >
            ◆ {shownGems} もらった
          </motion.p>
        )}
        {newFriend && (
          <p className="mt-2 text-sm font-black" style={{ color: '#2f8fe0' }}>
            <RubyText showFurigana={showFurigana}>新(あたら)しい なかまが 来(き)た！</RubyText>
          </p>
        )}

        {opened.map((f) => (
          <div key={f} className="mt-3 rounded-xl px-3 py-2.5 text-left" style={{ background: 'rgba(255,207,74,0.22)', border: '2px dashed #e0a93a' }}>
            <p className="text-sm font-black" style={{ color: '#b0741a' }}>
              <RubyText showFurigana={showFurigana}>{`「${FEATURE_INTRO[f].label}」が つかえます！`}</RubyText>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>{FEATURE_INTRO[f].line}</RubyText>
            </p>
            <button type="button" className="g-btn g-btn-accent mt-2 w-full !min-h-[40px] text-xs" onClick={() => onFeature(f)}>
              <RubyText showFurigana={showFurigana}>見(み)に 行(い)く</RubyText>
            </button>
          </div>
        ))}

        {tutorial ? (
          <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full text-lg" onClick={onTutorialDone}>
            <span className="relative z-10">つぎへ ▶</span>
          </button>
        ) : win ? (
          <>
            <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full !min-h-[56px] text-lg" onClick={hasNext ? onNext : onStages}>
              <span className="relative z-10 flex items-center gap-2">
                <GiPathDistance aria-hidden size={22} />
                <RubyText showFurigana={showFurigana}>{nextLabel ?? (moji ? 'つづきへ' : hasNext ? 'つぎの 話(はなし)へ' : 'ステージへ')}</RubyText>
              </span>
            </button>
            <div className="mt-2.5 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onRetry}>
                <GiCrossedSwords aria-hidden size={16} />
                <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
              </button>
              {!moji && (
                <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onForge}>
                  <GiAnvil aria-hidden size={16} />
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="g-btn g-btn-primary g-shine mt-5 w-full !min-h-[56px] text-lg" onClick={onPractice}>
              <span className="relative z-10 flex items-center gap-2">
                <GiOpenBook aria-hidden size={22} />
                <RubyText showFurigana={showFurigana}>れんしゅうする</RubyText>
              </span>
            </button>
            <div className="mt-2.5 flex gap-2">
              <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onRetry}>
                <GiCrossedSwords aria-hidden size={16} />
                <RubyText showFurigana={showFurigana}>もう一度(いちど)</RubyText>
              </button>
              {!moji && (
                <button type="button" className="g-btn g-btn-ghost flex-1 !min-h-[42px] !px-2 text-sm" onClick={onForge}>
                  <GiAnvil aria-hidden size={16} />
                  <RubyText showFurigana={showFurigana}>合成(ごうせい)</RubyText>
                </button>
              )}
            </div>
            <button type="button" className="mt-3 text-xs font-bold underline" style={{ color: 'var(--ink-2)' }} onClick={onStages}>
              {moji ? 'ステージせんたくへ もどる' : 'ステージへ もどる'}
            </button>
          </>
        )}
      </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultModal;
