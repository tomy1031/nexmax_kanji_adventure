import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import HanziWriter from 'hanzi-writer';
import { loadCharData } from '../lib/strokeLoader';

/**
 * The one place hanzi-writer is touched. Ported from kanji_go with the debug
 * panel's tuning inlined as constants.
 *
 * Two stacked writers share a container: a faint sample layer underneath
 * (the 手本, toggled by `showSample`) and the interactive quiz layer on top.
 * On completion the quiz restarts itself, which is exactly the shape the
 * ten-rep drill needs — the parent stops mounting it once the reps are done.
 */

const TUNING = {
  strokeAnimationSpeed: 1,
  delayBetweenStrokes: 300,
  drawingWidth: 24,
  // 1.0 is hanzi-writer's default strictness. Slightly forgiving, because a
  // fingertip on a phone is a blunt instrument and the thing being assessed is
  // stroke order and shape, not pixel precision.
  leniency: 1.15,
  strokeHighlightSpeed: 2,
} as const;

interface KanjiWriterCanvasProps {
  char: string;
  size?: number;
  onCorrectStroke?: (strokeData: Record<string, unknown>) => void;
  onMistake?: (strokeData: Record<string, unknown>) => void;
  onComplete?: (summary: { character: string; totalMistakes: number }) => void;
  quizMode?: boolean;
  /** Show the character in light grey behind the quiz layer (手本). */
  showSample?: boolean;
}

export interface KanjiWriterHandle {
  /** Play the full stroke-order animation, then resume the quiz. */
  animateStroke: () => void;
  resetQuiz: () => void;
}

