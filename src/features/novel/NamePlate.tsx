import { useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { CastMember } from '../../types/novel';
import { assetPath } from '../../lib/assetPath';
import { nameRevealed } from '../../lib/nameReveal';
import { useKnownKana } from '../kana/useKnownKana';
import { useOwnedKanji } from '../moji/useOwnedKanji';

/**
 * Whose line this is. The player cannot read Japanese yet, so on 文字が 消えた 町
 * (look "night") the plate also shows the speaker's face, cut from their
 * portrait — who is talking is clear from the picture (2026-10-02「誰の
 * セリフか」「極力 画面上の 絵で ストーリーを 理解する 作りに」).
 *
 * A name whose letters have not come back yet is not shown at all: the plate
 * says ？？？ on a dark, broken-edged plate (the name was eaten). The first
 * time it comes back after the player has seen it missing, it lights up.
 */

/** Names the player has seen as ？？？ in this visit, and those already lit up again. */
const seenMissing = new Set<string>();
const relit = new Set<string>();

export const NamePlate = ({
  member,
  narrator,
  render,
  night,
}: {
  member?: CastMember;
  /** The name for narration lines, when there is no speaker. */
  narrator?: string;
  render: (text: string) => ReactNode;
  night: boolean;
}) => {
  const knownKana = useKnownKana();
  const owned = useOwnedKanji();
  const name = member?.name ?? narrator;
  const shown = nameRevealed(member?.nameChars, knownKana, owned);
  const key = member?.id ?? 'narrator';
  // Back after being missing: light it once (marked after it is on screen).
  const lightUp = shown && seenMissing.has(key) && !relit.has(key);
  useEffect(() => {
    if (!shown) seenMissing.add(key);
    else if (lightUp) relit.add(key);
  }, [shown, lightUp, key]);
  if (!name) return null;

  const face = night && member ? member.sprites.normal : undefined;

  if (!night) {
    return (
      <div className="g-wood relative z-10 mb-[-10px] ml-3 inline-flex items-center gap-1 px-4 py-1 text-base leading-[1.9] font-black">
        {!member && <span aria-hidden>💭</span>}
        {shown ? render(name) : '？？？'}
      </div>
    );
  }

  return (
    <motion.div
      key={`${key}-${shown}`}
      className={`relative z-10 mb-[-12px] ml-3 inline-flex items-center gap-2 py-1 pr-4 pl-1 text-base leading-[1.9] font-black ${shown ? 'g-plate-brass' : 'g-plate-missing'}`}
      initial={lightUp ? { scale: 1.25, opacity: 0 } : shown ? false : { rotate: -2 }}
      animate={lightUp ? { scale: 1, opacity: 1 } : shown ? undefined : { rotate: [-2, 2, -1, 0] }}
      transition={{ duration: lightUp ? 0.5 : 0.4 }}
    >
      <span className="g-plate-face" aria-hidden>
        {face ? (
          <span className="block h-full w-full" style={{ backgroundImage: `url(${assetPath(face)})` }} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-base">💭</span>
        )}
      </span>
      {shown ? render(name) : <span aria-label="なまえが ない">？？？</span>}
      {lightUp && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{ background: 'radial-gradient(ellipse, rgba(255,214,120,0.85), transparent 70%)' }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.9 }}
        />
      )}
    </motion.div>
  );
};

export default NamePlate;
