import { useCallback, useEffect, useState } from 'react';
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
import { MOJI_OWN_REPS, repsToNextStar, starsOf } from '../../lib/mastery';
import { useGameStore } from '../../store/gameStore';
import type { KanjiData } from '../../types/kanji';
import { getMojiEpisode, type MojiEpisode } from '../../data/mojiEpisodes';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { MOJI1_CAST, MOJI1_PRELUDE, MOJI1_SCRIPTS } from '../../data/scripts/moji1';
import { afterEpisode, canForge, isForgeOpen } from '../../data/mojiFlow';
import { assetPath } from '../../lib/assetPath';
import { PhaseDoors } from '../../components/ui/Doors';
import KanjiBackText from './KanjiBackText';
import ToBeContinued from './ToBeContinued';
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
 * `?at=ready` opens on じゅんび — the way back from 漢字やさん.
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
}: {
  ep: MojiEpisode;
  kanji: KanjiData[];
  onPractice: (k: KanjiData) => void;
  onFight: () => void;
  onExit: () => void;
  /** 漢字やさん, offered only when it is open and something can be made. */
  onForge?: () => void;
}) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const progress = useGameStore((s) => s.progress);
  const repsOf = (k: KanjiData) => progress[k.id]?.reps ?? 0;
  const total = kanji.reduce((n, k) => n + starsOf(repsOf(k)), 0);
  const weakest = Math.min(...kanji.map((k) => starsOf(repsOf(k))));

  return (
    <div className="isolate relative flex min-h-dvh flex-col items-center pb-6">
      <PictureBook scene={ep.bg} className="!fixed -z-10" still />
      <TopBar onBack={onExit} />
      <div className="flex w-full max-w-md flex-1 flex-col gap-3 px-3 pt-3">
        {/* The opponent, so the writing has a reason. */}
        <div className="g-parchment flex items-center gap-3 px-3 py-2">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2a1840] text-[#c9a4ff]">
            {ep.boss.img ? (
              <img src={assetPath(ep.boss.img)} alt="" aria-hidden className="h-full w-full object-contain" />
            ) : (
              <GameIcon name={ep.boss.icon} size={38} fallback="☠" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black" style={{ color: 'var(--color-danger)' }}>
              <RubyText showFurigana={showFurigana}>つぎの あいて</RubyText>
            </p>
            <p className="text-lg font-black">
              <RubyText showFurigana={showFurigana}>{ep.boss.name}</RubyText>
            </p>
            <p className="text-[11px] font-bold" style={{ color: 'var(--ink-2)' }}>
              HP {ep.boss.hp} ・ <RubyText showFurigana={showFurigana}>手本(てほん)なしで 書(か)く</RubyText>
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="g-parchment flex-1 px-3 py-2 text-[13px] leading-[1.9] font-bold">
            <RubyText showFurigana={showFurigana}>
              {weakest >= 2
                ? 'じゅんび ばっちり！ たたかおう。'
                : '★が 多(おお)いほど こうげきが 強(つよ)い。書(か)けば 書(か)くほど 勝(か)ちやすく なる。'}
            </RubyText>
          </div>
          <NexmaxSays text={weakest >= 2 ? 'いける！' : 'もっと 書(か)く？'} pose={weakest >= 2 ? 'cheer' : 'guide'} size={64} />
        </div>

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
                  className="g-parchment flex w-full items-center gap-2 !rounded-2xl px-2 py-1.5 text-left active:scale-[0.97]"
                  style={starsOf(reps) === 3 ? { borderColor: '#e8a317', boxShadow: '0 0 0 2px rgba(255,210,90,0.6)' } : undefined}
                >
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
          <span aria-hidden>⚔ </span>
          <RubyText showFurigana={showFurigana}>たたかう！</RubyText>
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

  useEffect(() => {
    void preloadCharData(ep.kanji);
  }, [ep]);

  const renderText = useCallback((text: string) => <KanjiBackText owned={owned}>{text}</KanjiBackText>, [owned]);
  const label = { label: `${chapter.order}章(しょう) ${ep.order}`, title: ep.title };
  const leave = () => navigate('/map/moji');
  const toReady = () => setPhase('ready');
  const forgeHere = `/forge?back=${encodeURIComponent(`/moji/${ep.id}?at=ready`)}`;

  // The win records the clear (BattleScene); the story's end moves on.
  const finish = () => {
    const next = afterEpisode(ep.id);
    if (next) navigate(`/map/moji?new=${next}`);
    else setPhase('end');
  };

  const view = (() => {
    switch (phase) {
      case 'prelude':
        return <NovelScene key="prelude" script={MOJI1_PRELUDE} cast={CAST} chapter={label} renderText={renderText} onFinish={() => setPhase('intro')} />;
      case 'intro':
        return (
          <NovelScene
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
            onExit={leave}
            onDone={nextKanji}
            nextLabel={idx + 1 < queue.length ? `つぎの 字(じ)（${idx + 2}/${queue.length}）` : 'つぎへ'}
          />
        );
      }
      case 'encounter':
        return <NovelScene key="encounter" script={lines.encounter} cast={CAST} chapter={label} renderText={renderText} onFinish={toReady} />;
      case 'ready':
        return (
          <ReadyScreen
            ep={ep}
            kanji={kanji}
            onExit={leave}
            onFight={() => {
              setBattleKey((n) => n + 1);
              setPhase('battle');
            }}
            onPractice={(k) => {
              setPractice(k);
              setPhase('practice');
            }}
            onForge={isForgeOpen(cleared) && canForge(progress) ? () => navigate(forgeHere) : undefined}
          />
        );
      case 'practice':
        return (
          <KanjiDrill
            key={practice!.id}
            kanji={practice!}
            goal={MOJI_OWN_REPS}
            look="sign"
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
            stage={{ id: ep.id, bg: ep.bg, boss: ep.boss, reward: EPISODE_REWARD }}
            kanjiPool={kanji}
            patience={basePatience(ep.order)}
            mastery
            onFinish={leave}
            onFlee={toReady}
            onNext={() => setPhase('outro')}
            onRetry={() => setBattleKey((n) => n + 1)}
            onPractice={toReady}
            onForge={() => navigate(forgeHere)}
          />
        );
      case 'outro':
        return <NovelScene key="outro" script={lines.outro} cast={CAST} chapter={label} renderText={renderText} onFinish={finish} />;
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

export const MojiEpisodeScreen = () => {
  const { id = '' } = useParams<{ id: string }>();
  if (!getMojiEpisode(id) || !SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default MojiEpisodeScreen;
