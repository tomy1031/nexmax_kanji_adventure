import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import type { Street } from '../../lib/signStreet';

/**
 * The night street of ナニワタウン behind the sign drill (08 §3.6), and the row
 * of signs under it that fills as the learner writes.
 *
 * Until a proper street picture is made (manifest, 08 §3.6 段 D) the backdrop
 * is the title's town, darkened toward night. It never moves while writing.
 */

export const NightStreetBackdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#120f2b]">
    <picture>
      <source media="(orientation: landscape)" srcSet={assetPath('img/title/bg_wide.webp')} />
      <img src={assetPath('img/title/bg.webp')} alt="" className="h-full w-full object-cover" />
    </picture>
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(180deg, rgba(14,11,40,0.78) 0%, rgba(18,14,46,0.62) 45%, rgba(10,8,28,0.82) 100%)' }}
    />
  </div>
);

/**
 * One street: a sign for every passing write on it, lit or still blank.
 * `glyph` is what a lit sign shows (the kanji with its reading, or the kana).
 */
export const SignStreet = ({ street, glyph, label }: { street: Street; glyph: ReactNode; label: string }) => (
  <div className="flex flex-wrap items-end justify-center gap-2" role="img" aria-label={label}>
    {Array.from({ length: street.size }, (_, i) => {
      const on = i < street.lit;
      return (
        <motion.div
          // A new street is a new row of signs.
          key={`${street.index}-${i}`}
          initial={false}
          animate={on ? { scale: [1.25, 1] } : { scale: 1 }}
          className="flex w-11 flex-col items-center"
          style={{ willChange: 'transform' }}
        >
          <span aria-hidden className="h-2 w-6 border-x-2 border-[#8a6128]" />
          <span
            className="flex aspect-[4/5] w-full items-center justify-center rounded-md border-2 text-[18px] leading-[1.5] font-black"
            style={{
              background: on
                ? 'radial-gradient(circle at 50% 45%, #fff3d0 0%, #ffcf78 58%, #e0922e 100%)'
                : 'linear-gradient(180deg, #282254 0%, #120f2b 100%)',
              borderColor: on ? '#f6d488' : '#7a5220',
              color: '#3b1f00',
              boxShadow: on ? '0 0 10px rgba(255,190,90,0.85)' : 'inset 0 0 0 1px rgba(246,212,136,0.25)',
            }}
          >
            {on ? glyph : null}
          </span>
        </motion.div>
      );
    })}
  </div>
);
