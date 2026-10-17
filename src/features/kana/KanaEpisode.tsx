import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import NovelScene from '../novel/NovelScene';
import { preloadCharData } from '../../lib/strokeLoader';
import { useGameStore } from '../../store/gameStore';
import { getKanaEpisode } from '../../data/kana';
import { afterEpisode } from '../../data/mojiFlow';
import { PhaseDoors } from '../../components/ui/Doors';
import { KANA_SCRIPTS, kanaBossCast, kanaCast } from '../../data/scripts/kana';
import KanaDrill from './KanaDrill';
import KanaText from './KanaText';
import { useKnownKana } from './useKnownKana';
import { revealKana } from '../../lib/kanaReveal';
import { KANA_ENCOUNTERS, KANA_BOSS_SCRIPTS } from '../../data/scripts/kanaFights';
import { bossFight, episodeFight, getKanaBoss, type KanaBoss } from '../../data/kanaBattle';
import { NANIWA_NEXMAX_STAR1, NANIWA_NEXMAX_STAR2 } from '../../data/scripts/naniwaCast';
import { SCENES } from '../picturebook/scenes';
import { EvolveScene } from '../../components/ui/EvolveScene';
import { useStill } from '../../hooks/useStill';
import KanaBattle from './KanaBattle';
import { getKanaWeapon } from '../../data/kanaWeapons';

/**
 * かな編 1話ぶん: お話 → その話の かなを 書く → 出会い → たたかい「きいて かく」→ お話
 * (08 §3.4, docs/design/22 §4)。部分の 切り替えは 扉の 向こう（PhaseDoors, 08 §3.8）。
 * The lines are drawn with KanaText, so the kana written in the middle of
 * the episode have already lost their romaji by the closing scene.
 */

type Phase = 'intro' | 'write' | 'encounter' | 'battle' | 'outro';

/** The English lines are the player's own thoughts: their plate says わたし (I). */
const NARRATOR = 'わたし';

/** How 0章 draws its lines: Nexmax's holes, romaji over the rest, and what is read aloud. */
const useKanaText = () => {
  const known = useKnownKana();
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
  return { known, renderText, renderPlain, speechFor };
};

