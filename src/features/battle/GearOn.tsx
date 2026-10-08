import { motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { bodyBox, gearArt, gearIsGold, type GearBox, type GearLayout, type Worn } from './gearLayout';

/**
 * そうび worn by Nexmax (2026-10-04「盾・よろい・おまもりも 絵に して、
 * ネクマックスに 着せて」): the armour on his back, peeking out behind him;
 * the shield held up in front; the charm floating by his head. Each its own
 * picture (scripts/art/manifest.mjs, gear), laid over whichever Nexmax picture
 * the screen uses — the boxes are shares of that picture's frame.
 */

const box = (p: GearBox) => ({ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, aspectRatio: '1 / 1', rotate: `${p.rotate ?? 0}deg` });

/** A ★5 forged piece shines gold around its outline (lib/forge/gear.ts). */
const GOLD = 'drop-shadow(0 0 3px #ffe08a) drop-shadow(0 0 7px rgba(255,200,70,0.8))';
const gold = (id: string | null | undefined) => (gearIsGold(id) ? { filter: GOLD } : {});

/** The armour, behind Nexmax. Render it before his picture. */
export const GearBehind = ({ worn, layout, still }: { worn: Worn; layout: GearLayout; still: boolean }) =>
  worn.body ? (
    <motion.img
      src={assetPath(gearArt(worn.body))}
      alt=""
      aria-hidden
      draggable={false}
      className="pointer-events-none absolute object-contain select-none"
      style={{ ...box(bodyBox(layout, worn.body)), ...gold(worn.body) }}
      animate={still ? undefined : { y: ['0%', '-2%', '0%'] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  ) : null;

/** The shield and the charm, in front of Nexmax. Render them after his picture. `guard` changes when a strike is taken. */
export const GearFront = ({ worn, layout, still, guard }: { worn: Worn; layout: GearLayout; still: boolean; guard?: number }) => (
  <>
    {worn.shield && (
      <motion.img
        key={`s${guard ?? 0}`}
        src={assetPath(gearArt(worn.shield))}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute object-contain select-none"
        style={{ ...box(layout.shield), ...gold(worn.shield) }}
        initial={guard && !still ? { scale: 1.25, x: '12%' } : false}
        animate={{ scale: 1, x: '0%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 12 }}
      />
    )}
    {worn.charm && (
      <motion.img
        src={assetPath(gearArt(worn.charm))}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute object-contain select-none"
        style={box(layout.charm)}
        animate={still ? undefined : { y: ['0%', '-10%', '0%'], rotate: [-6, 6, -6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}
  </>
);
