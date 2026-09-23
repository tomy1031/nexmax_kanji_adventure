import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { PAGE_H, PAGE_W, toDataUrl } from './paper';
import { SCENES, type Layer } from './scenes';

/**
 * 動く 絵本 — the animated picture book.
 *
 * Renders one scene (a stack of torn-paper layers) and whichever effects the
 * current line asks for. Layers are static images; only their position and
 * opacity move, so this stays smooth on an inexpensive phone.
 *
 * The page is a fixed 400 × 720 portrait sheet scaled to *cover* the box it
 * sits in (like background-size: cover), so a layer's rotation pivot can be
 * given in page coordinates and still land in the right place on any screen.
 *
 * `children` render on top of the page and are laid out against the box
 * itself, not the scaled page.
 */

const urlCache = new Map<string, string>();
const urlOf = (svg: string) => {
  let u = urlCache.get(svg);
  if (!u) {
    u = toDataUrl(svg);
    urlCache.set(svg, u);
  }
  return u;
};

/** Size of a page that covers the box, keeping the page's aspect ratio. */
const useCoverSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: PAGE_W, h: PAGE_H });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const k = Math.max(width / PAGE_W, height / PAGE_H);
      setSize({ w: Math.ceil(PAGE_W * k), h: Math.ceil(PAGE_H * k) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
};

const PaperLayer = ({ layer, still, isFx }: { layer: Layer; still: boolean; isFx: boolean }) => {
  const origin = layer.origin
    ? `${(layer.origin[0] / PAGE_W) * 100}% ${(layer.origin[1] / PAGE_H) * 100}%`
    : '50% 50%';

  const target = layer.opacity ?? 1;
  const enter = layer.enter ?? { opacity: target };

  return (
    <motion.div
      className="absolute inset-0"
      initial={isFx ? { opacity: 0 } : false}
      animate={isFx ? enter : { opacity: target }}
      exit={layer.exit ?? { opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ mixBlendMode: layer.blend, opacity: isFx ? undefined : target, transformOrigin: origin }}
    >
      <motion.img
        src={urlOf(layer.svg)}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{ transformOrigin: origin }}
        animate={still ? undefined : layer.animate}
        transition={layer.transition}
      />
    </motion.div>
  );
};

interface PictureBookProps {
  scene: string;
  fx?: readonly string[];
  className?: string;
  children?: ReactNode;
}

export const PictureBook = ({ scene, fx = [], className, children }: PictureBookProps) => {
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  const { ref, size } = useCoverSize();

  const def = SCENES[scene] ?? SCENES.mukashi_village;

  const fxLayers = useMemo(
    () => fx.flatMap((name) => def.fx[name] ?? []),
    [fx, def],
  );

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden bg-[#cfe9f5] ${className ?? ''}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={scene}
          className="absolute top-1/2 left-1/2"
          style={{ width: size.w, height: size.h, x: '-50%', y: '-50%' }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {def.layers.map((layer) => (
            <PaperLayer key={layer.key} layer={layer} still={still} isFx={false} />
          ))}
          <AnimatePresence>
            {fxLayers.map((layer) => (
              <PaperLayer key={layer.key} layer={layer} still={still} isFx />
            ))}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      {children}
    </div>
  );
};

export default PictureBook;
