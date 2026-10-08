import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls, type MotionValue } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import * as sfx from '../../lib/sfx';

/**
 * ひもを 引く (docs/design/18 §3; 2026-10-08「紐を引っ張るところ、動きや作りがやや雑」).
 *
 * The book's bookmark cord hangs from its clasp, a charm on its end
 * (img/gacha/tassel.webp). The cord never leaves the clasp: the charm swings
 * from it like a pendulum, comes down under the finger drawing more cord out
 * of the book, and the cord bows when it goes slack. A ring of light below
 * the charm is where it has to go, and fills as it comes; on the way the cord
 * clicks a notch at a time. At the ring the clasp springs open (onOpen). Let
 * go before that and it springs back up, bouncing. A tap pulls it for you.
 */

/** The charm picture (img/gacha/tassel.webp, 184 × 512): the cord is tied through the ring at its top; the gem sits below it. */
const CHARM = { w: 184, h: 512, tie: 0.03, gem: 0.29 } as const;
/** The cord clicks at these parts of the way down. */
const NOTCHES = [0.3, 0.55, 0.8];

const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const buzz = (ms: number) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Not every phone can.
  }
};

export const PullCord = ({
  anchor,
  length,
  reach,
  width,
  still,
  tug,
  progress,
  onGrab,
  onOpen,
}: {
  /** Where the cord leaves the clasp, in the parent's px, and how long it hangs. */
  anchor: { x: number; y: number };
  length: number;
  /** How far down the charm has to come to open the clasp. */
  reach: number;
  /** The charm's width. */
  width: number;
  still: boolean;
  /** Bumped when the player taps anywhere else: the cord is pulled for them. */
  tug: number;
  /** 0..1, how far it is pulled — the book answers it. */
  progress: MotionValue<number>;
  onGrab: (held: boolean) => void;
  onOpen: () => void;
}) => {
  const charmH = (width * CHARM.h) / CHARM.w;
  const tieY = charmH * CHARM.tie;
  const gemY = charmH * (CHARM.gem - CHARM.tie);
  const ring = { x: anchor.x, y: anchor.y + length + reach + gemY, r: width * 0.62 };
  const circ = 2 * Math.PI * ring.r;

  // The swing (degrees), and where the finger has taken the charm from where it hangs.
  const swing = useMotionValue(0);
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const hx = useTransform(() => anchor.x + Math.sin(rad(swing.get())) * Math.max(length * 0.25, length + dy.get()) + dx.get());
  const hy = useTransform(() => anchor.y + Math.cos(rad(swing.get())) * Math.max(length * 0.25, length + dy.get()));
  const tilt = useTransform(() => (-Math.atan2(hx.get() - anchor.x, hy.get() - anchor.y) * 180) / Math.PI);
  const charmX = useTransform(() => hx.get() - width / 2);
  const charmY = useTransform(() => hy.get() - tieY);
  // Slack (bouncing back up past where it hangs): the cord bows out to the side.
  const cord = useTransform(() => {
    const x = hx.get();
    const y = hy.get();
    const slack = Math.max(0, length - Math.hypot(x - anchor.x, y - anchor.y));
    return `M${anchor.x} ${anchor.y} Q${(anchor.x + x) / 2 + slack * 0.9} ${(anchor.y + y) / 2} ${x} ${y}`;
  });
  const fill = useTransform(progress, (p) => circ * (1 - p));
  const ringGlow = useTransform(progress, [0, 1], [0, 1]);
  const gemGlow = useTransform(progress, [0, 1], [0.35, 1]);

  const [held, setHeld] = useState(false);
  const [open, setOpen] = useState(false);
  const cb = useRef({ onGrab, onOpen });
  useEffect(() => {
    cb.current = { onGrab, onOpen };
  });
  /** Pulling now (by the finger, or for the player): the notches click and the ring can open it. */
  const driving = useRef(false);
  const opened = useRef(false);
  const notch = useRef(0);
  const grab = useRef<{ x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const sway = useRef<AnimationPlaybackControls | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startSway = () => {
    if (still || opened.current) return;
    sway.current?.stop();
    sway.current = animate(swing, [swing.get(), 4, -4, swing.get()], { duration: 2.6, repeat: Infinity, ease: 'easeInOut' });
  };
  const stopAll = () => {
    sway.current?.stop();
    swing.stop();
    dx.stop();
    dy.stop();
  };

  const openClasp = () => {
    if (opened.current) return;
    opened.current = true;
    driving.current = false;
    stopAll();
    sfx.unlatch();
    buzz(30);
    setOpen(true);
    // The clasp lets go: the charm drops a little as the book takes over.
    if (!still) animate(dy, dy.get() + reach * 0.15, { duration: 0.3, ease: 'easeOut' });
    cb.current.onOpen();
  };

  // How far it is pulled: the book's light, the ring, the notches, the click.
  useEffect(
    () =>
      dy.on('change', (v) => {
        const p = clamp(v / reach, 0, 1);
        progress.set(p);
        if (!driving.current || opened.current) return;
        while (notch.current < NOTCHES.length && p >= NOTCHES[notch.current]) {
          sfx.cordTick(notch.current);
          buzz(8);
          notch.current += 1;
        }
        if (p >= 1) openClasp();
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Hanging there: a gentle swing, and every so often a little tug down — this way.
  useEffect(() => {
    startSway();
    const hint = still
      ? undefined
      : setInterval(() => {
          if (grab.current || driving.current || opened.current) return;
          animate(dy, [0, reach * 0.12, 0], { duration: 0.7, ease: 'easeInOut' });
        }, 2800);
    const pending = timers.current;
    return () => {
      clearInterval(hint);
      pending.forEach(clearTimeout);
      sway.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pulled for the player (a tap, or the keyboard): the same pull, quickly. */
  const pullForThem = () => {
    if (opened.current || driving.current) return;
    stopAll();
    swing.set(0);
    dx.set(0);
    driving.current = true;
    notch.current = 0;
    setHeld(true);
    cb.current.onGrab(true);
    animate(dy, reach * 1.02, { duration: still ? 0.2 : 0.45, ease: [0.55, 0, 0.8, 0.4] });
  };
  useEffect(() => {
    if (tug > 0) pullForThem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tug]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (opened.current || driving.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // The swing turns into a sideways offset, so nothing jumps under the finger.
    const side = Math.sin(rad(swing.get())) * (length + dy.get());
    stopAll();
    swing.set(0);
    dx.set(dx.get() + side);
    grab.current = { x: e.clientX, y: e.clientY, dx: dx.get(), dy: dy.get(), moved: false };
    driving.current = true;
    notch.current = 0;
    setHeld(true);
    cb.current.onGrab(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    if (!g || opened.current) return;
    const rx = e.clientX - g.x;
    const ry = e.clientY - g.y;
    if (Math.hypot(rx, ry) > 6) g.moved = true;
    // Down follows the finger; up and sideways give only a little.
    dy.set(Math.max(-length * 0.5, g.dy + (ry > 0 ? ry : ry * 0.3)));
    dx.set(clamp(g.dx + rx * 0.35, -width * 1.2, width * 1.2));
  };
  const onPointerUp = () => {
    const g = grab.current;
    grab.current = null;
    if (!g || opened.current) return;
    cb.current.onGrab(false);
    driving.current = false;
    // A tap on the cord: pull it for them.
    if (!g.moved) {
      pullForThem();
      return;
    }
    // Let go too soon: it springs back up, bouncing, and swings again.
    setHeld(false);
    const back = still ? { duration: 0.25 } : { type: 'spring' as const, stiffness: 380, damping: 8 };
    animate(dy, 0, back);
    animate(dx, 0, back);
    timers.current.push(setTimeout(startSway, 900));
  };

  const cordW = Math.max(3, width * 0.2);
  return (
    <>
      {/* Where it has to go: a ring of light that fills as the charm comes down. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{ left: ring.x - ring.r * 2, top: ring.y - ring.r * 2, width: ring.r * 4, height: ring.r * 4, background: 'radial-gradient(circle, rgba(255,232,150,0.75), transparent 62%)', opacity: ringGlow }}
      />
      <svg aria-hidden className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1">
        <motion.g
          animate={still || held || open ? { opacity: open ? 0 : 1 } : { opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
          transition={still || held || open ? { duration: 0.2 } : { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <circle cx={ring.x} cy={ring.y} r={ring.r} fill="rgba(20,12,40,0.35)" stroke="rgba(255,226,150,0.55)" strokeWidth={2} strokeDasharray="3 4" />
          <motion.circle
            cx={ring.x}
            cy={ring.y}
            r={ring.r}
            fill="none"
            stroke="#ffe08a"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={circ}
            style={{ strokeDashoffset: fill, rotate: -90 }}
          />
        </motion.g>
        {/* This way: a dotted path from the charm down to the ring, and an arrow in the ring, sliding down. */}
        {!held && !open && (
          <line x1={anchor.x} y1={anchor.y + length + charmH + 3} x2={ring.x} y2={ring.y - ring.r - 3} stroke="rgba(255,226,150,0.6)" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="0.1 7" />
        )}
        {!held && !open && (
          <motion.path
            d={`M${ring.x - ring.r * 0.42} ${ring.y - ring.r * 0.2} L${ring.x} ${ring.y + ring.r * 0.22} L${ring.x + ring.r * 0.42} ${ring.y - ring.r * 0.2}`}
            fill="none"
            stroke="#ffe08a"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0.85 }}
            animate={still ? { opacity: 0.85 } : { opacity: [0, 1, 0], y: [-ring.r * 0.35, ring.r * 0.3] }}
            transition={still ? undefined : { duration: 1.1, repeat: Infinity, ease: 'easeIn' }}
          />
        )}
        {/* The cord: red silk twisted with gold, coming out from under the clasp. */}
        <motion.g animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.3, delay: open ? 0.1 : 0 }}>
          <motion.path d={cord} fill="none" stroke="rgba(30,8,8,0.45)" strokeWidth={cordW + 2} strokeLinecap="round" />
          <motion.path d={cord} fill="none" stroke="#b5182a" strokeWidth={cordW} strokeLinecap="round" />
          <motion.path d={cord} fill="none" stroke="#ff5a66" strokeWidth={cordW * 0.5} strokeDasharray={`${cordW * 0.9} ${cordW * 0.9}`} />
          <motion.path d={cord} fill="none" stroke="#f6c95a" strokeWidth={cordW * 0.22} strokeDasharray={`${cordW * 0.5} ${cordW * 1.3}`} strokeDashoffset={cordW * 0.4} />
        </motion.g>
        <circle cx={anchor.x} cy={anchor.y} r={cordW * 0.95} fill="#f3c24f" stroke="#6b3a06" strokeWidth={1.5} />
      </svg>

      {/* The charm, hanging from its ring; its gem glows as it is pulled. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0"
        style={{ width, height: charmH, x: charmX, y: charmY, rotate: tilt, originX: 0.5, originY: CHARM.tie, willChange: 'transform' }}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.3, delay: open ? 0.1 : 0 }}
      >
        {/* A soft shadow, so it stands out from the brass behind it. */}
        <div className="absolute rounded-full" style={{ left: -width * 0.3, top: tieY, width: width * 1.6, height: charmH * 1.02, background: 'radial-gradient(ellipse, rgba(14,6,34,0.6), rgba(14,6,34,0.25) 50%, transparent 72%)' }} />
        <motion.div className="absolute rounded-full" style={{ left: -width * 0.45, top: tieY + gemY - width * 0.95, width: width * 1.9, height: width * 1.9, background: 'radial-gradient(circle, rgba(140,210,255,0.85), transparent 62%)', opacity: gemGlow }} />
        <img src={assetPath('img/gacha/tassel.webp')} alt="" className="absolute inset-0 h-full w-full" draggable={false} />
      </motion.div>

      {/* The clasp springing open: a burst of light where the cord was tied. */}
      {open && !still && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{ left: anchor.x - width * 2, top: anchor.y - width * 2, width: width * 4, height: width * 4, background: 'radial-gradient(circle, #fff, rgba(255,226,150,0.9) 30%, transparent 65%)' }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 1, 0], scale: [0.3, 1.4, 2] }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      )}

      {/* What the finger takes hold of: the cord and the charm where they hang. */}
      <button
        type="button"
        aria-label="ひもを 引く"
        data-tap
        className="absolute touch-none"
        style={{ left: anchor.x - Math.max(32, width * 1.3), top: anchor.y - 6, width: Math.max(64, width * 2.6), height: length + charmH + 12, cursor: open ? 'default' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(e) => {
          e.stopPropagation();
          // The keyboard (Enter, Space) has no pointer: pull it for them.
          if (e.detail === 0) pullForThem();
        }}
      />
    </>
  );
};

export default PullCord;
