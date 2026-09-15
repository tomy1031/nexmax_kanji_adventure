import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStage } from '../../data/stages';
import { MUKASHI_CAST, MUKASHI_SCRIPTS } from '../../data/scripts/mukashi';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import BattleScene from '../battle/BattleScene';
import { RubyText } from '../../components/ui/Ruby';

/**
 * One stage, start to finish:
 *
 *   story  ->  write each new kanji ten times  ->  fight  ->  rewards
 *
 * The order matters. The story introduces the characters in context, the drill
 * earns them, and the fight is where having earned them pays off — so by the
 * time the opponent appears, every character on screen is one the learner has
 * already written ten times.
 */

type Phase = 'story' | 'drill' | 'battle' | 'done';

export const StagePlayer = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  const stage = stageId ? getStage(stageId) : undefined;
  const script = useMemo(() => MUKASHI_SCRIPTS.find((s) => s.stageId === stageId), [stageId]);

  const progress = useGameStore((s) => s.progress);
  const showFurigana = useGameStore((s) => s.settings.furigana);

  const [phase, setPhase] = useState<Phase>('story');
  const [drillIndex, setDrillIndex] = useState(0);

  const kanjiList = useMemo(() => {
    if (!stage) return [];
    return stage.kanji.map((c) => getKanjiByChar(c)).filter((k) => k != null);
  }, [stage]);

  // Warm every character in the stage so no drill ever waits on a fetch.
  useMemo(() => {
    if (kanjiList.length) void preloadCharData(kanjiList.map((k) => k.char));
  }, [kanjiList]);

  if (!stage) {
    return (
      <div className="g-stage flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="g-title">そのステージは ありません。</p>
        <button type="button" className="g-btn g-btn-primary" onClick={() => navigate('/map')}>
          マップへ もどる
        </button>
      </div>
    );
  }

  // Characters still short of ten reps. A replayed stage skips straight past
  // the drill for anything already earned.
  const remaining = kanjiList.filter((k) => (progress[k.id]?.reps ?? 0) < REPS_TO_OBTAIN);
  const current = remaining[drillIndex];

  const nextDrill = () => {
    if (drillIndex + 1 < remaining.length) setDrillIndex((i) => i + 1);
    else setPhase('battle');
  };

  if (phase === 'story') {
    if (!script) {
      setPhase(remaining.length ? 'drill' : 'battle');
      return null;
    }
    return (
      <NovelScene
        script={script}
        cast={MUKASHI_CAST}
        onFinish={() => setPhase(remaining.length ? 'drill' : 'battle')}
      />
    );
  }

  if (phase === 'drill') {
    if (!current) {
      setPhase('battle');
      return null;
    }
    return (
      <div className="g-stage">
        <div className="mx-auto max-w-md">
          <p className="pt-2 text-center text-xs" style={{ color: 'var(--ink-3)' }}>
            <RubyText showFurigana={showFurigana}>この ステージの 漢字(かんじ)</RubyText>{' '}
            <span className="tabular-nums">
              {drillIndex + 1} / {remaining.length}
            </span>
          </p>
        </div>
        <KanjiDrill key={current.id} kanji={current} onObtained={nextDrill} onExit={nextDrill} />
      </div>
    );
  }

  if (phase === 'battle') {
    return <BattleScene stage={stage} kanjiPool={kanjiList} onFinish={() => setPhase('done')} onFlee={() => navigate('/map')} />;
  }

  return null;
};

export default StagePlayer;