const KanjiWriterCanvas = forwardRef<KanjiWriterHandle, KanjiWriterCanvasProps>(
  ({ char, size = 300, onCorrectStroke, onMistake, onComplete, quizMode = false, showSample = false }, ref) => {
    const writerRef = useRef<HanziWriter | null>(null);
    const sampleWriterRef = useRef<HanziWriter | null>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const sampleRef = useRef<HTMLDivElement>(null);
    const isQuizActiveRef = useRef(false);
    const startQuizRef = useRef<() => void>(() => {});

    // Callbacks live in a ref so changing them never re-creates the writer.
    const callbacksRef = useRef({ onCorrectStroke, onMistake, onComplete });
    useEffect(() => {
      callbacksRef.current = { onCorrectStroke, onMistake, onComplete };
    }, [onCorrectStroke, onMistake, onComplete]);

    useImperativeHandle(ref, () => ({
      animateStroke: () => {
        const writer = writerRef.current;
        if (!writer) return;
        if (isQuizActiveRef.current) {
          writer.cancelQuiz();
          isQuizActiveRef.current = false;
        }
        writer.animateCharacter({
          onComplete: () => {
            setTimeout(() => {
              writerRef.current?.hideCharacter({
                onComplete: () => setTimeout(() => startQuizRef.current(), 300),
              });
            }, 1000);
          },
        });
      },
      resetQuiz: () => {
        if (writerRef.current && isQuizActiveRef.current) {
          writerRef.current.cancelQuiz();
          isQuizActiveRef.current = false;
        }
        setTimeout(() => startQuizRef.current(), 100);
      },
    }));

    useEffect(() => {
      const target = targetRef.current;
      if (!target) return;
      target.innerHTML = '';

      const startQuiz = () => {
        if (!writerRef.current || !quizMode) return;
        isQuizActiveRef.current = true;
        writerRef.current.quiz({
          // After two misses on one stroke hanzi-writer flashes the correct
          // stroke, so a stuck learner always has a way forward.
          showHintAfterMisses: 2,
          onCorrectStroke: (data) => callbacksRef.current.onCorrectStroke?.(data as Record<string, unknown>),
          onMistake: (data) => callbacksRef.current.onMistake?.(data as Record<string, unknown>),
          onComplete: (summary) => {
            isQuizActiveRef.current = false;
            callbacksRef.current.onComplete?.(summary);
            // Restart for the next rep. The sample layer is independent and
            // stays put.
            setTimeout(() => startQuiz(), 500);
          },
        });
      };
      startQuizRef.current = startQuiz;

      const showFallback = (container: HTMLElement) => {
        // No stroke data for this character. Rather than a dead square, show
        // the glyph and let the learner tap through — the drill must never
        // become a wall.
        const el = document.createElement('button');
        el.type = 'button';
        el.style.cssText = `width:${size}px;height:${size}px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;background:linear-gradient(135deg,#fef3c7 0%,#fcd34d 100%);border:0;border-radius:16px;`;
        el.innerHTML = `
          <div style="font-size:${size / 2.5}px;font-weight:800;color:#92400e;">${char}</div>
          <div style="font-size:13px;color:#78350f;margin-top:8px;">タップで つぎへ</div>
          <div style="font-size:11px;color:#a16207;margin-top:4px;">書き順データがありません</div>`;
        el.onclick = () => {
          el.innerHTML = `<div style="font-size:${size / 2.5}px;font-weight:800;color:#065f46;">✓</div>`;
          setTimeout(() => callbacksRef.current.onComplete?.({ character: char, totalMistakes: 0 }), 400);
        };
        container.appendChild(el);
      };

      const init = async () => {
        try {
          target.innerHTML = `
            <div style="width:${size}px;height:${size}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
              <div style="width:28px;height:28px;border:3px solid rgba(120,120,120,0.25);border-top-color:#4A9EFF;border-radius:50%;animation:kw-spin 0.8s linear infinite;"></div>
              <div style="font-size:11px;color:#999;">よみこみ中…</div>
            </div>
            <style>@keyframes kw-spin{to{transform:rotate(360deg)}}</style>`;

          const data = await loadCharData(char);
          target.innerHTML = '';
          if (!data) {
            showFallback(target);
            return;
          }

          writerRef.current = HanziWriter.create(target, char, {
            width: size,
            height: size,
            padding: 20,
            showOutline: false,
            showCharacter: false,
            strokeAnimationSpeed: TUNING.strokeAnimationSpeed,
            delayBetweenStrokes: TUNING.delayBetweenStrokes,
            drawingWidth: TUNING.drawingWidth,
            leniency: TUNING.leniency,
            strokeHighlightSpeed: TUNING.strokeHighlightSpeed,
            radicalColor: '#168F16',
            strokeColor: '#2b3a55',
            outlineColor: '#DDD',
            highlightColor: '#4A9EFF',
            charDataLoader: () => Promise.resolve(data),
          });

          if (quizMode) startQuiz();
        } catch (error) {
          console.error('Failed to initialize HanziWriter:', error);
          showFallback(target);
        }
      };

      init();

      return () => {
        writerRef.current?.cancelQuiz();
        isQuizActiveRef.current = false;
        target.innerHTML = '';
      };
    }, [char, size, quizMode]);

    // Sample (手本) layer — independent of the quiz so toggling it mid-rep
    // does not reset the learner's progress on the current character.
    useEffect(() => {
      const sampleTarget = sampleRef.current;
      if (!sampleTarget) return;
      sampleTarget.innerHTML = '';

      if (!showSample) {
        sampleWriterRef.current = null;
        return;
      }

      (async () => {
        const data = await loadCharData(char);
        if (!data) return;
        sampleWriterRef.current = HanziWriter.create(sampleTarget, char, {
          width: size,
          height: size,
          padding: 20,
          showOutline: false,
          showCharacter: true,
          strokeColor: 'rgba(120,130,150,0.22)',
          // Must be rgba — hanzi-writer does not accept the keyword
          // 'transparent' here.
          outlineColor: 'rgba(255,255,255,0)',
          charDataLoader: () => Promise.resolve(data),
        });
      })();

      return () => {
        sampleTarget.innerHTML = '';
      };
    }, [char, size, showSample]);

    return (
      <div className="relative flex items-center justify-center rounded-3xl bg-white shadow-[0_10px_30px_rgba(11,26,51,0.18)] ring-4 ring-white/70">
        <div
          ref={sampleRef}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 1 }}
        />
        <div ref={targetRef} className="relative cursor-crosshair touch-none" style={{ zIndex: 2 }} />
      </div>
    );
  },
);

KanjiWriterCanvas.displayName = 'KanjiWriterCanvas';

export default KanjiWriterCanvas;
