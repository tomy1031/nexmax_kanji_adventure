/** Wire format for versus battles. Ported from kanji_go. */

export const BattleEventType = {
  /** Who is playing: shown on the VS screen, and what the round is chosen from. */
  PROFILE: 'PROFILE',
  /** Host publishes the agreed kanji list; both sides start from it. */
  HANDSHAKE: 'HANDSHAKE',
  READY: 'READY',
  /** A character was written cleanly enough to land a hit. */
  HIT: 'HIT',
  /** Three or more slips — the writer loses the exchange. */
  MISS: 'MISS',
  VICTORY: 'VICTORY',
  DISCONNECT: 'DISCONNECT',
  /** Heartbeat, so a silent drop is noticed. */
  PING: 'PING',
  /** A stamp (STAMPS index): the only thing players say to each other. */
  EMOTE: 'EMOTE',
} as const;
export type BattleEventType = (typeof BattleEventType)[keyof typeof BattleEventType];

export interface BattleEvent {
  type: BattleEventType;
  timestamp: number;
  data?: {
    /** Damage dealt by this event. */
    damage?: number;
    /** Sender's remaining HP, so the other side can correct drift. */
    hp?: number;
    /** Characters for the round, sent with HANDSHAKE. */
    kanji?: string[];
    /** Display name. */
    name?: string;
    /** Equipped weapon's display word, e.g. "火山". */
    weapon?: string;
    /** Index of the character just written. */
    index?: number;
    /** The sender, with PROFILE (and the host's again with HANDSHAKE). */
    profile?: VersusProfile;
    /** Which stamp, with EMOTE. */
    emote?: number;
  };
}

/** One side of a match, as the other sees it. No account: only what the game knows. */
export interface VersusProfile {
  /** The なかま they fight with (data/individuals.ts), or null for Nexmax himself. */
  avatar: string | null;
  rating: number;
  wins: number;
  losses: number;
  /** The kanji they have (★1), for choosing a fair round. */
  known: string[];
}

/**
 * The stamps of たいせん. Players never type to each other — a learning game
 * for children has no chat — so a fixed, friendly few is all there is.
 */
export const STAMPS = ['👍', '😆', '😱', '🙏'] as const;

/** Persisted versus record. */
export interface VersusStats {
  /** ELO-ish rating; everyone starts at 1000. */
  rating: number;
  wins: number;
  losses: number;
}

export const DEFAULT_VERSUS_STATS: VersusStats = { rating: 1000, wins: 0, losses: 0 };

/** Rating change, K = 32. Ported from kanji_go's rankUtils. */
export const ratingChange = (mine: number, theirs: number, won: boolean): number => {
  const expected = 1 / (1 + 10 ** ((theirs - mine) / 400));
  return Math.round(32 * ((won ? 1 : 0) - expected));
};

/** Rank badge for a rating. */
export const rankFor = (rating: number): { label: string; color: string } => {
  if (rating >= 1400) return { label: '金(きん)', color: '#ffcf4a' };
  if (rating >= 1200) return { label: '銀(ぎん)', color: '#c7d2dd' };
  if (rating >= 1050) return { label: '銅(どう)', color: '#d0894f' };
  return { label: '石(いし)', color: '#93a3b8' };
};
