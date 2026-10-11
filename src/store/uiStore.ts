import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * Screen-wide state that is not saved. `quiet` counts the screens that ask
 * for no popups just now — a fight while it is on, the gacha's summoning —
 * so a 称号 earned mid-fight waits for the result (AchievementToast).
 */
interface UiState {
  quiet: number;
  hush: () => void;
  unhush: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  quiet: 0,
  hush: () => set((s) => ({ quiet: s.quiet + 1 })),
  unhush: () => set((s) => ({ quiet: Math.max(0, s.quiet - 1) })),
}));

/** Hold popups while `active` (and while mounted). */
export const useQuiet = (active = true): void => {
  useEffect(() => {
    if (!active) return;
    const { hush, unhush } = useUiStore.getState();
    hush();
    return unhush;
  }, [active]);
};
