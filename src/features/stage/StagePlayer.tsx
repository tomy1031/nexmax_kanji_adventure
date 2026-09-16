import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStage } from '../../data/stages';
import { MUKASHI_CAST, MUKASHI_SCRIPTS } from '../../data/scripts/mukashi';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import BattleScene from '../battle/BattleScene';
import EncounterScreen from './EncounterScreen';
import StageProgress from './StageProgress';
import { RubyText } from '../../components/ui/Ruby';

/**
 * One stage, start to finish:
 *
 *   story -> write each new kanji ten times -> "you have them all" ->
 *   the opponent appears -> fight
 *
 * The two screens between the phases exist because the first build cut
 * straight from story to drill and from drill to fight, and a player could
 * not tell why they were writing or when the fight had started. Each phase
 * now announces the next one, and the three-step header is on screen
 * throughout.
 */

type Phase = 'story' | 'drill' | 'collected' | 'encounter' | 'battle';

export const StagePlayer = () => {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  const [params] = useSearchParams();
  // Coming back from the forge resumes at the encounter rather than
  // replaying the story and the drill.
  const resumeAt = params.get('at') === 'encounter' ? 'encounter' : null;

  const stage = stageId ? getStage(stageId) : undefined;
  const script = useMemo(() => MUKASHI_SCRIPTS.find((s) => s.stageId === stageId), [stageId]);

  const progress = useGameStore((s) => s.progress);
  const showFurigana = useGameStore((s) => s.settings.furigana);

  const [phase, setPhase] = useState<Phase>(resumeAt ?? 'story');
  const [drillIndex, setDrillIndex] = useState(0);

  const kanjiList = useMemo(() => {
    if (!stage) return [];
    return stage.kanji.map((c) => getKanjiByChar(c)).filter((k) => k != null);
  }, [stage]);

  // Warm every character in the stage so no drill ever waits on a fetch.
  useEffect(() => {
    if (kanjiList.length) void preloadCharData(kanjiList.map((k) => k.char));
  }, [kanjiList]);

  // Characters still short of ten reps, fixed at mount: recomputing this from
  // live progress would make the list shrink underfoot as reps land.
  const [remaining] = useState(() =>
    (stage?.kanji ?? [])
      .map((c) => getKanjiByChar(c))
      .filter((k) => k != null)
      .filter((k) => (progress[k.id]?.reps ?? 0) < REPS_TO_OBTAIN),
  );

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

  // Round-trip to the forge and back to this stage's encounter.
  const forgeHref = `/forge?back=${encodeURIComponent(`/stage/${stage.id}?at=encounter`)}`;

  const current = remaining[drillIndex];

  const afterDrill = () => {
    if (drillIndex + 1 < remaining.length) setDrillIndex((i) => i + 1);
    else setPhase('collected');
  };

  // --- お話 ---------------------------------------------------------------
  if (phase === 'story') {
    if (!script) {
      setPhase(remaining.length ? 'drill' : 'encounter');
      return null;
    }
    return (
      <NovelScene
        script={script}
        cast={MUKASHI_CAST}
        onFinish={() => setPhase(remaining.length ? 'drill' : 'encounter')}
      />
    );
  }

  // --- 書取り -------------------------------------------------------------
  if (phase === 'drill') {
    if (!current) {
      setPhase('collected');
      return null;
    }
    return (
      <div className="g-stage min-h-dvh">
        <StageProgress current="drill" detail={`${drillIndex + 1} / ${remaining.length}`} />
        <KanjiDrill key={current.id} kanji={current} onObtained={afterDrill} onExit={afterDrill} />
      </div>
    );
  }

  // --- 集まった -----------------------------------------------------------
  if (phase === 'collected') {
    return (
      <div className="g-stage flex min-h-dvh flex-col">
        <StageProgress current="drill" detail="おわり" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="g-panel-solid w-full p-6"
          >
            <p className="g-eyebrow">
              <RubyText showFurigana={showFurigana}>漢字(かんじ)が そろった</RubyText>
            </p>
            <div className="my-4 flex flex-wrap justify-center gap-1.5">
              {kanjiList.map((kj) => (
                <span key={kj.id} className="g-chip g-chip-gold !px-2.5 !py-1 text-xl font-black">
                  {kj.char}
                </span>
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                この 漢字(かんじ)を 2(ふた)つ あわせると 武器(ぶき)に なります。
              </RubyText>
            </p>
          </motion.div>

          <div className="flex w-full flex-col gap-2">
            <button type="button" className="g-btn g-btn-primary w-full text-lg" onClick={() => navigate(forgeHref)}>
              <RubyText showFurigana={showFurigana}>武器(ぶき)を 作(つく)る</RubyText>
            </button>
            <button type="button" className="g-btn g-btn-ghost w-full" onClick={() => setPhase('encounter')}>
              <RubyText showFurigana={showFurigana}>あとで 作(つく)る。先(さき)へ 進(すす)む</RubyText>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 遭遇 ---------------------------------------------------------------
  if (phase === 'encounter') {
    return (
      <div className="g-stage min-h-dvh">
        <StageProgress current="battle" />
        <EncounterScreen
          stage={stage}
          kanjiPool={kanjiList}
          onFight={() => setPhase('battle')}
          onForge={() => navigate(forgeHref)}
          onBack={() => navigate('/map')}
        />
      </div>
    );
  }

  // --- 戦闘 ---------------------------------------------------------------
  return (
    <BattleScene
      stage={stage}
      kanjiPool={kanjiList}
      onFinish={() => navigate('/map')}
      onFlee={() => setPhase('encounter')}
    />
  );
};

export default StagePlayer;
