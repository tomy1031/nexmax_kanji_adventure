import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import NovelScene from '../novel/NovelScene';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { KANA_EPISODES, getKanaEpisode } from '../../data/kana';
import { KANA_CAST, KANA_CAST_NAMELESS, KANA_SCRIPTS } from '../../data/scripts/kana';
import KanaDrill from './KanaDrill';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';

/**
 * かな編 1話ぶん: お話 → その話の かなを 書く → お話 (08 §3.4).
 * The lines are drawn with KanaText, so the kana written in the middle of
 * the episode have already lost their romaji by the closing scene.
 */

type Phase = 'intro' | 'write' | 'outro';

const EpisodePlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const ep = getKanaEpisode(id)!;
  const lines = KANA_SCRIPTS[id];
  const known = useKnownKana();
  const clearStage = useGameStore((s) => s.clearStage);
  const [phase, setPhase] = useState<Phase>('intro');

  useEffect(() => {
    void preloadCharData(ep.kana);
  }, [ep]);

  const renderText = useCallback((text: string) => <KanaText known={known}>{text}</KanaText>, [known]);
  const chapter = { label: `かな ${ep.order}`, title: ep.title };
  // Nexmax gets his name back at the end of kana-9; until then he is ロボット.
  const namedFrom = (p: Phase) => ep.order > 9 || (ep.order === 9 && p === 'outro');
  const castFor = (p: Phase) => (namedFrom(p) ? KANA_CAST : KANA_CAST_NAMELESS);
  const leave = () => navigate(`/map/moji`);

  const finish = () => {
    clearStage(id);
    const next = KANA_EPISODES.find((e) => e.order === ep.order + 1);
    navigate(next ? `/map/moji?new=${next.id}` : '/map/moji?new=moji-1');
  };

  switch (phase) {
    case 'intro':
      return (
        <NovelScene
          key="intro"
          script={lines.intro}
          cast={castFor('intro')}
          chapter={chapter}
          renderText={renderText}
          onFinish={() => setPhase('write')}
        />
      );
    case 'write':
      return <KanaDrill kana={ep.kana} onDone={() => setPhase('outro')} onExit={leave} />;
    case 'outro':
      return (
        <NovelScene key="outro" script={lines.outro} cast={castFor('outro')} chapter={chapter} renderText={renderText} onFinish={finish} />
      );
  }
};

export const KanaEpisode = () => {
  const { id = '' } = useParams<{ id: string }>();
  if (!getKanaEpisode(id) || !KANA_SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default KanaEpisode;
