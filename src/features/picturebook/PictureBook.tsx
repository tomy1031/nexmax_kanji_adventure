import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { PAGE_H, PAGE_W, toDataUrl } from './paper';
import { SCENES, type Layer } from './scenes';
import { layerId } from './layerId';
import { RENDERED } from './rendered.generated';
import { assetPath } from '../../lib/assetPath';
import SceneSigns from './SceneSigns';
import { signPageX, signPageY } from './hasSign';

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

/**
 * A layer's image: the bitmap scripts/render_scenes.ts made of it, or the SVG
 * itself when there is none. The bitmap matters on iPhone and iPad, where the
 * browser (WebKit) would otherwise run the torn-paper filter at full screen
 * size for every layer, again and again (2026-09-26「すごく重いです。M3 iPad なのに」).
 */
const urlCache = new Map<string, string>();
const urlOf = (svg: string) => {
  let u = urlCache.get(svg);
  if (!u) {
    const id = layerId(svg);
    u = RENDERED.has(id) ? assetPath(`img/scenes/${id}.webp`) : toDataUrl(svg);
    urlCache.set(svg, u);
  }
  return u;
};

/** Size of a page that covers the box, keeping the page's aspect ratio. */
const useCoverSize = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: PAGE_W, h: PAGE_H, boxW: PAGE_W, boxH: PAGE_H });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const k = Math.max(width / PAGE_W, height / PAGE_H);
      setSize({ w: Math.ceil(PAGE_W * k), h: Math.ceil(PAGE_H * k), boxW: width, boxH: height });
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
        // Its own compositor layer, so moving it never repaints the picture.
        style={{ transformOrigin: origin, willChange: layer.animate && !still ? 'transform, opacity' : undefined }}
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
  /**
   * Hold the page still. The writing drill sets it: nothing should move
   * behind the character being written, and on a phone the moving layers
   * cost frames the drill needs (2026-09-26, iPhone SE).
   */
  still?: boolean;
  /** A letter whose sign stays dark for now (SceneSigns). */
  signHold?: string;
  /** Keep the signs faint (a big letter is shown over them). */
  signsFaint?: boolean;
}

export const PictureBook = ({ scene, fx = [], className, children, still: holdStill = false, signHold, signsFaint }: PictureBookProps) => {
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced || holdStill);
  const { ref, size } = useCoverSize();

  const def = SCENES[scene] ?? SCENES.mukashi_village;

  /**
   * On a wide screen (a tablet held sideways, a PC) the tall page is cut top
   * and bottom. A scene with signs is then slid so its signs sit in the upper
   * part of the screen instead of off it — the signs are the story there.
   */
  const pageY = useMemo(() => signPageY(def.signs, size.h, size.boxH), [def, size]);
  const pageX = useMemo(() => signPageX(def.signs, size.w, size.boxW), [def, size]);

  const fxLayers = useMemo(
    () => fx.flatMap((name) => def.fx[name] ?? []),
    [fx, def],
  );

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden bg-[#cfe9f5] ${className ?? ''}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={scene}
          className={`absolute ${pageX == null ? 'left-1/2' : 'left-0'} ${pageY == null ? 'top-1/2' : 'top-0'}`}
          style={{ width: size.w, height: size.h, x: pageX == null ? '-50%' : pageX, y: pageY == null ? '-50%' : pageY }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          {def.photo && (
            <img src={assetPath(def.photo)} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full object-cover select-none" />
          )}
          {def.layers.map((layer) => (
            <PaperLayer key={layer.key} layer={layer} still={still} isFx={false} />
          ))}
          {def.signs && <SceneSigns signs={def.signs} w={size.w} h={size.h} hold={signHold} faint={signsFaint} />}
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
