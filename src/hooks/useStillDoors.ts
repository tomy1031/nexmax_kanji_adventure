import { useStill } from './useStill';

/** Reduced motion for the doors (components/ui/Doors.tsx): the system setting or the game's own (useStill). */
export const useStillDoors = (): boolean => useStill();
