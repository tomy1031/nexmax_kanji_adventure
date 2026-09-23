import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { getKanjiByChar } from '../../lib/kanjiDb';
import { preloadCharData } from '../../lib/strokeLoader';
import { RubyText } from '../../components/ui/Ruby';
import { Element } from '../../lib/forge/elements';
import NovelScene from '../novel/NovelScene';
import KanjiDrill from '../write/KanjiDrill';
import BattleScene from '../battle/BattleScene';
import BladeForge from './BladeForge';
import {
  TUTORIAL_AFTER_DRILL,
  TUTORIAL_BEFORE_BATTLE,
  TUTORIAL_CAST,
  TUTORIAL_CHAPTER,
  TUTORIAL_FOE,
  TUTORIAL_INTRO,
  TUTORIAL_OUTRO,
} from '../../data/scripts/tutorial';

/**
 * 0話 — はじめの一歩.
 *
 *   お話 → 「一」で 石を 10回 割る（一を 手に入れる）→ お話 →
 *   一(いち)の 太刀(たち)を 作る → お話（カラスが 来る）→ 戦う → お話 → 1話へ
 *
 * Each new thing is done once, right there, before the next one is named:
 * writing cuts stone; a character you own becomes a blade; writing is how
 * you fight. See docs/design/06_チュートリアルの理解設計.md §8.
 */

const CHAR = '一';

type Phase = 'intro' | 'write' | 'afterDrill' | 'forge' | 'beforeBattle' | 'battle' | 'outro';

export const TutorialStage = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const markSeen = useGameStore((s) => s.markTutorialSeen);
  const clearedStage1 = useGameStore((s) => s.clearedStages.includes('mukashi-1'));

  const kanji = getKanjiByChar(CHAR);
  const owned = useGameStore((s) => (kanji ? s.hasKanji(kanji.id) : false));
  // A replay with 一 already owned can walk on without ten more rocks.
  const [ownedAtStart] = useState(owned);

  const [phase, setPhase] = useState<Phase>('intro');

  useEffect(() => {
    void preloadCharData([CHAR]);
  }, []);

  if (!kanji) return null;

  const finish = () => {
    markSeen('intro');
    // First time through, 0話 hands straight over to 1話. A player replaying
    // it from the map has somewhere else to be, so send them back there.
    navigate(clearedStage1 ? '/map/mukashi' : '/stage/mukashi-1?mode=story');
  };

  const leave = () => navigate('/map/mukashi');

  switch (phase) {
    case 'intro':
      return <NovelScene script={TUTORIAL_INTRO} cast={TUTORIAL_CAST} chapter={TUTORIAL_CHAPTER} onFinish={() => setPhase('write')} />;

    case 'write':
      return (
        <KanjiDrill
          kanji={kanji}
          onExit={leave}
          onDone={() => setPhase('afterDrill')}
          extra={
            ownedAtStart ? (
              <button type="button" className="g-btn g-btn-accent w-full" onClick={() => setPhase('afterDrill')}>
                <RubyText showFurigana={showFurigana}>もう 持(も)っている。先(さき)へ すすむ</RubyText>
              </button>
            ) : null
          }
        />
      );

    case 'afterDrill':
      return <NovelScene script={TUTORIAL_AFTER_DRILL} cast={TUTORIAL_CAST} chapter={TUTORIAL_CHAPTER} onFinish={() => setPhase('forge')} />;

    case 'forge':
      return <BladeForge kanji={kanji} onDone={() => setPhase('beforeBattle')} />;

    case 'beforeBattle':
      return (
        <NovelScene script={TUTORIAL_BEFORE_BATTLE} cast={TUTORIAL_CAST} chapter={TUTORIAL_CHAPTER} onFinish={() => setPhase('battle')} />
      );

    case 'battle':
      return (
        <BattleScene
          mode="tutorial"
          stage={{
            id: 'tutorial',
            bg: 'mukashi_village',
            reward: 0,
            boss: { ...TUTORIAL_FOE, element: Element.MU },
          }}
          kanjiPool={[kanji]}
          onFinish={() => setPhase('outro')}
          onFlee={leave}
        />
      );

    case 'outro':
      return <NovelScene script={TUTORIAL_OUTRO} cast={TUTORIAL_CAST} chapter={TUTORIAL_CHAPTER} onFinish={finish} />;
  }
};

export default TutorialStage;
