import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import { CompanionPick } from './CompanionPick';
import BattleScene from '../battle/BattleScene';
import PictureBook from '../picturebook/PictureBook';
import { RubyText } from '../../components/ui/Ruby';
import { KanjiWord } from '../../components/ui/Readings';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';
import { GameIcon } from '../../components/ui/GameIcon';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { basePatience } from '../../lib/battle';
import { MOJI_OWN_REPS, pickWeakest, repsToNextStar, starsOf } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';
import type { KanjiData } from '../../types/kanji';
import { getMojiEpisode, type MojiEpisode } from '../../data/mojiEpisodes';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { MOJI1_PRELUDE } from '../../data/scripts/moji1';
import { MOJI_CAST, MOJI_SCRIPTS } from '../../data/mojiScripts';
import { UNLOCKED_ON_MOJI } from '../../data/unlocks';
import { afterEpisodePath, canForge, isChapterOpen, isForgeOpen } from '../../data/mojiFlow';
import { finaleNumber, finalePool, getMojiFinale, isFinaleOpen } from '../../data/mojiFinale';
import { MOJI_FINALE_SCRIPTS } from '../../data/mojiFinaleScripts';
import { hardFight, hardFinaleFight, isHardOpen, type Difficulty, type HardFight } from '../../lib/difficulty';
import { assetPath } from '../../lib/assetPath';
import { PhaseDoors } from '../../components/ui/Doors';
import KanjiBackText from './KanjiBackText';
import ToBeContinued from './ToBeContinued';
import StarSecrets from './StarSecrets';
import { TipCard } from './TipCard';
import { nextReadyTip, type TipId } from '../../data/fightRules';
import NexmaxLevelPlate from './NexmaxLevel';
import { useOwnedKanji } from './useOwnedKanji';
import { faceStyle } from '../../lib/faceCrop';

/**
 * 文字が 消えた 町 — one episode (08 §4.2.1, §4.2.2, §3.8):
 *
 *   (出会いの お話) → お話 → write each kanji three times (★1) → 出会い →
 *   じゅんび → たたかい → お話 → the next episode on the map, or つづく
 *
 * 出会い (encounter): the letters just lit draw the opponent in, so the fight
 * is with someone the story has introduced (2026-10-02「いきなり 敵が 出てくる
 * のは 意味不明」). The parts change behind the doors (PhaseDoors).
 * `?at=ready` opens on じゅんび — the way back from 漢字やさん, and the way in
 * to an episode already cleared (more ★, a rematch; the story is a tap away).
 *
 * じゅんび is where writing more pays: each kanji shows its stars and what
 * the next one needs, and a tap goes back to writing it. The fight is
 * written from memory — no model — and the opponent asks for the least-known
 * kanji, so a learner who only did the three will struggle, and one who
 * wrote ten will not. Losing comes back here.
 *
 * The closing scene is drawn with the kanji just written back in place
 * (KanjiBackText).
 */

type Phase = 'prelude' | 'intro' | 'write' | 'encounter' | 'ready' | 'practice' | 'battle' | 'outro' | 'end';

const SCRIPTS = MOJI_SCRIPTS;
const CAST = [...MOJI_CAST];

/** Gems for the first win of an episode. */
const EPISODE_REWARD = 30;

const StarRow = ({ reps, size = 14 }: { reps: number; size?: number }) => {
  const s = starsOf(reps);
  return (
    <span aria-label={`★${s}`} className="tracking-wider" style={{ fontSize: size, color: '#e8a317' }}>
      {'★'.repeat(s)}
      <span style={{ color: 'rgba(122,82,38,0.3)' }}>{'★'.repeat(3 - s)}</span>
    </span>
  );
};

/** じゅんび: the episode's kanji with their stars, and the fight. */
/** The difficulty a link asks for (?mode=), ふつう when it asks for none. */
const modeOf = (m: string | null): Difficulty => (m === 'easy' || m === 'hard' ? m : 'normal');

/**
 * The difficulties are offered from the second fight on: the very first one
 * (1章 1話, or wherever the town begins) teaches the fight itself, one thing
 * at a time (2026-10-04「説明は 1つずつ」). After any town win, all three are
 * open on every episode — before its own first clear too.
 */
