import { RubyText } from '../../components/ui/Ruby';
import { useGameStore } from '../../store/gameStore';

/**
 * The three steps of a stage, always on screen.
 *
 * Without this the game simply cuts from the story into a writing drill and
 * later into a fight, and the learner has no idea what is coming or how much
 * is left. Showing the whole shape up front is the difference between "why am
 * I writing this" and "I am collecting these so I can fight with them".
 */

export type StageStep = 'story' | 'drill' | 'battle';

const STEPS: { id: StageStep; label: string }[] = [
  { id: 'story', label: 'お話(はなし)' },
  { id: 'drill', label: '漢字(かんじ)を おぼえる' },
  { id: 'battle', label: 'たたかう' },
];

interface StageProgressProps {
  current: StageStep;
  /** Shown next to the drill step, e.g. "3 / 9". */
  detail?: string;
}

export const StageProgress = ({ current, detail }: StageProgressProps) => {
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="mx-auto flex w-full max-w-md items-stretch gap-1 px-4 pt-2 text-[11px]">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className="flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5"
            style={{
              background: active ? 'var(--accent)' : done ? 'var(--panel-solid)' : 'transparent',
              color: active ? '#fff' : done ? 'var(--ink-2)' : 'var(--ink-3)',
              border: `1px solid ${active ? 'transparent' : 'var(--line)'}`,
            }}
          >
            {/* Number, or a tick once the step is behind us — never colour alone. */}
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
              style={{
                background: active ? 'rgba(255,255,255,0.28)' : 'var(--line)',
                color: active ? '#fff' : 'var(--ink-2)',
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            <span className="min-w-0 truncate font-bold">
              <RubyText showFurigana={showFurigana && active}>{step.label}</RubyText>
            </span>
            {active && detail && <span className="ml-auto shrink-0 tabular-nums">{detail}</span>}
          </li>
        );
      })}
    </ol>
  );
};

export default StageProgress;
