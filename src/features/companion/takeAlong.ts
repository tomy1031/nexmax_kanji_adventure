import { useGameStore } from '../../store/gameStore';
import { useCompanionFx } from '../../store/companionFx';

/** Take a companion along: the save, then its entrance (JoinCutIn). Already along: nothing to show. */
export const takeAlong = (id: string): void => {
  const s = useGameStore.getState();
  if (!s.individuals.includes(id) || s.activeIndividual === id) return;
  s.setActiveIndividual(id);
  useCompanionFx.getState().showJoin(id);
};