const offersDifficulty = (cleared: readonly string[]): boolean => cleared.some((id) => id.startsWith('moji-'));

const ReadyScreen = ({
  ep,
  kanji,
  onPractice,
  onFight,
  onExit,
  onForge,
  onStory,
  difficulty = 'normal',
  onDifficulty,
  hard,
  heading,
  hardNote,
  place,
}: {
  /** The episode, or a まとめの ボス (data/mojiFinale.ts): what is fought, where. */
  ep: Pick<MojiEpisode, 'id' | 'bg' | 'boss'>;
  /** "1章 3話 とけいの …", furigana notation: on the top bar, so じゅんび says where it is (2026-10-05). */
  place?: string;
  kanji: KanjiData[];
  onPractice: (k: KanjiData) => void;
  onFight: () => void;
  onExit: () => void;
  /** 漢字やさん, offered only when it is open and something can be made. */
  onForge?: () => void;
  /** The story again, for an episode already cleared (it opens here, not on the story). */
  onStory?: () => void;
  difficulty?: Difficulty;
  /** 🌱 やさしい ・ ふつう ・ 👹 ハード, open from the first fight (lib/difficulty.ts). */
  onDifficulty?: (d: Difficulty) => void;
  /** Hard's opponent as it stands now — it grows with the player. */
  hard?: HardFight;
  /** A line over the kanji, when they are not simply the episode's (the boss's targets). */
  heading?: string;
  /** What Hard adds, in place of the episode's line. */
  hardNote?: string;
}) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const english = useGameStore((s) => s.settings.english);
  const progress = useGameStore((s) => s.progress);
  const repsOf = (k: KanjiData) => progress[k.id]?.reps ?? 0;
  const total = kanji.reduce((n, k) => n + starsOf(repsOf(k)), 0);
  const weakest = Math.min(...kanji.map((k) => starsOf(repsOf(k))));
  // The kanji the opponent goes for first (BattleScene asks with the same rule):
  // marked, so たたかいの ひみつ's 👾 is right there on the card. Writing it
  // more moves the mark on.
  const isHard = difficulty === 'hard' && hard != null;
  // Hard asks from a wider pool (the chapter's earlier kanji too): the mark follows it.
  const hunted = isHard
    ? pickWeakest(hard.pool, (id) => progress[id]?.reps ?? 0, {}, null)?.id
    : weakest < 3
      ? pickWeakest(kanji, (id) => progress[id]?.reps ?? 0, {}, null)?.id
      : undefined;
  // What has been won here: a higher win counts for the lower difficulties (2026-10-07).
  const hardWon = useGameStore((s) => s.hardStages.includes(ep.id));
  const clearedHere = useGameStore((s) => s.clearedStages.includes(ep.id));
  const easyOnly = useGameStore((s) => (s.easyStages ?? []).includes(ep.id));
  const won: Record<Difficulty, boolean> = { easy: clearedHere || hardWon, normal: (clearedHere && !easyOnly) || hardWon, hard: hardWon };
  // What the stars are for and how the fight goes: told one at a time, a rule a
  // visit (2026-10-04「じゅんびの 説明も 1つずつ」, data/fightRules.ts); the
  // whole of it a tap away. Reading it all counts as told.
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const markTipSeen = useGameStore((s) => s.markTipSeen);
  const [secrets, setSecrets] = useState(false);
  const closeSecrets = () => {
    setSecrets(false);
    markTutorialSeen('stars');
  };
  const [tip, setTip] = useState<TipId | null>(() => {
    const st = useGameStore.getState();
    return nextReadyTip(st.tipsSeen, st.tutorials.stars);
  });
  const closeTip = () => {
    if (tip) markTipSeen(tip);
    setTip(null);
  };

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-6">
      {/* The town behind, its signs faint: the cards sit over them (they peeked out and cluttered it). */}
      <PictureBook scene={ep.bg} className="!fixed -z-10" still signsFaint />
      {secrets && <StarSecrets showFurigana={showFurigana} onClose={closeSecrets} />}
      {tip && !secrets && <TipCard id={tip} showFurigana={showFurigana} onClose={closeTip} />}
      <TopBar onBack={onExit} title={place} />
      <div className="flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3">
        {/* The opponent, so the writing has a reason. */}
        <div
          className="g-parchment flex items-center gap-3 px-3 py-2"
          style={isHard ? { borderColor: 'var(--color-danger)', boxShadow: '0 0 0 2px rgba(220,60,60,0.45)' } : undefined}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2a1840] text-[#c9a4ff]">
            {ep.boss.img ? (
              // Its face, not its whole body shrunk small: each Mojikui is told apart by its face.
              <span aria-hidden className="block h-full w-full" style={faceStyle(ep.boss.img, 56, 1.25)} />
            ) : (
              <GameIcon name={ep.boss.icon} size={38} fallback="☠" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-black" style={{ color: 'var(--color-danger)' }}>
                <RubyText showFurigana={showFurigana}>つぎの あいて</RubyText>
              </p>
              {onDifficulty && (
                <div className="flex shrink-0 overflow-hidden rounded-full border-2 border-[#caa468] text-[11px] font-black" role="group" aria-label="むずかしさ">
                  {(['easy', 'normal', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={difficulty === d}
                      onClick={() => onDifficulty(d)}
                      className="px-1.5 leading-[1.9]"
                      style={
                        difficulty === d
                          ? { background: d === 'hard' ? 'var(--color-danger)' : d === 'easy' ? '#4f9a3c' : '#caa468', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.7)', color: 'var(--ink-2)' }
                      }
                    >
                      {`${d === 'hard' ? '👹ハード' : d === 'easy' ? '🌱やさしい' : 'ふつう'}${won[d] ? '✓' : ''}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-lg font-black">
              <RubyText showFurigana={showFurigana}>{ep.boss.name}</RubyText>
            </p>
            {/* Its nature in a word: each Mojikui is someone (2026-10-04「もう少し 個性が 欲しい」). */}
            {ep.boss.trait && (
              <p className="mt-0.5 inline-flex flex-wrap items-center gap-1 rounded-full bg-[#2a1840] px-2 text-[12px] leading-[2] font-black text-[#f0e2ff]">
                <span aria-hidden>{ep.boss.trait.icon}</span>
                <RubyText showFurigana={showFurigana}>{ep.boss.trait.ja}</RubyText>
                {english && (
                  <span lang="en" className="font-bold text-[#c9b3ff]">
                    · {ep.boss.trait.en}
                  </span>
                )}
              </p>
            )}
            <p className="text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
              HP {isHard ? hard.boss.hp : ep.boss.hp} ・{' '}
              <RubyText showFurigana={showFurigana}>
                {isHard
                  ? (hardNote ??
                    (hard.pool.length > kanji.length ? '前(まえ)の 話(はなし)の 字(じ)も 出(で)る' : '書(か)く たびに 読(よ)む ターン'))
                  : difficulty === 'easy'
                    ? '手本(てほん)を 見(み)て 書(か)く・ミス ＋2'
                    : '手本(てほん)なしで 書(か)く'}
              </RubyText>
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <button
            type="button"
            onClick={() => setSecrets(true)}
            className="g-parchment flex-1 px-3 py-2 text-left text-[13px] leading-[1.9] font-bold active:scale-[0.98]"
          >
            <RubyText showFurigana={showFurigana}>
              {isHard
                ? '👹 ハードの あいては 強(つよ)いです。ミスを へらしましょう！'
                : weakest >= 2
                  ? 'じゅんび ばっちり！ たたかいましょう。'
                  : '★が 多(おお)い 字(じ)は、こうげきが 強(つよ)いです。たくさん 書(か)きましょう！'}
            </RubyText>
            <span className="block text-xs font-black" style={{ color: 'var(--accent-2)' }}>
              ★・たたかいの ひみつ ▸
            </span>
          </button>
          <NexmaxSays text={weakest >= 2 ? 'いける！' : 'もっと 書(か)く？'} pose={weakest >= 2 ? 'cheer' : 'guide'} size={64} />
        </div>

        {/* ネクマックスの レベル: there from the start (09 §2). */}
        <NexmaxLevelPlate showFurigana={showFurigana} />
        {/* なかま: who comes along and what their わざ does (11 §3.3). */}
        <CompanionPick bossElement={ep.boss.element} showFurigana={showFurigana} />

        {heading && (
          <p className="rt-light -mb-1 self-start rounded-full bg-[#1b1430]/75 px-3 text-xs leading-[2.2] font-black text-[#ffe9c2]">
            <RubyText showFurigana={showFurigana}>{heading}</RubyText>
          </p>
        )}
        <ul className="grid grid-cols-2 gap-2">
          {kanji.map((k, i) => {
            const reps = repsOf(k);
            const left = repsToNextStar(reps);
            return (
              <motion.li
                key={k.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => onPractice(k)}
                  className="g-parchment relative flex w-full items-center gap-2 !rounded-2xl px-2 py-1.5 text-left active:scale-[0.97]"
                  style={starsOf(reps) === 3 ? { borderColor: '#e8a317', boxShadow: '0 0 0 2px rgba(255,210,90,0.6)' } : undefined}
                >
                  {k.id === hunted && (
                    <span
                      className="absolute -top-2 -right-1 rounded-full bg-[#2a1840] px-1.5 text-[10px] leading-[1.8] font-black text-[#e9d6ff] shadow"
                      aria-label="ねらわれる"
                    >
                      👾 ねらわれる
                    </span>
                  )}
                  <span className="text-[34px] leading-[1.5] font-black">
                    <KanjiWord kanji={k} showFurigana={showFurigana} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <StarRow reps={reps} />
                    <span className="block text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
                      <RubyText showFurigana={showFurigana}>
                        {left === 0 ? 'マスター' : `✎ あと ${left}回(かい)で ★${starsOf(reps) + 1}`}
                      </RubyText>
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* On the painted station: a dark pill, so the line reads over any picture. */}
        <p className="rt-light mx-auto rounded-full bg-[#1b1430]/75 px-4 text-center text-xs leading-[2.2] font-black text-[#ffe9c2]">
          <RubyText showFurigana={showFurigana}>{`★ ${total} / ${kanji.length * 3} ・ 字(じ)を タップ → もっと 書(か)く`}</RubyText>
        </p>
        {onStory && (
          <button
            type="button"
            onClick={onStory}
            className="rt-light mx-auto -mt-1 rounded-full bg-[#1b1430]/75 px-4 text-xs leading-[2.2] font-black text-[#ffe9c2] underline underline-offset-2"
          >
            📖 <RubyText showFurigana={showFurigana}>おはなしを もう一度(いちど)</RubyText>
          </button>
        )}

        {onForge && (
          <button type="button" className="g-btn g-btn-accent w-full" onClick={onForge}>
            🔨 <RubyText showFurigana={showFurigana}>漢字(かんじ)やさんで 武器(ぶき)を 作(つく)る</RubyText>
          </button>
        )}

        {/* Face to face before the fight: Nexmax and the opponent, in the room left above the button. */}
        {ep.boss.img && (
          <div aria-hidden className="relative mt-1 flex flex-1 items-end justify-center gap-1 [@media(max-height:699px)]:hidden">
            <motion.img
              src={assetPath('img/chara/naniwa/nexmax_determined.webp')}
              alt=""
              className="h-[min(210px,22dvh)] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 8px 10px rgba(10,6,30,0.45))' }}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.15 }}
            />
            <motion.span
              className="mb-[12%] font-black text-[34px] leading-none text-[#ffd36a]"
              style={{ textShadow: '0 3px 0 #7a2a00, 0 0 18px rgba(255,150,40,0.8)', fontFamily: 'var(--font-display)' }}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.45 }}
            >
              VS
            </motion.span>
            <motion.img
              src={assetPath(ep.boss.img)}
              alt=""
              className="h-[min(210px,22dvh)] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 16px rgba(130,70,210,0.55))' }}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.25 }}
            />
          </div>
        )}

        <motion.button
          type="button"
          className="g-btn g-btn-red sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 mt-auto w-full text-xl"
          onClick={onFight}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ willChange: 'transform' }}
        >
          <span aria-hidden>{isHard ? '👹 ' : '⚔ '}</span>
          <RubyText showFurigana={showFurigana}>{isHard ? 'ハードで たたかう！' : 'たたかう！'}</RubyText>
        </motion.button>
      </div>
    </div>
  );
};

const EpisodePlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ep = getMojiEpisode(id)!;
  const lines = SCRIPTS[id];
  const chapter = MOJI_CHAPTERS.find((c) => c.id === ep.chapter)!;
  const owned = useOwnedKanji();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const cleared = useGameStore((s) => s.clearedStages);
  const [kanji] = useState(() => ep.kanji.map((c) => getKanjiByChar(c)!));
  // The kanji still short of ★1, fixed on arrival.
  const [queue] = useState(() => {
    const progress = useGameStore.getState().progress;
    return kanji.filter((k) => (progress[k.id]?.reps ?? 0) < MOJI_OWN_REPS);
  });
  // Where the episode opens: じゅんび when coming back to it (漢字やさん,
  // つづく), the meeting with Nexmax for a player who skipped 0章 and has not
  // played this episode yet, otherwise the story.
  const [phase, setPhase] = useState<Phase>(() => {
    if (params.get('at') === 'ready') return 'ready';
    const saw = useGameStore.getState().clearedStages;
    return ep.id === 'moji-1-1' && !saw.includes('kana-10') && !saw.includes(ep.id) ? 'prelude' : 'intro';
  });
  const [idx, setIdx] = useState(0);
  const [practice, setPractice] = useState<KanjiData | null>(null);
  const [battleKey, setBattleKey] = useState(0);
  // やさしい・ふつう・👹 ハード (lib/difficulty.ts), open from the first fight.
  // ?mode= keeps it across a trip to 漢字やさん.
  const [difficulty, setDifficulty] = useState<Difficulty>(() => modeOf(params.get('mode')));
  const hard = difficulty === 'hard';
  // Hard's opponent as it stands — じゅんび shows it, and it grows as the player does.
  const weapons = useGameStore((s) => s.weapons);
  const equippedWeapon = useGameStore((s) => s.equippedWeapon);
  const activeIndividual = useGameStore((s) => s.activeIndividual);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const exp = useGameStore((s) => s.exp);
  const hardNow = useMemo(
    () => (hard ? hardFight(ep, { weapons, equippedWeapon, activeIndividual, equippedGear, exp, progress }) : undefined),
    [hard, ep, weapons, equippedWeapon, activeIndividual, equippedGear, exp, progress],
  );
  // …and fixed as the fight starts: writing mid-fight must not move it.
  const [fight, setFight] = useState<HardFight | null>(null);
  // A Hard win on an episode already cleared is a rematch: back to じゅんび, not the story's end.
  const [rematch, setRematch] = useState(false);
  const startFight = () => {
    const s = useGameStore.getState();
    setFight(hard ? hardFight(ep, s) : null);
    setRematch(isHardOpen(ep.id, s.clearedStages));
    setBattleKey((n) => n + 1);
  };

  useEffect(() => {
    void preloadCharData(ep.kanji);
  }, [ep]);
  useEffect(() => {
    if (hardNow) void preloadCharData(hardNow.pool.map((k) => k.char));
  }, [hardNow]);

  const renderText = useCallback((text: string) => <KanjiBackText owned={owned}>{text}</KanjiBackText>, [owned]);
  const label = { label: `${chapter.order}章(しょう) ${ep.order}話(わ)`, title: ep.title };
  // Back where the player came from (2026-10-02「戻り先は 来た ところ」): ずかん's ✎ passes ?back=.
  const back = params.get('back');
  const leave = () => navigate(back?.startsWith('/') ? back : '/map/moji');
  const toReady = () => setPhase('ready');
  const forgeHere = `/forge?back=${encodeURIComponent(`/moji/${ep.id}?at=ready${difficulty !== 'normal' ? `&mode=${difficulty}` : ''}`)}`;

  // The win records the clear (BattleScene); the story's end moves on.
  const finish = () => {
    const state = useGameStore.getState();
    // 1章 2話 opens 漢字やさん: the first weapon (火山) is made there now, together (docs/design/16 §2).
    if (ep.id === UNLOCKED_ON_MOJI.forge && !state.tutorials.firstWeapon) {
      navigate('/forge?first=1');
      return;
    }
    // 1章 4話 opens the gacha and gives its first ticket: the first pull is made now, shown how (docs/design/16 §3).
    if (ep.id === UNLOCKED_ON_MOJI.gacha && !state.tutorials.gacha && state.gachaTickets > 0) {
      navigate('/gacha?first=1');
      return;
    }
    // The chapter's last episode runs straight on into its まとめの ボス; a replay goes back to the map.
    const path = afterEpisodePath(ep.id, state.clearedStages);
    if (path) navigate(path);
    else setPhase('end');
  };

  const view = (() => {
    switch (phase) {
      case 'prelude':
        return <NovelScene look="night" bgm="sad" key="prelude" script={MOJI1_PRELUDE} cast={CAST} chapter={label} renderText={renderText} onFinish={() => setPhase('intro')} />;
      case 'intro':
        return (
          <NovelScene look="night" bgm="sad" holdLetters={ep.kanji}
            key="intro"
            script={lines.intro}
            cast={CAST}
            chapter={label}
            renderText={renderText}
            onFinish={() => setPhase(queue.length ? 'write' : 'encounter')}
          />
        );
      case 'write': {
        const k = queue[idx];
        const nextKanji = () => (idx + 1 < queue.length ? setIdx(idx + 1) : setPhase('encounter'));
        return (
          <KanjiDrill
            key={k.id}
            kanji={k}
            goal={MOJI_OWN_REPS}
            look="sign"
            scene={ep.bg}
            letters={ep.kanji}
            onExit={leave}
            onDone={nextKanji}
            nextLabel={idx + 1 < queue.length ? `つぎの 字(じ)（${idx + 2}/${queue.length}）` : 'つぎへ'}
          />
        );
      }
      case 'encounter':
        return <NovelScene look="night" bgm="tension" key="encounter" script={lines.encounter} cast={CAST} chapter={label} renderText={renderText} onFinish={toReady} />;
      case 'ready':
        return (
          <ReadyScreen
            ep={ep}
            place={`${label.label} ${label.title}`}
            kanji={kanji}
            onExit={leave}
            onFight={() => {
              startFight();
              setPhase('battle');
            }}
            onPractice={(k) => {
              setPractice(k);
              setPhase('practice');
            }}
            onForge={isForgeOpen(cleared) && canForge(progress) ? () => navigate(forgeHere) : undefined}
            onStory={cleared.includes(ep.id) ? () => setPhase('intro') : undefined}
            difficulty={difficulty}
            onDifficulty={offersDifficulty(cleared) ? setDifficulty : undefined}
            hard={hardNow}
          />
        );
      case 'practice':
        return (
          <KanjiDrill
            key={practice!.id}
            kanji={practice!}
            goal={MOJI_OWN_REPS}
            look="sign"
            scene={ep.bg}
            letters={ep.kanji}
            onExit={toReady}
            onDone={toReady}
            nextLabel="じゅんびに もどる"
            extra={
              <button type="button" className="g-btn g-btn-accent w-full" onClick={toReady}>
                <RubyText showFurigana={showFurigana}>じゅんびに もどる</RubyText>
              </button>
            }
          />
        );
      case 'battle':
        return (
          <BattleScene
            key={battleKey}
            stage={{
              id: ep.id,
              bg: ep.bg,
              boss: fight ? { ...ep.boss, hp: fight.boss.hp, attack: fight.boss.attack } : ep.boss,
              reward: EPISODE_REWARD,
              grants: ep.grants,
            }}
            kanjiPool={fight ? fight.pool : kanji}
            patience={fight ? fight.patience : basePatience(ep.order)}
            seals={fight?.seals}
            difficulty={fight ? 'hard' : difficulty === 'easy' ? 'easy' : 'normal'}
            mastery
            onFinish={leave}
            onFlee={toReady}
            // Hard on a cleared episode is a rematch: back to じゅんび, not through the story again.
            onNext={fight && rematch ? toReady : () => setPhase('outro')}
            onRetry={startFight}
            onPractice={toReady}
            onForge={() => navigate(forgeHere)}
          />
        );
      case 'outro':
        return <NovelScene look="night" key="outro" script={lines.outro} cast={CAST} chapter={label} renderText={renderText} onFinish={finish} />;
      case 'end':
        return (
          <ToBeContinued
            scene={ep.bg}
            onPractice={(target) => (target === ep.id ? toReady() : navigate(`/moji/${target}?at=ready`))}
            onForge={() => navigate(`/forge?back=${encodeURIComponent('/map/moji')}`)}
            onStages={leave}
          />
        );
    }
  })();

  // じゅんび ⇄ れんしゅう and the story's parts change behind the doors; one
  // kanji to the next (same part) does not.
  return <PhaseDoors phase={phase}>{view}</PhaseDoors>;
};

type FinalePhase = 'intro' | 'ready' | 'practice' | 'battle' | 'outro' | 'end';

/**
 * まとめの ボス (data/mojiFinale.ts, docs/design/10 §3): お話 → じゅんび →
 * たたかい → お話 → つづく. No new kanji, so no writing first: じゅんび shows
 * the ten the boss will go for — the chapter's least known, live, so
 * practising one moves the next one in — and the fight asks those ten,
 * fixed as it starts. Without its story yet, it opens on じゅんび.
 */
const FinalePlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const f = getMojiFinale(id)!;
  const script = MOJI_FINALE_SCRIPTS[id];
  const chapter = MOJI_CHAPTERS.find((c) => c.id === f.chapter)!;
  const owned = useOwnedKanji();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const cleared = useGameStore((s) => s.clearedStages);
  const [phase, setPhase] = useState<FinalePhase>(() => (params.get('at') === 'ready' || !script ? 'ready' : 'intro'));
  const [practice, setPractice] = useState<KanjiData | null>(null);
  const [battleKey, setBattleKey] = useState(0);
  const shown = useMemo(() => finalePool(f, progress), [f, progress]);

  const [difficulty, setDifficulty] = useState<Difficulty>(() => modeOf(params.get('mode')));
  const hard = difficulty === 'hard';
  const weapons = useGameStore((s) => s.weapons);
  const equippedWeapon = useGameStore((s) => s.equippedWeapon);
  const activeIndividual = useGameStore((s) => s.activeIndividual);
  const equippedGear = useGameStore((s) => s.equippedGear);
  const exp = useGameStore((s) => s.exp);
  const hardNow = useMemo(
    () => (hard ? hardFinaleFight(f, { weapons, equippedWeapon, activeIndividual, equippedGear, exp, progress }) : undefined),
    [hard, f, weapons, equippedWeapon, activeIndividual, equippedGear, exp, progress],
  );
  // What the fight asks, fixed as it starts: writing mid-fight must not move it.
  const [fight, setFight] = useState<HardFight | null>(null);
  const [pool, setPool] = useState<KanjiData[]>(shown);
  const [rematch, setRematch] = useState(false);
  const startFight = () => {
    const s = useGameStore.getState();
    setFight(hard ? hardFinaleFight(f, s) : null);
    setRematch(isHardOpen(f.id, s.clearedStages));
    setPool(finalePool(f, s.progress));
    setBattleKey((n) => n + 1);
  };

  useEffect(() => {
    void preloadCharData(shown.map((k) => k.char));
  }, [shown]);
  useEffect(() => {
    if (hardNow) void preloadCharData(hardNow.pool.slice(0, 20).map((k) => k.char));
  }, [hardNow]);

  const renderText = useCallback((text: string) => <KanjiBackText owned={owned}>{text}</KanjiBackText>, [owned]);
  const label = { label: `${chapter.order}章(しょう) ${finaleNumber(f)}話(わ)`, title: f.title };
  const back = params.get('back');
  const leave = () => navigate(back?.startsWith('/') ? back : '/map/moji');
  const toReady = () => setPhase('ready');
  const forgeHere = `/forge?back=${encodeURIComponent(`/moji/${f.id}?at=ready${difficulty !== 'normal' ? `&mode=${difficulty}` : ''}`)}`;
  const finish = () => {
    const path = afterEpisodePath(f.id, useGameStore.getState().clearedStages);
    if (path) navigate(path);
    else setPhase('end');
  };

  const view = (() => {
    switch (phase) {
      case 'intro':
        return script ? (
          <NovelScene look="night" bgm="tension" key="intro" script={script.intro} cast={CAST} chapter={label} renderText={renderText} onFinish={toReady} />
        ) : null;
      case 'ready':
        return (
          <ReadyScreen
            ep={f}
            place={`${label.label} ${label.title}`}
            kanji={shown}
            onExit={leave}
            onFight={() => {
              startFight();
              setPhase('battle');
            }}
            onPractice={(k) => {
              setPractice(k);
              setPhase('practice');
            }}
            onForge={isForgeOpen(cleared) && canForge(progress) ? () => navigate(forgeHere) : undefined}
            onStory={script && cleared.includes(f.id) ? () => setPhase('intro') : undefined}
            difficulty={difficulty}
            onDifficulty={offersDifficulty(cleared) ? setDifficulty : undefined}
            hard={hardNow}
            heading={`👾 ${f.boss.name}が ねらう 字(じ)`}
            hardNote={`${chapter.order}章(しょう)の 字(じ)が ぜんぶ 出(で)る`}
          />
        );
      case 'practice':
        return (
          <KanjiDrill
            key={practice!.id}
            kanji={practice!}
            goal={MOJI_OWN_REPS}
            look="sign"
            scene={f.bg}
            letters={shown.map((k) => k.char)}
            onExit={toReady}
            onDone={toReady}
            nextLabel="じゅんびに もどる"
            extra={
              <button type="button" className="g-btn g-btn-accent w-full" onClick={toReady}>
                <RubyText showFurigana={showFurigana}>じゅんびに もどる</RubyText>
              </button>
            }
          />
        );
      case 'battle':
        return (
          <BattleScene
            key={battleKey}
            stage={{ id: f.id, bg: f.bg, boss: fight ? { ...f.boss, hp: fight.boss.hp, attack: fight.boss.attack } : f.boss, reward: f.reward }}
            kanjiPool={fight ? fight.pool : pool}
            patience={fight ? fight.patience : f.patience}
            seals={fight?.seals}
            difficulty={fight ? 'hard' : difficulty === 'easy' ? 'easy' : 'normal'}
            mastery
            clearLine={`${chapter.order}章(しょう)「${chapter.title}」 クリア！`}
            onFinish={leave}
            onFlee={toReady}
            onNext={fight && rematch ? toReady : script ? () => setPhase('outro') : finish}
            onRetry={startFight}
            onPractice={toReady}
            onForge={() => navigate(forgeHere)}
          />
        );
      case 'outro':
        return script ? (
          <NovelScene look="night" key="outro" script={script.outro} cast={CAST} chapter={label} renderText={renderText} onFinish={finish} />
        ) : null;
      case 'end':
        return (
          <ToBeContinued
            scene={f.bg}
            onPractice={(target) => navigate(`/moji/${target}?at=ready`)}
            onForge={() => navigate(`/forge?back=${encodeURIComponent('/map/moji')}`)}
            onStages={leave}
          />
        );
    }
  })();

  return <PhaseDoors phase={phase}>{view}</PhaseDoors>;
};

export const MojiEpisodeScreen = () => {
  const { id = '' } = useParams<{ id: string }>();
  const cleared = useGameStore((s) => s.clearedStages);
  // A まとめの ボス: once its chapter is complete and its last episode cleared.
  const finale = getMojiFinale(id);
  if (finale) {
    return isFinaleOpen(finale, cleared) || cleared.includes(id) ? <FinalePlayer key={id} id={id} /> : <Navigate to="/map/moji" replace />;
  }
  const ep = getMojiEpisode(id);
  if (!ep || !SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  // A later chapter waits for the one before it (its まとめの ボス).
  if (!isChapterOpen(ep.chapter, cleared) && !cleared.includes(id)) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default MojiEpisodeScreen;
