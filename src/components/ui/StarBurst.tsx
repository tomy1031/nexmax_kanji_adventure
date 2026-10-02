import { motion } from 'framer-motion';

/** Eight stars flying out from the centre: a star was gained. */
export const StarBurst = () => (
  <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <motion.span
          key={i}
          className="absolute -mt-3 -ml-3 text-2xl"
          style={{ color: '#ffd23a', willChange: 'transform, opacity' }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
          animate={{ x: Math.cos(a) * 110, y: Math.sin(a) * 110, scale: 1.2, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          ★
        </motion.span>
      );
    })}
  </div>
);

export default StarBurst;
