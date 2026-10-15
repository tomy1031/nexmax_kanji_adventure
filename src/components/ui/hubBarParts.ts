import { MULTI_COST, PULL_COST, STEP_UP } from '../../lib/gacha';
import { todayKey, useGameStore } from '../../store/gameStore';

/** The bottom bar's helpers (HubBar.tsx), apart so the bar's file only exports components. */

/** What the gacha slot says in red: the reason to drop by now, or nothing. */
export const useGachaCall = (): string | null => {
  const gems = useGameStore((s) => s.gems);
  const tickets = useGameStore((s) => s.gachaTickets);
  const freeToday = useGameStore((s) => s.freePullDay) !== todayKey();
  const stepUp = useGameStore((s) => s.stepUp ?? 0) % STEP_UP.length;
  if (tickets > 0) return `🎫${tickets}`;
  if (freeToday) return 'むりょう';
  if (STEP_UP[stepUp].five && gems >= MULTI_COST) return '★5';
  if (gems >= PULL_COST) return 'できます';
  return null;
};

/** The room a screen leaves under its content for the bar. */
export const HUB_BAR_H = 'calc(76px + env(safe-area-inset-bottom))';

