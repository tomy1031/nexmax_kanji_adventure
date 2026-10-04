import type { CastMember } from '../types/novel';
import { MOJI1_CAST, MOJI1_SCRIPTS, type EpisodeScript } from './scripts/moji1';
import { MOJI2_CAST, MOJI2_SCRIPTS } from './scripts/moji2';
import { MOJI3_CAST, MOJI3_SCRIPTS } from './scripts/moji3';
import { MOJI4_CAST, MOJI4_SCRIPTS } from './scripts/moji4';

/**
 * 新ルートの 台本 — every chapter's episode scripts and everyone who appears,
 * in one place, so the episode screen and the art preloader read any chapter
 * (docs/design/12 §5). A chapter's own file (scripts/moji1.ts, …) keeps its
 * scripts; this only joins them.
 */
export const MOJI_SCRIPTS: Readonly<Record<string, EpisodeScript>> = { ...MOJI1_SCRIPTS, ...MOJI2_SCRIPTS, ...MOJI3_SCRIPTS, ...MOJI4_SCRIPTS };

/** One cast for the route: the same id is the same person in every chapter, so each appears once. */
const joinCast = (...casts: CastMember[][]): CastMember[] => {
  const byId = new Map<string, CastMember>();
  for (const cast of casts) for (const c of cast) if (!byId.has(c.id)) byId.set(c.id, c);
  return [...byId.values()];
};

export const MOJI_CAST: readonly CastMember[] = joinCast(MOJI1_CAST, MOJI2_CAST, MOJI3_CAST, MOJI4_CAST);

export type { EpisodeScript };
