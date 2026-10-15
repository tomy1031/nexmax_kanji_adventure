/**
 * Which features the player has already tapped once (their NEW mark and glow
 * stop then). This device only — a NEW that comes back on another phone is
 * harmless. Shared by the hub and the bottom bar (components/ui/HubBar).
 */
const SEEN_KEY = 'nexmax-features-opened';

export const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
};

export const markSeen = (feature: string) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), feature])]));
  } catch {
    // Private mode or blocked storage: the NEW mark simply stays.
  }
};
