import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RubyText } from './Ruby';
import { GameIcon } from './GameIcon';
import { useGameStore } from '../../store/gameStore';
import { ALL_KANJI } from '../../data/kanji.generated';
import { gearInView, nextGearHint } from '../../data/equipment';
import { charRuby } from '../../lib/reading';
import { REPS_TO_OBTAIN } from '../../types/kanji';

/**
 * つぎの そうび — the one hint that teaches "a new character is new strength"
 * (docs/design/07 §1). It names the next piece of gear and the characters it
 * still needs, framed in gold; once they are owned it says so and links to
 * the equipment screen.
 *
 * After three pieces are made the learner has the idea, and the card shrinks
 * to one line.
 */
export const GearHint = ({ stageId }: { stageId: string }) => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const cleared = useGameStore((s) => s.clearedStages);
  const gear = useGameStore((s) => s.gear);
  const progress = useGameStore((s) => s.progress);

  const hint = useMemo(() => {
    const owned = new Set(
      ALL_KANJI.filter((k) => (progress[k.id]?.reps ?? 0) >= REPS_TO_OBTAIN).map((k) => k.char),
    );
    const reached = new Set([...cleared, stageId]);
    return nextGearHint(gearInView(reached), gear, owned);
  }, [cleared, stageId, gear, progress]);

  if (!hint) return null;
  const ready = hint.missing.length === 0;
  const compact = gear.length >= 3;

  return (
    <button
      type="button"
      onClick={() => navigate('/equip')}
      className="flex w-full items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left"
      style={{
        background: ready ? 'rgba(126,211,107,0.22)' : 'rgba(255,207,74,0.2)',
        borderColor: ready ? '#4f9a3c' : '#f2b53a',
      }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80" style={{ color: '#7a4a26' }}>
        <GameIcon name={hint.item.icon} size={24} />
      </span>
      <span className="min-w-0 flex-1 text-[11px] leading-[1.8] font-bold">
        {!compact && (
          <span className="block text-[10px]" style={{ color: 'var(--ink-3)' }}>
            <RubyText showFurigana={showFurigana}>ヒント：新(あたら)しい 字(じ)で 強(つよ)く なれる</RubyText>
          </span>
        )}
        <RubyText showFurigana={showFurigana}>
          {ready
            ? `「${hint.item.name}」が 作(つく)れる！`
            : `${hint.missing.map((c) => `「${charRuby(c)}」`).join('')}を 手(て)に 入(い)れると「${hint.item.name}」が 作(つく)れる`}
        </RubyText>
      </span>
      <span className="shrink-0 text-lg" aria-hidden>
        {ready ? '▶' : '🔒'}
      </span>
    </button>
  );
};

export default GearHint;
