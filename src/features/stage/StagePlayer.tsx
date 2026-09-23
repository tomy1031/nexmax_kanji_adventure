import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStage } from '../../data/stages';
import { MUKASHI_CAST, MUKASHI_SCRIPTS } from '../../data/scripts/mukashi';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { kanjiRuby } from '../../lib/reading';
import { useGameStore } from '../../store/gameStore';
import { REPS_TO_OBTAIN, type KanjiData } from '../../types/kanji';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import BattleScene from '../battle/BattleScene';
import EncounterScreen from './EncounterScreen';
import { RubyText } from '../../components/ui/Ruby';
import { NexmaxSays, TopBar } from '../../components/ui/Chrome';

/**
 * One stage, entered one of two ways (chosen on the stage select):
 *
 *   漢字(かんじ)れんしゅう   ?mode=practice
 *     the stage's kanji, each written on rocks until ten pieces are
 *     collected. No story, no fight.
 *
 *   ストーリー（バトル）   ?mode=story   (the default)
 *     the picture-book story -> the opponent appears -> the fight.
 *
 * Splitting them is the learner's call (2026-09-23): one sitting can be all
 * writing, another all story. The fight still runs on writing — it uses the
 * stage's kanji the learner already owns, and says so plainly when they own
 * too few, with a way to go and practise.
 */

type StoryPhase = 'story' | 'encounter' | 'battle';

const StageRun = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'practice' ? 'practice' : 'story';
  // Coming back from the forge resumes at the encounter rather than
  // replaying the story.
  const resumeAt = params.get('at') === 'encounter' ? 'encounter' : null;

  const stage = stageId ? getStage(stageId) : undefined;
  const script = useMemo(() => MUKASHI_SCRIPTS.find((s) => s.stageId === stageId), [stageId]);

  const progress = useGameStore((s) => s.progress);
  const showFurigana = useGameStore((s) => s.settings.furigana);

  const [phase, setPhase] = useState<StoryPhase>(resumeAt ?? 'story');
  const [practising, setPractising] = useState<KanjiData | null>(null);

  const kanjiList = useMemo(() => {
    if (!stage) return [];
    return stage.kanji.map((c) => getKanjiByChar(c)).filter((k) => k != null);
  }, [stage]);

  // Warm every character in the stage so no drill ever waits on a fetch.
  useEffect(() => {
    if (kanjiList.length) void preloadCharData(kanjiList.map((k) => k.char));
  }, [kanjiList]);

  if (!stage) {
    return (
      <div className="g-sky flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="g-title">そのステージは ありません。</p>
        <button type="button" className="g-btn g-btn-primary" onClick={() => navigate('/map/mukashi')}>
          マップへ もどる
        </button>
      </div>
    );
  }

  const backToSelect = () => navigate(`/map/mukashi?stage=${stage.id}`);
  const chapter = { label: `むかし編(へん) 1-${stage.order}`, title: stage.title };
  const owned = kanjiList.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN);

  // =========================================================================
  // 漢字れんしゅう
  // =========================================================================
  if (mode === 'practice') {
    if (practising) {
      return (
        <KanjiDrill
          key={practising.id}
          kanji={practising}
          onExit={() => setPractising(null)}
          onDone={() => setPractising(null)}
          nextLabel="ほかの 字(じ)を 書(か)く"
        />
      );
    }

    return (
      <div className="g-sky flex min-h-dvh flex-col items-center pb-8">
        <TopBar onBack={backToSelect} title={`1-${stage.order} ${stage.title}`} />
        <div className="flex w-full max-w-md flex-col gap-3 px-3 pt-4">
          <div className="flex items-end justify-between gap-1">
            <div className="g-parchment min-w-0 flex-1 px-4 py-3">
              <p className="text-lg font-black">
                <RubyText showFurigana={showFurigana}>漢字(かんじ)れんしゅう</RubyText>
              </p>
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  {`1(ひと)つ えらんで 書(か)こう。10回(かい) 書(か)くと 手(て)に 入(はい)る。いま ${owned.length} / ${kanjiList.length}`}
                </RubyText>
              </p>
            </div>
            <NexmaxSays text="どれから 書(か)く？" size={56} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {kanjiList.map((k, i) => {
              const reps = Math.min(REPS_TO_OBTAIN, progress[k.id]?.reps ?? 0);
              const have = reps >= REPS_TO_OBTAIN;
              return (
                <motion.button
                  key={k.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setPractising(k)}
                  className="g-parchment relative flex flex-col items-center px-2 pt-2 pb-2"
                  style={have ? { borderColor: '#4f9a3c', boxShadow: '0 0 0 2px #7ed36b inset, 0 6px 14px rgba(60,35,10,0.2)' } : undefined}
                >
                  {have && (
                    <span className="absolute top-1 right-1.5 text-sm" style={{ color: '#3e9b3a' }} aria-label="てに いれた">
                      ✔
                    </span>
                  )}
                  <span className="text-[38px] leading-[1.55] font-black">
                    <RubyText showFurigana={showFurigana}>{kanjiRuby(k)}</RubyText>
                  </span>
                  <span className="truncate text-[11px]" style={{ color: 'var(--ink-2)' }}>
                    {k.meanings[0]}
                  </span>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#e3d3ad]">
                    <div className="h-full rounded-full" style={{ width: `${(reps / REPS_TO_OBTAIN) * 100}%`, background: 'linear-gradient(90deg,#7ed36b,#3e9b3a)' }} />
                  </div>
                  <span className="mt-0.5 text-[11px] font-bold tabular-nums">
                    {reps}/{REPS_TO_OBTAIN}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <button
            type="button"
            className="g-btn g-btn-primary mt-2 w-full text-lg"
            onClick={() => navigate(`/stage/${stage.id}?mode=story`)}
          >
            <RubyText showFurigana={showFurigana}>ストーリー（バトル）へ</RubyText>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ストーリー（バトル）
  // =========================================================================

  // Round-trip to the forge and back to this stage's encounter.
  const forgeHref = `/forge?back=${encodeURIComponent(`/stage/${stage.id}?mode=story&at=encounter`)}`;
  // The fight uses what the learner owns from this stage; with nothing owned
  // yet it falls back to the whole list (and the encounter says so).
  const pool = owned.length ? owned : kanjiList;

  if (phase === 'story') {
    if (!script) {
      setPhase('encounter');
      return null;
    }
    return <NovelScene script={script} cast={MUKASHI_CAST} chapter={chapter} onFinish={() => setPhase('encounter')} />;
  }

  if (phase === 'encounter') {
    return (
      <EncounterScreen
        stage={stage}
        kanjiPool={pool}
        ownedCount={owned.length}
        totalCount={kanjiList.length}
        onFight={() => setPhase('battle')}
        onForge={() => navigate(forgeHref)}
        onPractice={() => navigate(`/stage/${stage.id}?mode=practice`)}
        onBack={backToSelect}
      />
    );
  }

  return <BattleScene stage={stage} kanjiPool={pool} onFinish={backToSelect} onFlee={() => setPhase('encounter')} />;
};

/**
 * Switching between れんしゅう and ストーリー stays on the same route, so the
 * run is keyed on the URL: each mode starts from its own beginning.
 */
export const StagePlayer = () => {
  const { pathname, search } = useLocation();
  return <StageRun key={pathname + search} />;
};

export default StagePlayer;
