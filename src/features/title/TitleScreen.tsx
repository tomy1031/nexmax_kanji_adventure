import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';

/**
 * Title (the layout example delivered with the parts, 「ChatGPT 画像 2026年9月29日
 * 17_02_34.png」): the city at sunset, the logo across the sky, Nexmax on the
 * ledge pointing out over the river, and three plates.
 *
 * Every part is a delivered picture (art-src/titlesozai/, kept out of git;
 * made web-sized into public/img/title/ by scripts/prepare_title_assets.mjs);
 * nothing is drawn in CSS. Phones get the tall city, PCs the wide one.
 *
 * The plates follow the usual phone-game title: the one thing to do next is
 * the big blue plate on top, everything else is a smaller brown plate of one
 * size. Both lead into 文字が 消えた 町 (08), which is the game now; the
 * picture-book worlds are closing (2026-09-30) and are reached only from the
 * route map's small ほかの 物語 link.
 *
 *   new player    はじめから (blue) → the prologue, which runs on into the map
 *                 つづきから (brown, greyed: nothing to continue yet)
 *   returning     つづきから (blue) → the route map — the game's home, one tap
 *                   from the next episode, with the forge and daily tasks
 *                   around it
 *                 はじめから (brown) → the prologue again; nothing is lost.
 *                   Wiping the save lives in せってい, behind its own
 *                   confirmation.
 *   always        せってい (brown)
 *
 * The screen comes in as a sequence — the logo drops in, Nexmax rises, the
 * plates slide up — and the blue plate keeps glowing softly. Nothing that
 * moves carries a CSS filter: on iPhone and iPad a filter on a moving layer is
 * redrawn every frame (2026-09-26「オープニングから重い」).
 */

const art = (name: string) => assetPath(`img/title/${name}.webp`);

/**
 * The button pictures, all cut with one box (width : height = 3.8). Where the
 * plate itself starts and ends inside each, as a fraction of its height,
 * measured from the WebP: gears and glow stick out differently on each, so
 * equal margins would leave unequal gaps.
 */
const PLATE_ASPECT = 3.8;
const PLATES = {
  newBlue: { src: 'btn_new_blue', label: 'はじめから', top: 0.11, bottom: 0.955 },
  newBrown: { src: 'btn_new_brown', label: 'はじめから', top: 0.143, bottom: 0.952 },
  continueBlue: { src: 'btn_continue_blue', label: 'つづきから', top: 0.12, bottom: 0.92 },
  continueBrown: { src: 'btn_continue_brown', label: 'つづきから', top: 0.082, bottom: 0.925 },
  settings: { src: 'btn_settings', label: 'せってい', top: 0.102, bottom: 0.925 },
} as const;
type PlateArt = (typeof PLATES)[keyof typeof PLATES];

/** Widths in % of the column: the big plate, and every other one. */
const BIG = 60;
const SMALL = 43;
/** Visible gap between two plates, in % of the column width. */
const GAP = 3.2;

type PlateSpec = { art: PlateArt; width: number; onClick: () => void; disabled?: boolean; glow?: boolean };

/** margin-top (in %, which CSS takes of the width) that leaves GAP between the drawn plates. */
const marginAbove = (above: PlateSpec, below: PlateSpec) =>
  GAP - (1 - above.art.bottom) * (above.width / PLATE_ASPECT) - below.art.top * (below.width / PLATE_ASPECT);

const Plate = ({ spec, marginTop, still }: { spec: PlateSpec; marginTop: number; still: boolean }) => (
  <motion.button
    type="button"
    data-tap
    disabled={spec.disabled}
    whileTap={spec.disabled ? undefined : { scale: 0.95 }}
    className="relative block disabled:opacity-60 disabled:grayscale"
    style={{ width: `${spec.width}%`, marginTop: `${marginTop}%` }}
    onClick={spec.onClick}
  >
    {spec.glow && !still && (
      <motion.span
        aria-hidden
        className="absolute -inset-x-[4%] -inset-y-[18%] rounded-full"
        style={{ background: 'radial-gradient(ellipse closest-side, rgba(255,214,110,0.85) 0%, rgba(255,190,60,0.3) 55%, transparent 100%)', willChange: 'opacity' }}
        animate={{ opacity: [0.15, 0.85, 0.15] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}
    <img src={art(spec.art.src)} alt={spec.art.label} draggable={false} className="relative block h-auto w-full select-none" />
  </motion.button>
);

export const TitleScreen = () => {
  const navigate = useNavigate();
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);
  const seenIntro = useGameStore((s) => s.tutorials.intro);
  const seenPrologue = useGameStore((s) => s.tutorials.prologue);
  const canContinue = seenPrologue || seenIntro || hasSave;
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);

  // A new player starts with the prologue of 文字が 消えた 町 (08 §10.2).
  const startOver = () => navigate('/prologue');
  const carryOn = () => navigate('/map/moji');
  const settings: PlateSpec = { art: PLATES.settings, width: SMALL, onClick: () => navigate('/settings') };
  const plates: PlateSpec[] = canContinue
    ? [
        { art: PLATES.continueBlue, width: BIG, onClick: carryOn, glow: true },
        { art: PLATES.newBrown, width: SMALL, onClick: startOver },
        settings,
      ]
    : [
        { art: PLATES.newBlue, width: BIG, onClick: startOver, glow: true },
        { art: PLATES.continueBrown, width: SMALL, onClick: carryOn, disabled: true },
        settings,
      ];

  return (
    <div className="relative h-dvh overflow-hidden bg-[#2a2350]">
      <picture>
        <source media="(orientation: landscape)" srcSet={art('bg_wide')} />
        <img src={art('bg')} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      </picture>

      {/* The composition keeps the reference's 9:16 proportions; on a wide
          screen the city still fills the window behind it. */}
      <div className="relative mx-auto flex h-full w-[min(100%,56dvh)] flex-col items-center pt-[max(3dvh,env(safe-area-inset-top))] pb-[max(8dvh,env(safe-area-inset-bottom))]">
        {/* ロゴ ---------------------------------------------------------- */}
        <motion.h1
          className="w-[86%]"
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
        >
          <img
            src={art('logo')}
            alt="ネクマックスの漢字アドベンチャー　なくなった ことばを 取りもどそう！"
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </motion.h1>

        <div className="flex-1" />

        {/* ネクマックスと ボタン ------------------------------------------- */}
        <div className="relative w-full">
          <motion.div
            aria-hidden
            className="absolute bottom-full left-[12%] mb-[0.6dvh] w-[min(40%,19.5dvh)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.5 }}
          >
            <motion.img
              src={art('nexmax')}
              alt=""
              draggable={false}
              className="block h-auto w-full select-none"
              style={{ willChange: 'transform' }}
              animate={still ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <motion.div
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            {plates.map((p, i) => (
              <Plate key={p.art.src} spec={p} marginTop={i === 0 ? 0 : marginAbove(plates[i - 1], p)} still={still} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
