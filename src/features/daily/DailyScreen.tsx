import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { DAILY_TASKS, DAILY_TOTAL, isTaskClaimable, isTaskComplete } from '../../data/dailyTasks';
import { RubyText } from '../../components/ui/Ruby';
import { getDueKanjiIds } from '../../lib/srs';
import { getKanjiById } from '../../lib/kanjiDb';

/** Today's tasks, and the review queue that feeds one of them. */
export const DailyScreen = () => {
  const navigate = useNavigate();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const daily = useGameStore((s) => s.daily);
  const streak = useGameStore((s) => s.streak);
  const gems = useGameStore((s) => s.gems);
  const progress = useGameStore((s) => s.progress);
  const claimDailyTask = useGameStore((s) => s.claimDailyTask);

  const due = getDueKanjiIds(progress)
    .map((id) => getKanjiById(id))
    .filter((k) => k != null);

  const earned = DAILY_TASKS.filter((t) => daily.claimed.includes(t.id)).reduce((n, t) => n + t.reward, 0);

  return (
    <div className="g-stage min-h-dvh pb-8">
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 backdrop-blur-md"
        style={{ background: 'var(--panel)' }}
      >
        <button type="button" className="g-btn g-btn-ghost !min-h-[40px] !px-4 text-sm" onClick={() => navigate('/map')}>
          もどる
        </button>
        <h1 className="g-title text-base">
          <RubyText showFurigana={showFurigana}>毎日(まいにち)の やること</RubyText>
        </h1>
        <span className="g-chip g-chip-gold text-xs tabular-nums">◆ {gems}</span>
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="g-panel mb-3 flex items-center justify-between p-4">
          <div>
            <p className="g-eyebrow">
              <RubyText showFurigana={showFurigana}>つづけて いる 日(ひ)</RubyText>
            </p>
            <p className="g-title text-2xl tabular-nums">{streak.count}</p>
          </div>
          <div className="text-right">
            <p className="g-eyebrow">
              <RubyText showFurigana={showFurigana}>今日(きょう) もらった</RubyText>
            </p>
            <p className="g-title text-2xl tabular-nums">
              {earned}
              <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
                {' '}
                / {DAILY_TOTAL}
              </span>
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {DAILY_TASKS.map((task) => {
            const value = Math.min(task.progress(daily), task.goal);
            const complete = isTaskComplete(task, daily);
            const claimable = isTaskClaimable(task, daily);
            const claimed = daily.claimed.includes(task.id);

            return (
              <li key={task.id} className="g-panel p-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <RubyText showFurigana={showFurigana}>{task.label}</RubyText>
                    </p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${(value / task.goal) * 100}%`,
                          background: complete ? 'var(--color-success)' : 'var(--accent)',
                        }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: 'var(--ink-2)' }}>
                      {value} / {task.goal}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="g-btn g-btn-primary !min-h-[42px] shrink-0 !px-4 text-sm"
                    disabled={!claimable}
                    onClick={() => claimDailyTask(task.id, task.reward)}
                  >
                    {claimed ? '✓' : `◆${task.reward}`}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {/* 復習 --------------------------------------------------------- */}
        <div className="g-panel mt-4 p-4">
          <p className="g-eyebrow mb-1">
            <RubyText showFurigana={showFurigana}>復習(ふくしゅう)</RubyText>
          </p>
          {due.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
              <RubyText showFurigana={showFurigana}>
                いま 復習(ふくしゅう)する 漢字(かんじ)は ありません。
              </RubyText>
            </p>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
                <RubyText showFurigana={showFurigana}>
                  {`わすれかけて いる 漢字(かんじ)が ${due.length} あります。`}
                </RubyText>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {due.slice(0, 20).map((k) => (
                  <span key={k.id} className="g-chip !px-2.5 !py-1 text-lg font-black">
                    {k.char}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                <RubyText showFurigana={showFurigana}>
                  ステージで たたかうと、その 漢字(かんじ)の 復習(ふくしゅう)に なります。
                </RubyText>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyScreen;
