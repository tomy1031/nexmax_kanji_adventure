import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
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
import { MOJI1_CAST, MOJI1_PRELUDE, MOJI1_SCRIPTS } from '../../data/scripts/moji1';
import { afterEpisode, canForge, isForgeOpen } from '../../data/mojiFlow';
import { finaleNumber, finalePool, getMojiFinale, isFinaleOpen } from '../../data/mojiFinale';
import { MOJI_FINALE_SCRIPTS } from '../../data/mojiFinaleScripts';
import { hardFight, hardFinaleFight, isHardOpen, type Difficulty, type HardFight } from '../../lib/difficulty';
import { assetPath } from '../../lib/assetPath';
import { PhaseDoors } from '../../components/ui/Doors';
import KanjiBackText from './KanjiBackText';
import ToBeContinued from './ToBeContinued';
import StarSecrets from './StarSecrets';
import NexmaxLevelPlate from './NexmaxLevel';
import { useOwnedKanji } from './useOwnedKanji';

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

const SCRIPTS = MOJI1_SCRIPTS;
const CAST = MOJI1_CAST;

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
}: {
  /** The episode, or a まとめの ボス (data/mojiFinale.ts): what is fought, where. */
  ep: Pick<MojiEpisode, 'id' | 'bg' | 'boss'>;
  kanji: KanjiData[];
  onPractice: (k: KanjiData) => void;
  onFight: () => void;
  onExit: () => void;
  /** 漢字やさん, offered only when it is open and something can be made. */
  onForge?: () => void;
  /** The story again, for an episode already cleared (it opens here, not on the story). */
  onStory?: () => void;
  difficulty?: Difficulty;
  /** ふつう ⇄ 👹 ハード, offered once the episode is cleared (lib/difficulty.ts). */
  onDifficulty?: (d: Difficulty) => void;
  /** Hard's opponent as it stands now — it grows with the player. */
  hard?: HardFight;
  /** A line over the kanji, when they are not simply the episode's (the boss's targets). */
  heading?: string;
  /** What Hard adds, in place of the episode's line. */
  hardNote?: string;
}) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
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
  const hardWon = useGameStore((s) => s.hardStages.includes(ep.id));
  // What the stars are for and how the fight goes: shown by itself on the first じゅんび, then a tap away.
  const markTutorialSeen = useGameStore((s) => s.markTutorialSeen);
  const [secrets, setSecrets] = useState(() => !useGameStore.getState().tutorials.stars);
  const closeSecrets = () => {
    setSecrets(false);
    markTutorialSeen('stars');
  };

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-6">
      {/* The town behind, its signs faint: the cards sit over them (they peeked out and cluttered it). */}
      <PictureBook scene={ep.bg} className="!fixed -z-10" still signsFaint />
      {secrets && <StarSecrets showFurigana={showFurigana} onClose={closeSecrets} />}
      <TopBar onBack={onExit} />
      <div className="flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3">
        {/* The opponent, so the writing has a reason. */}
        <div
          className="g-parchment flex items-center gap-3 px-3 py-2"
          style={isHard ? { borderColor: 'var(--color-danger)', boxShadow: '0 0 0 2px rgba(220,60,60,0.45)' } : undefined}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2a1840] text-[#c9a4ff]">
            {ep.boss.img ? (
              <img src={assetPath(ep.boss.img)} alt="" aria-hidden className="h-full w-full object-contain" />
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
                  {(['normal', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={difficulty === d}
                      onClick={() => onDifficulty(d)}
                      className="px-2 leading-[1.9]"
                      style={
                        difficulty === d
                          ? { background: d === 'hard' ? 'var(--color-danger)' : '#caa468', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.7)', color: 'var(--ink-2)' }
                      }
                    >
                      {d === 'hard' ? `👹 ハード${hardWon ? ' ✓' : ''}` : 'ふつう'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-lg font-black">
              <RubyText showFurigana={showFurigana}>{ep.boss.name}</RubyText>
            </p>
            <p className="text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
              HP {isHard ? hard.boss.hp : ep.boss.hp} ・{' '}
              <RubyText showFurigana={showFurigana}>
                {isHard
                  ? (hardNote ??
                    (hard.pool.length > kanji.length ? '前(まえ)の 話(はなし)の 字(じ)も 出(で)る' : '書(か)く たびに 読(よ)む ターン'))
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
                ? '👹 ハードの あいては 今(いま)の 強(つよ)さに あわせて 強(つよ)く なる。ミスを へらして 勝(か)とう！'
                : weakest >= 2
                  ? 'じゅんび ばっちり！ たたかおう。'
                  : '★が 多(おお)いほど こうげきが 強(つよ)い。書(か)けば 書(か)くほど 勝(か)ちやすく なる。'}
            </RubyText>
            <span className="block text-xs font-black" style={{ color: 'var(--accent-2)' }}>
              ★・たたかいの ひみつ ▸
            </span>
          </button>
          <NexmaxSays text={weakest >= 2 ? 'いける！' : 'もっと 書(か)く？'} pose={weakest >= 2 ? 'cheer' : 'guide'} size={64} />
        </div>

        {/* ネクマックスの レベル: there from the start (09 §2). */}
        <NexmaxLevelPlate showFurigana={showFurigana} />

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
          <RubyText showFurigana={showFurigana}>{`★ ${total} / ${kanji.length * 3} ・ 字(じ)を タップすると もっと 書(か)ける`}</RubyText>
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
  // ふつう or 👹 ハード (lib/difficulty.ts): Hard once the episode is cleared.
  // ?mode=hard keeps it across a trip to 漢字やさん.
  const hardOpen = isHardOpen(ep.id, cleared);
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    params.get('mode') === 'hard' && isHardOpen(ep.id, useGameStore.getState().clearedStages) ? 'hard' : 'normal',
  );
  const hard = hardOpen && difficulty === 'hard';
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
  const startFight = () => {
    setFight(hard ? hardFight(ep, useGameStore.getState()) : null);
    setBattleKey((n) => n + 1);
  };

  useEffect(() => {
    void preloadCharData(ep.kanji);
  }, [ep]);
  useEffect(() => {
    if (hardNow) void preloadCharData(hardNow.pool.map((k) => k.char));
  }, [hardNow]);

  const renderText = useCallback((text: string) => <KanjiBackText owned={owned}>{text}</KanjiBackText>, [owned]);
  const label = { label: `${chapter.order}章(しょう) ${ep.order}`, title: ep.title };
  // Back where the player came from (2026-10-02「戻り先は 来た ところ」): ずかん's ✎ passes ?back=.
  const back = params.get('back');
  const leave = () => navigate(back?.startsWith('/') ? back : '/map/moji');
  const toReady = () => setPhase('ready');
  const forgeHere = `/forge?back=${encodeURIComponent(`/moji/${ep.id}?at=ready${hard ? '&mode=hard' : ''}`)}`;

  // The win records the clear (BattleScene); the story's end moves on.
  const finish = () => {
    const next = afterEpisode(ep.id, useGameStore.getState().clearedStages);
    // The chapter's last episode runs straight on into its まとめの ボス.
    if (next && getMojiFinale(next)) navigate(`/moji/${next}`);
    else if (next) navigate(`/map/moji?new=${next}`);
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
            difficulty={hard ? 'hard' : 'normal'}
            onDifficulty={hardOpen ? setDifficulty : undefined}
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
            difficulty={fight ? 'hard' : 'normal'}
            mastery
            onFinish={leave}
            onFlee={toReady}
            // Hard is a rematch: back to じゅんび, not through the story again.
            onNext={fight ? toReady : () => setPhase('outro')}
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

  const hardOpen = isHardOpen(f.id, cleared);
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    params.get('mode') === 'hard' && isHardOpen(f.id, useGameStore.getState().clearedStages) ? 'hard' : 'normal',
  );
  const hard = hardOpen && difficulty === 'hard';
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
  const startFight = () => {
    const s = useGameStore.getState();
    setFight(hard ? hardFinaleFight(f, s) : null);
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
  const label = { label: `${chapter.order}章(しょう) ${finaleNumber(f)}`, title: f.title };
  const back = params.get('back');
  const leave = () => navigate(back?.startsWith('/') ? back : '/map/moji');
  const toReady = () => setPhase('ready');
  const forgeHere = `/forge?back=${encodeURIComponent(`/moji/${f.id}?at=ready${hard ? '&mode=hard' : ''}`)}`;
  const finish = () => {
    const next = afterEpisode(f.id, useGameStore.getState().clearedStages);
    if (next) navigate(`/map/moji?new=${next}`);
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
            difficulty={hard ? 'hard' : 'normal'}
            onDifficulty={hardOpen ? setDifficulty : undefined}
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
            difficulty={fight ? 'hard' : 'normal'}
            mastery
            clearLine={`${chapter.order}章(しょう)「${chapter.title}」 クリア！`}
            onFinish={leave}
            onFlee={toReady}
            onNext={fight ? toReady : script ? () => setPhase('outro') : finish}
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
  if (!getMojiEpisode(id) || !SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default MojiEpisodeScreen;
