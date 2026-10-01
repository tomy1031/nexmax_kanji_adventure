import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { episodesOf, getMojiEpisode, type MojiEpisode } from '../../data/mojiEpisodes';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { MOJI1_CAST, MOJI1_SCRIPTS } from '../../data/scripts/moji1';
import KanjiBackText from './KanjiBackText';
import { useOwnedKanji } from './useOwnedKanji';

/**
 * 文字が 消えた 町 — one episode (08 §4.2.1, §4.2.2):
 *
 *   お話 → write each kanji three times (★1) → じゅんび → たたかい → お話
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

type Phase = 'intro' | 'write' | 'ready' | 'practice' | 'battle' | 'outro';

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
}: {
  ep: MojiEpisode;
  kanji: KanjiData[];
  onPractice: (k: KanjiData) => void;
  onFight: () => void;
  onExit: () => void;
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
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#2a1840] text-[#c9a4ff]">
            <GameIcon name={ep.boss.icon} size={38} fallback="☠" />
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

        <p className="text-center text-xs font-black" style={{ color: 'var(--ink-2)' }}>
          <RubyText showFurigana={showFurigana}>{`★ ${total} / ${kanji.length * 3} ・ 字(じ)を タップすると もっと 書(か)ける`}</RubyText>
        </p>

        <motion.button
          type="button"
          className="g-btn g-btn-red mt-auto w-full text-xl"
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
  const ep = getMojiEpisode(id)!;
  const lines = SCRIPTS[id];
  const chapter = MOJI_CHAPTERS.find((c) => c.id === ep.chapter)!;
  const owned = useOwnedKanji();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const [kanji] = useState(() => ep.kanji.map((c) => getKanjiByChar(c)!));
  // The kanji still short of ★1, fixed on arrival.
  const [queue] = useState(() => {
    const progress = useGameStore.getState().progress;
    return kanji.filter((k) => (progress[k.id]?.reps ?? 0) < MOJI_OWN_REPS);
  });
  const [phase, setPhase] = useState<Phase>('intro');
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

  // The win records the clear (BattleScene); the story's end moves on.
  const finish = () => {
    const next = episodesOf(ep.chapter).find((e) => e.order === ep.order + 1);
    navigate(next ? `/map/moji?new=${next.id}` : '/map/moji');
  };

  switch (phase) {
    case 'intro':
      return (
        <NovelScene
          key="intro"
          script={lines.intro}
          cast={CAST}
          chapter={label}
          renderText={renderText}
          onFinish={() => setPhase(queue.length ? 'write' : 'ready')}
        />
      );
    case 'write': {
      const k = queue[idx];
      const nextKanji = () => (idx + 1 < queue.length ? setIdx(idx + 1) : toReady());
      return (
        <KanjiDrill
          key={k.id}
          kanji={k}
          goal={MOJI_OWN_REPS}
          look="sign"
          onExit={leave}
          onDone={nextKanji}
          nextLabel={idx + 1 < queue.length ? `つぎの 字(じ)（${idx + 2}/${queue.length}）` : 'じゅんびへ'}
        />
      );
    }
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
          onForge={() => navigate('/forge')}
        />
      );
    case 'outro':
      return <NovelScene key="outro" script={lines.outro} cast={CAST} chapter={label} renderText={renderText} onFinish={finish} />;
  }
};

export const MojiEpisodeScreen = () => {
  const { id = '' } = useParams<{ id: string }>();
  if (!getMojiEpisode(id) || !SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default MojiEpisodeScreen;
