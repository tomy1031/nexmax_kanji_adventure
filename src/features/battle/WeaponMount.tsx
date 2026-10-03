import { motion } from 'framer-motion';
import { RubyText } from '../../components/ui/Ruby';
import { assetPath } from '../../lib/assetPath';
import { ELEMENT_LABEL, type Element } from '../../lib/forge/elements';
import type { WeaponClass } from '../../lib/forge/weapon';
import { weaponArt } from '../../lib/forge/recipe';

/**
 * The equipped weapon, mounted on Nexmax (docs/design/11 §6): its own picture
 * for each of the eight shapes, gold at ★5. How strong it is shows on it —
 * ★3 and up glow in the element's colour, 強化 Lv3 adds a ring, Lv5 makes the
 * ring gold — so a weapon that has been worked on looks like it.
 */

export interface MountView {
  cls: WeaponClass;
  element: Element;
  rarity: number;
  /** 強化 level 0..5. */
  level: number;
  /** The word it was forged from, furigana notation: "火山(かざん)" (recipe.ts weaponWord). */
  word: string;
}

/** The battle column's units (NaniwaBattleView W = 941). */
const cq = (px: number) => `${(px / 941) * 100}cqw`;

export const WeaponMount = ({
  m,
  fire,
  still,
  showFurigana,
  tag = true,
}: {
  m: MountView;
  /** Changes with every write: the weapon kicks as the light goes out. */
  fire?: number;
  still: boolean;
  showFurigana: boolean;
  /** The plate with its word and level. */
  tag?: boolean;
}) => {
  const color = ELEMENT_LABEL[m.element].color;
  const glow =
    m.rarity >= 5
      ? `radial-gradient(circle, #ffe9a0ee 0%, ${color}aa 40%, transparent 70%)`
      : m.rarity >= 3
        ? `radial-gradient(circle, ${color}ee 0%, ${color}77 42%, transparent 70%)`
        : 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 62%)';
  return (
    <div className="pointer-events-none relative h-full w-full" aria-hidden>
      <motion.div
        className="absolute -inset-[8%] rounded-full"
        style={{ background: glow }}
        animate={still || m.rarity < 3 ? undefined : { opacity: [0.65, 1, 0.65], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {m.level >= 3 && (
        <motion.div
          className="absolute inset-[2%] rounded-full border-dashed"
          style={{ borderWidth: cq(m.level >= 5 ? 9 : 7), borderColor: m.level >= 5 ? '#ffd36a' : color, boxShadow: `0 0 ${cq(16)} ${m.level >= 5 ? '#ffd36a' : color}` }}
          animate={still ? undefined : { rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <motion.img
        key={fire}
        src={assetPath(weaponArt(m.cls, m.rarity))}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain select-none"
        style={{ rotate: '-18deg', willChange: 'transform' }}
        initial={fire && !still ? { scale: 1.22, rotate: -2 } : false}
        animate={still ? { scale: 1, rotate: -18 } : { scale: 1, rotate: -18, y: ['0%', '-3%', '0%'] }}
        transition={{ scale: { type: 'spring', stiffness: 260, damping: 12 }, rotate: { type: 'spring', stiffness: 200, damping: 14 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
      />
      {tag && (
        <span
          className="absolute top-[4%] left-[52%] rounded-full border-[0.25cqw] px-[1.4cqw] leading-[1.7] font-black whitespace-nowrap text-white"
          style={{ fontSize: cq(20), background: 'rgba(20,12,6,0.82)', borderColor: m.rarity >= 5 ? '#ffd36a' : color }}
        >
          <RubyText showFurigana={showFurigana}>{m.word}</RubyText>
          {m.level > 0 && <span className="ml-[0.8cqw] text-[#ffd36a]">⚒{m.level}</span>}
        </span>
      )}
    </div>
  );
};
