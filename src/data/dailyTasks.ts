import type { DailyState } from '../store/gameStore';

/**
 * Daily tasks.
 *
 * Every task is a *study* action, and none of them can be finished by
 * scribbling: a rep only counts when the character was written, and the
 * writing screen already refuses to count a rep with three or more slips. So
 * the fastest way to the gems is also the only way — actually writing.
 *
 * The day's full haul is 110 gems, a little over one pull. That is the pace:
 * one pull a day for someone who shows up, and nothing for someone who does
 * not.
 */

export interface DailyTask {
  id: string;
  /** Label in furigana notation. */
  label: string;
  /** How many are needed. */
  goal: number;
  reward: number;
  progress: (d: DailyState) => number;
}

export const DAILY_TASKS: DailyTask[] = [
  {
    id: 'write-10',
    label: '漢字(かんじ)を 10回(かい) 書(か)く',
    goal: 10,
    reward: 20,
    progress: (d) => d.repsToday,
  },
  {
    id: 'write-30',
    label: '漢字(かんじ)を 30回(かい) 書(か)く',
    goal: 30,
    reward: 30,
    progress: (d) => d.repsToday,
  },
  {
    id: 'obtain-1',
    label: '新(あたら)しい 漢字(かんじ)を 1(ひと)つ 手(て)に 入(い)れる',
    goal: 1,
    reward: 20,
    progress: (d) => d.obtainedToday,
  },
  {
    id: 'stage-1',
    label: 'ステージを 1(ひと)つ すすめる',
    goal: 1,
    reward: 20,
    progress: (d) => d.stagesToday,
  },
  {
    id: 'review-5',
    label: 'わすれかけた 漢字(かんじ)を 5(いつ)つ 復習(ふくしゅう)する',
    goal: 5,
    reward: 20,
    progress: (d) => d.reviewsToday,
  },
];

export const DAILY_TOTAL = DAILY_TASKS.reduce((n, t) => n + t.reward, 0);

export const isTaskComplete = (task: DailyTask, daily: DailyState): boolean =>
  task.progress(daily) >= task.goal;

export const isTaskClaimable = (task: DailyTask, daily: DailyState): boolean =>
  isTaskComplete(task, daily) && !daily.claimed.includes(task.id);
