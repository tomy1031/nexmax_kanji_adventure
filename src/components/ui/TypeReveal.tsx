import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Letters per second — a comfortable reading pace for a learner. */
const CPS = 26;

/**
 * Shows its text like a game's message window: line by line, left to right.
 *
 * It does not cut the string into letters. The whole line is laid out once,
 * exactly as it will stay, and a clip-path uncovers it — so ruby, the
 * holes of かな編 and emoji (whatever the caller renders) never jump or
 * reflow while they appear. Only the clip changes each frame.
 *
 * `revealKey` restarts it (a new line); `full` shows everything at once (the
 * learner tapped, or motion is reduced) and `onDone` says it has finished.
 */
export const TypeReveal = ({
  revealKey,
  full,
  onDone,
  className,
  children,
}: {
  revealKey: string | number;
  full: boolean;
  onDone: () => void;
  className?: string;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef(onDone);
  useLayoutEffect(() => {
    doneRef.current = onDone;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (full) {
      el.style.clipPath = '';
      doneRef.current();
      return;
    }

    // The line boxes: one band per line (the line height is fixed, and the
    // ruby sits inside its own line's band), each as wide as what is on it.
    const box = el.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 34;
    const count = Math.max(1, Math.round(box.height / lh));
    const range = document.createRange();
    range.selectNodeContents(el);
    const rights = new Array<number>(count).fill(0);
    for (const r of range.getClientRects()) {
      if (r.width === 0) continue;
      const band = Math.min(count - 1, Math.max(0, Math.floor((r.top + r.height / 2 - box.top) / lh)));
      rights[band] = Math.max(rights[band], r.right - box.left);
    }
    const total = rights.reduce((a, b) => a + b, 0);
    // English reads faster per letter than kana and kanji do.
    const letters = [...(el.textContent ?? '').replace(/\s/g, '')].reduce((n, c) => n + (c < '\u0100' ? 0.4 : 1), 0);
    if (total === 0 || letters === 0) {
      doneRef.current();
      return;
    }
    // Hidden before the first frame, or the whole line would flash once.
    el.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
    const ms = (letters / CPS) * 1000;
    const W = box.width + 40;
    // Room above the first line for its ruby, and below the last.
    const top = (i: number) => (i === 0 ? -24 : i * lh);
    const bottom = (i: number) => (i === count - 1 ? box.height + 16 : (i + 1) * lh);

    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      let left = Math.min(1, (now - start) / ms) * total;
      let k = 0;
      while (k < count - 1 && left > rights[k]) left -= rights[k++];
      const x = Math.min(left, rights[k]);
      el.style.clipPath = `polygon(-20px ${top(0)}px, ${W}px ${top(0)}px, ${W}px ${top(k)}px, ${x}px ${top(k)}px, ${x}px ${bottom(k)}px, -20px ${bottom(k)}px)`;
      if (now - start < ms) raf = requestAnimationFrame(frame);
      else {
        el.style.clipPath = '';
        doneRef.current();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [revealKey, full]);

  return (
    <p ref={ref} className={className}>
      {children}
    </p>
  );
};

export default TypeReveal;
