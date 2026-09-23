import { useMemo } from 'react';
import { motion, type LegacyAnimationControls } from 'framer-motion';
import { GameIcon } from '../../components/ui/GameIcon';
import { bee, boar, crow, svgDoc, toDataUrl } from '../picturebook/paper';

/**
 * The opponent, drawn in the same torn paper as the picture book when there
 * is a paper cut-out for it, otherwise its Game Icons glyph as a dark
 * silhouette with a purple aura (public/img/design/森の漢字バトル画面.png).
 */

export type EnemyArtId = 'crow' | 'boar' | 'bee';

const ART: Record<EnemyArtId, string> = {
  crow: svgDoc(crow(78, 104, 1.5), 4, 200, 200),
  boar: svgDoc(boar(84, 130, 1.1), 6, 200, 200),
  bee: svgDoc(bee(88, 110, 1.05), 8, 200, 200),
};

interface EnemyArtProps {
  art?: EnemyArtId;
  icon: string;
  color: string;
  size: number;
  controls?: LegacyAnimationControls;
}

export const EnemyArt = ({ art, icon, color, size, controls }: EnemyArtProps) => {
  const url = useMemo(() => (art ? toDataUrl(ART[art]) : null), [art]);

  return (
    <motion.div className="relative flex items-center justify-center" style={{ width: size, height: size }} animate={controls}>
      <motion.div
        className="absolute inset-[8%] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(150,70,220,0.55) 0%, rgba(90,30,160,0.25) 45%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
        {url ? (
          <img src={url} alt="" aria-hidden draggable={false} style={{ width: size, height: size }} />
        ) : (
          <span
            className="flex items-center justify-center"
            style={{
              color: '#2a1840',
              filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 18px rgba(170,90,255,0.8))`,
            }}
          >
            <GameIcon name={icon} size={size * 0.72} fallback="☠" />
          </span>
        )}
      </motion.div>
    </motion.div>
  );
};

export default EnemyArt;
