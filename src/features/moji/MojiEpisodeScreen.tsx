import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import { RubyText } from '../../components/ui/Ruby';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { REPS_TO_OBTAIN } from '../../types/kanji';
import { episodesOf, getMojiEpisode } from '../../data/mojiEpisodes';
import { MOJI_CHAPTERS } from '../../data/mojiRoute';
import { MOJI1_CAST, MOJI1_SCRIPTS } from '../../data/scripts/moji1';
import KanjiBackText from './KanjiBackText';
import { useOwnedKanji } from './useOwnedKanji';

/**
 * 文字が 消えた 町 — one episode: お話 → write its kanji, one after another,
 * ten times each → お話 (08 §4.2.1). The closing scene is drawn with the
 * kanji just written back in place (KanjiBackText).
 */

type Phase = 'intro' | 'write' | 'outro';

const SCRIPTS = MOJI1_SCRIPTS;
const CAST = MOJI1_CAST;

const EpisodePlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const ep = getMojiEpisode(id)!;
  const lines = SCRIPTS[id];
  const chapter = MOJI_CHAPTERS.find((c) => c.id === ep.chapter)!;
  const owned = useOwnedKanji();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const clearStage = useGameStore((s) => s.clearStage);
  const progress = useGameStore((s) => s.progress);
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    void preloadCharData(ep.kanji);
  }, [ep]);

  const renderText = useCallback((text: string) => <KanjiBackText owned={owned}>{text}</KanjiBackText>, [owned]);
  const label = { label: `${chapter.order}章(しょう) ${ep.order}`, title: ep.title };
  const leave = () => navigate('/map/moji');

  const finish = () => {
    clearStage(id);
    const next = episodesOf(ep.chapter).find((e) => e.order === ep.order + 1);
    navigate(next ? `/map/moji?new=${next.id}` : '/map/moji');
  };

  switch (phase) {
    case 'intro':
      return <NovelScene key="intro" script={lines.intro} cast={CAST} chapter={label} renderText={renderText} onFinish={() => setPhase('write')} />;
    case 'write': {
      const kanji = getKanjiByChar(ep.kanji[idx])!;
      const nextKanji = () => (idx + 1 < ep.kanji.length ? setIdx(idx + 1) : setPhase('outro'));
      const ownedAlready = (progress[kanji.id]?.reps ?? 0) >= REPS_TO_OBTAIN;
      return (
        <KanjiDrill
          key={kanji.id}
          kanji={kanji}
          onExit={leave}
          onDone={nextKanji}
          nextLabel={idx + 1 < ep.kanji.length ? `つぎの 字(じ)（${idx + 2}/${ep.kanji.length}）` : 'つぎへ'}
          extra={
            ownedAlready ? (
              <button type="button" className="g-btn g-btn-accent w-full" onClick={nextKanji}>
                <RubyText showFurigana={showFurigana}>もう 持(も)っている。先(さき)へ すすむ</RubyText>
              </button>
            ) : null
          }
        />
      );
    }
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
