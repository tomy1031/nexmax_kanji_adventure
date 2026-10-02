import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import NovelScene from '../novel/NovelScene';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { getKanaEpisode } from '../../data/kana';
import { afterEpisode } from '../../data/mojiFlow';
import { PhaseDoors } from '../../components/ui/Doors';
import { KANA_CAST, KANA_SCRIPTS } from '../../data/scripts/kana';
import KanaDrill from './KanaDrill';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';
import { revealKana } from '../../lib/kanaReveal';

/**
 * かな編 1話ぶん: お話 → その話の かなを 書く → お話 (08 §3.4)。部分の 切り替えは 扉の 向こう（PhaseDoors, 08 §3.8）。
 * The lines are drawn with KanaText, so the kana written in the middle of
 * the episode have already lost their romaji by the closing scene.
 */

type Phase = 'intro' | 'write' | 'outro';

/** The English lines are the player's own thoughts: their plate says わたし (I). */
const NARRATOR = 'わたし';

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

  // Nexmax can only say the letters that have come back; the rest are holes.
  const renderText = useCallback(
    (text: string) =>
      // A line of pictures only (🗣️ → 🐛 → 🪧) is how he talks before any letter
      // has come back, so it is drawn large enough to read as the message.
      /[A-Za-z\u3040-\u30ff]/.test(text) ? (
        <KanaText known={known} mode="mask">
          {text}
        </KanaText>
      ) : (
        <span className="text-[34px] leading-[1.5] tracking-wider">{text}</span>
      ),
    [known],
  );
  // Names and the Japanese of the English lines: readable, with romaji over
  // the kana not written yet (only Nexmax's own speech is eaten to holes).
  const renderPlain = useCallback((text: string) => <KanaText known={known}>{text}</KanaText>, [known]);
  // よみあげ: the Japanese lines, as far as they can be read. The English
  // lines are the player's own thoughts and are not read out.
  const speechFor = useCallback(
    (text: string) => {
      if (/[A-Za-z]/.test(text)) return null;
      const heard = revealKana(text, known)
        .filter((s) => s.romaji === undefined)
        .map((s) => s.text)
        .join('');
      return /[ぁ-ヶ]/.test(heard) ? heard : null;
    },
    [known],
  );
  const chapter = { label: `かな ${ep.order}`, title: ep.en };
  const leave = () => navigate(`/map/moji`);

  const finish = () => {
    clearStage(id);
    // 0章 runs on into 1章: after kana-10 comes the town's first episode (data/mojiFlow.ts).
    const next = afterEpisode(id);
    navigate(next ? `/map/moji?new=${next}` : '/map/moji');
  };
  // A replay with every kana here already written goes from the story straight on.
  const allKnown = ep.kana.every((k) => known.has(k));

  const view = (() => {
    switch (phase) {
      case 'intro':
        return (
          <NovelScene
            key="intro"
            script={lines.intro}
            cast={KANA_CAST}
            chapter={chapter}
            renderText={renderText}
            renderPlain={renderPlain}
            narrator={NARRATOR}
            look="night"
            speechFor={speechFor}
            onFinish={() => setPhase(allKnown ? 'outro' : 'write')}
          />
        );
      case 'write':
        return <KanaDrill kana={ep.kana} onDone={() => setPhase('outro')} onExit={leave} />;
      case 'outro':
        return (
          <NovelScene
            key="outro"
            script={lines.outro}
            cast={KANA_CAST}
            chapter={chapter}
            renderText={renderText}
            renderPlain={renderPlain}
            narrator={NARRATOR}
            look="night"
            speechFor={speechFor}
            onFinish={finish}
          />
        );
    }
  })();

  return <PhaseDoors phase={phase}>{view}</PhaseDoors>;
};

export const KanaEpisode = () => {
  const { id = '' } = useParams<{ id: string }>();
  if (!getKanaEpisode(id) || !KANA_SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default KanaEpisode;
