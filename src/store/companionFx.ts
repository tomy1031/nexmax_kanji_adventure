import { create } from 'zustand';

/**
 * 「いっしょに 行きます！」 — the moment a companion is taken along
 * (features/companion/JoinCutIn, mounted once in App). Any screen that sets
 * the active companion — じゅんび, もちもの, ガチャの けっか, ずかん — calls
 * `takeAlong`, so choosing always looks and sounds the same (2026-10-15
 * 「どの仲間を使っているか分かりやすく（当たった時の特別感の演出含めて）」).
 */
interface CompanionFxState {
  /** `fight`: the short version at the start of a fight (「いっしょに たたかいます！」). */
  join: { id: string; n: number; fight?: boolean } | null;
  showJoin: (id: string, fight?: boolean) => void;
  clearJoin: () => void;
}

export const useCompanionFx = create<CompanionFxState>()((set) => ({
  join: null,
  showJoin: (id, fight) => set({ join: { id, n: Date.now(), fight } }),
  clearJoin: () => set({ join: null }),
}));
