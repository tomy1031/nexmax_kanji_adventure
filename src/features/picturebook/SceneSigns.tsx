import { motion } from 'framer-motion';
import { useKnownLetters } from './useKnownLetters';

/**
 * The town's signs, in the picture (2026-10-02「書く ことで 文字が 灯る 演出…
 * 明確に 町の 景色が 変わったり」「ユーザーは 日本語を 理解できません。極力
 * 画面上の 絵で ストーリーを 理解する 作りに」).
 *
 * Each spot is a sign in the painted scene that the Mojikui ate blank. It
 * stays dark until the player has written its letter (a kana written
 * KANA_REPS times, a kanji owned at ★1), then shows the letter on a
 * lamp-lit face. The letter is drawn plain — the sign glows, the letter does
 * not (「漢字 自体が 光で 太字に 表示されるのは よくない」). A sign that lights
 * while it is on screen gives one warm pop.
 *
 *   panel — the painting already has the empty panel (the station's
 *           calendar): only the lit face is drawn over it.
 *   hang  — no sign in the painting: a small brass-framed board is hung
 *           there, dark until lit.
 *
 * Positions are in the source picture's pixels; the overlay maps them with
 * the same object-cover the picture uses. Only opacity and transform move
 * (no filters — iPhone, docs/constraints.md).
 */

export interface SignSpot {
  /** The letter that belongs here. */
  char: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** This one sign's look, when it differs from the set's. */
  style?: 'panel' | 'hang';
}

export interface SceneSignSet {
  /** The source picture's size in pixels. */
  image: readonly [number, number];
  style: 'panel' | 'hang';
  spots: readonly SignSpot[];
}

const Spot = ({ spot, lit, style, k, ox, oy }: { spot: SignSpot; lit: boolean; style: SceneSignSet['style']; k: number; ox: number; oy: number }) => {
  const left = ox + spot.x * k;
  const top = oy + spot.y * k;
  const w = spot.w * k;
  const h = spot.h * k;
  const hang = style === 'hang';

  return (
    <div className="absolute" style={{ left, top, width: w, height: h }}>
      {hang && (
        // Two rods and a brass frame: the board itself, dark until lit.
        <>
          <span className="absolute -top-[18%] left-[22%] h-[20%] w-[3%] bg-[#8a6128]" />
          <span className="absolute -top-[18%] right-[22%] h-[20%] w-[3%] bg-[#8a6128]" />
          <span
            className="absolute inset-0 rounded-[10%] border-[max(2px,0.07em)] border-[#c38a36]"
            style={{ background: 'linear-gradient(180deg, #282254 0%, #120f2b 100%)', fontSize: h * 0.2 }}
          />
        </>
      )}
      <motion.div
        className={`absolute flex items-center justify-center ${hang ? 'inset-[7%] rounded-[8%]' : 'inset-0 rounded-[6%]'}`}
        style={{
          background: 'radial-gradient(circle at 50% 42%, #fff3d0 0%, #ffd27f 55%, #e8973a 100%)',
          boxShadow: `0 0 ${h * 0.35}px rgba(255,190,90,0.75)`,
          willChange: 'transform, opacity',
        }}
        // Already lit on arrival: shown as is. Lit while on screen: one pop.
        initial={false}
        animate={lit ? { opacity: 1, scale: [1.35, 1] } : { opacity: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <span className="leading-none font-bold text-[#3b1f00]" style={{ fontSize: h * 0.62 }}>
          {spot.char}
        </span>
      </motion.div>
    </div>
  );
};

/** Draws one scene's signs inside the picture box (w × h, the box the picture covers). */
export const SceneSigns = ({ signs, w, h }: { signs: SceneSignSet; w: number; h: number }) => {
  const known = useKnownLetters();
  const [iw, ih] = signs.image;
  // object-cover, centred
  const k = Math.max(w / iw, h / ih);
  const ox = (w - iw * k) / 2;
  const oy = (h - ih * k) / 2;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {signs.spots.map((s) => (
        <Spot key={s.char + s.x} spot={s} lit={known.has(s.char)} style={s.style ?? signs.style} k={k} ox={ox} oy={oy} />
      ))}
    </div>
  );
};

export default SceneSigns;
