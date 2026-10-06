import { useState } from 'react';
import KanjiWriterCanvas from '../../components/KanjiWriterCanvas';
import { WrittenKanji } from './WrittenKanji';
import * as sfx from '../../lib/sfx';

/**
 * なぞって よぶ — the player traces the companion's character on its card,
 * and the companion comes when it is written (2026-10-07「ちゃんと 読める 人は
 * 少ないと 思うけど、その 上でも 楽しく できる 工夫が 欲しい」). Reading is
 * not needed: the model is there to trace, each right stroke rings higher,
 * and the character is the key that opens the card.
 *
 * Laid out as WrittenWord (two characters one above the other), so the card
 * looks the same whether it was traced or written for the player. Taps on it
 * stay on it: they are strokes, not "skip".
 */

/** Looser than the fight: this is a reward, not a test. */
const LENIENCY = 1.8;

export const TraceWord = ({ word, size, onDone }: { word: string; size: number; onDone: () => void }) => {
  const chars = [...word];
  const [at, setAt] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const each = chars.length > 1 ? Math.round(size * 0.62) : size;
  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: chars.length > 1 ? size * 0.02 : 0 }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {chars.map((c, i) =>
        i < at ? (
          <WrittenKanji key={c + i} char={c} size={each} still />
        ) : i === at ? (
          <KanjiWriterCanvas
            key={c + i}
            char={c}
            size={each}
            quizMode
            showSample
            surface="ink"
            autoRestart={false}
            leniency={LENIENCY}
            onCorrectStroke={() => {
              sfx.neon(0.45, Math.min(strokes, 8));
              setStrokes((n) => n + 1);
            }}
            onComplete={() => {
              sfx.chime();
              if (i < chars.length - 1) setAt(i + 1);
              else onDone();
            }}
          />
        ) : (
          <div key={c + i} style={{ width: each, height: each }} aria-hidden />
        ),
      )}
    </div>
  );
};