const EpisodePlayer = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const ep = getKanaEpisode(id)!;
  const lines = KANA_SCRIPTS[id];
  const { known, renderText, renderPlain, speechFor } = useKanaText();
  const clearStage = useGameStore((s) => s.clearStage);
  const [phase, setPhase] = useState<Phase>('intro');
  // ★1 through the hiragana, ★2 through the katakana (naniwaCast.ts).
  const cast = kanaCast(ep.script);
  const encounter = KANA_ENCOUNTERS[id];
  // かなの ぶき: carried into 0章の たたかい only (docs/design/22 §5).
  const weapon = getKanaWeapon(useGameStore((s) => s.equippedKanaWeapon)) ?? null;

  useEffect(() => {
    void preloadCharData(ep.kana);
  }, [ep]);
  const chapter = { label: `かな ${ep.order}`, title: ep.en };
  const leave = () => navigate(`/map/moji`);

  const finish = () => {
    clearStage(id);
    // 0章 runs on into 1章: after kana-10 comes the town's first episode (data/mojiFlow.ts);
    // after kana-5 and kana-10, the script's boss first, until it is beaten.
    const next = afterEpisode(id, useGameStore.getState().clearedStages);
    // かさ can be written after かな 2話: the first visit to かなの かじや (docs/design/22 §5), then on.
    if (id === 'kana-2' && !useGameStore.getState().tutorials.kanaForge) {
      navigate(`/kana-forge?first=1${next ? `&next=${next}` : ''}`);
      return;
    }
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
            bgm="sad"
            holdLetters={ep.kana}
            script={lines.intro}
            cast={cast}
            chapter={chapter}
            renderText={renderText}
            renderPlain={renderPlain}
            narrator={NARRATOR}
            look="night"
            speechFor={speechFor}
            onFinish={() => setPhase(allKnown ? 'encounter' : 'write')}
          />
        );
      case 'write':
        // The drill happens in the town the story opened in.
        return <KanaDrill kana={ep.kana} scene={lines.intro.lines[0].bg} onDone={() => setPhase('encounter')} onExit={leave} />;
      case 'encounter':
        // The letters just lit draw one of the shadow's little ones (kanaFights.ts).
        return encounter ? (
          <NovelScene
            key="encounter"
            bgm="tension"
            script={{ ...encounter, lines: [{ ...encounter.lines[0], bg: encounter.lines[0].bg ?? lines.intro.lines[0].bg }, ...encounter.lines.slice(1)] }}
            cast={cast}
            chapter={chapter}
            renderText={renderText}
            renderPlain={renderPlain}
            narrator={NARRATOR}
            look="night"
            speechFor={speechFor}
            onFinish={() => setPhase('battle')}
          />
        ) : (
          <KanaBattle key="battle" fight={episodeFight(id)} script={ep.script} field={lines.intro.lines[0].bg ?? ''} weapon={weapon} onWin={() => setPhase('outro')} onFlee={leave} />
        );
      case 'battle':
        return <KanaBattle key="battle" fight={episodeFight(id)} script={ep.script} field={lines.intro.lines[0].bg ?? ''} weapon={weapon} onWin={() => setPhase('outro')} onFlee={leave} />;
      case 'outro':
        return (
          <NovelScene
            key="outro"
            script={lines.outro}
            cast={cast}
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

type BossPhase = 'intro' | 'battle' | 'evolve' | 'outro';

/**
 * 0章の ボス (docs/design/22 §4.2): お話 → たたかい（46字 ぜんぶ）→ お話. The
 * hiragana boss's first win grows Nexmax from ★1 into ★2 (EvolveScene).
 */
const BossPlayer = ({ boss }: { boss: KanaBoss }) => {
  const navigate = useNavigate();
  const { renderText, renderPlain, speechFor } = useKanaText();
  const clearStage = useGameStore((s) => s.clearStage);
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const still = useStill();
  const [phase, setPhase] = useState<BossPhase>('intro');
  const lines = KANA_BOSS_SCRIPTS[boss.id];
  const [fight] = useState(() => bossFight(boss));
  const weapon = getKanaWeapon(useGameStore((s) => s.equippedKanaWeapon)) ?? null;
  // ★1 → ★2 only the first time the hiragana boss falls.
  const [firstWin] = useState(() => !useGameStore.getState().clearedStages.includes(boss.id));
  useEffect(() => {
    void preloadCharData(fight.seals);
  }, [fight]);
  const chapter = { label: boss.script === 'hiragana' ? 'ひらがな 👑' : 'カタカナ 👑', title: boss.en };
  const leave = () => navigate('/map/moji');
  const finish = () => {
    clearStage(boss.id);
    const next = afterEpisode(boss.id, useGameStore.getState().clearedStages);
    navigate(next ? `/map/moji?new=${next}` : '/map/moji');
  };
  // ★1 before the hiragana boss, ★2 once it has fallen (kanaBossCast).
  const novel = (key: 'intro' | 'outro', script: typeof lines.intro, onFinish: () => void) => (
    <NovelScene
      key={key}
      bgm={key === 'intro' ? 'tension' : undefined}
      script={script}
      cast={kanaBossCast(boss.script, key)}
      chapter={chapter}
      renderText={renderText}
      renderPlain={renderPlain}
      narrator={NARRATOR}
      look="night"
      speechFor={speechFor}
      onFinish={onFinish}
    />
  );
  const view = (() => {
    switch (phase) {
      case 'intro':
        return novel('intro', lines.intro, () => setPhase('battle'));
      case 'battle':
        return <KanaBattle key="battle" fight={fight} script={boss.script} field={boss.bg} weapon={weapon} onWin={() => setPhase(lines.evolve && firstWin ? 'evolve' : 'outro')} onFlee={leave} />;
      case 'evolve':
        return (
          <EvolveScene
            key="evolve"
            from={NANIWA_NEXMAX_STAR1.sprites.normal}
            to={NANIWA_NEXMAX_STAR2.sprites.smile}
            stars={2}
            title="★2 しんか！"
            backdrop={SCENES[boss.bg]?.photo}
            lines={lines.evolve ?? []}
            renderText={renderText}
            showFurigana={showFurigana}
            still={still}
            onDone={() => setPhase('outro')}
          />
        );
      case 'outro':
        return novel('outro', lines.outro, finish);
    }
  })();
  return <PhaseDoors phase={phase}>{view}</PhaseDoors>;
};

export const KanaEpisode = () => {
  const { id = '' } = useParams<{ id: string }>();
  const boss = getKanaBoss(id);
  if (boss && KANA_BOSS_SCRIPTS[id]) return <BossPlayer key={id} boss={boss} />;
  if (!getKanaEpisode(id) || !KANA_SCRIPTS[id]) return <Navigate to="/map/moji" replace />;
  return <EpisodePlayer key={id} id={id} />;
};

export default KanaEpisode;
