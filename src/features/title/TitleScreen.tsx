import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapPath } from '../../lib/nav';
import { motion, useReducedMotion } from 'framer-motion';
import { assetPath } from '../../lib/assetPath';
import { useGameStore } from '../../store/gameStore';

/**
 * Title (the layout example delivered with the parts, 「ChatGPT 画像 2026年9月29日
 * 17_02_34.png」): the city at sunset, the logo across the sky, Nexmax on the
 * ledge pointing out over the river, and three plates — はじめる, つづきから,
 * せってい.
 *
 * 2026-09-29: every part is a delivered picture (public/img/titlesozai/, kept
 * out of git; made web-sized into public/img/title/ by
 * scripts/prepare_title_assets.mjs); nothing is drawn in CSS.
 * In the reference せってい is smaller than つづきから; here the two are the
 * same size and はじめる is the one big plate.
 *
 * The screen still comes in as a sequence — the logo drops in, Nexmax rises,
 * the plates slide up — and はじめる keeps glowing softly.
 */

const art = (name: string) => assetPath(`img/title/${name}.webp`);

const Plate = ({
  src,
  label,
  className,
  disabled = false,
  onClick,
  children,
}: {
  src: string;
  label: string;
  className: string;
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) => (
  <motion.button
    type="button"
    data-tap
    disabled={disabled}
    whileTap={disabled ? undefined : { scale: 0.95 }}
    className={`relative block disabled:opacity-60 disabled:grayscale ${className}`}
    onClick={onClick}
  >
    {children}
    <img src={src} alt={label} draggable={false} className="relative block h-auto w-full select-none" />
  </motion.button>
);

export const TitleScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);
  // A new player starts in 0話, where the one idea the game rests on —
  // writing a character does something — is shown in a few minutes.
  const seenIntro = useGameStore((s) => s.tutorials.intro);
  const canContinue = seenIntro || hasSave;
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);

  return (
    <div className="relative h-dvh overflow-hidden bg-[#2a2350]">
      <img src={art('bg')} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />

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
              animate={still ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Each plate sits at a slightly different height inside its
              picture, so the margins (in % of the width, like the plates)
              differ to leave the same visible gap between all three. */}
          <motion.div
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Plate
              src={art('btn_start')}
              label="はじめる"
              className="w-[60%]"
              onClick={() => navigate(canContinue ? mapPath : '/tutorial')}
            >
              {!still && (
                <motion.span
                  aria-hidden
                  className="absolute -inset-x-[2%] -inset-y-[12%] rounded-full"
                  style={{ background: 'radial-gradient(ellipse, rgba(255,214,110,0.9) 0%, rgba(255,190,60,0.35) 45%, transparent 72%)', filter: 'blur(10px)' }}
                  animate={{ opacity: [0.15, 0.85, 0.15] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </Plate>
            <Plate
              src={art('btn_continue')}
              label="つづきから"
              className="mt-[0.4%] w-[43%]"
              disabled={!canContinue}
              onClick={() => navigate(mapPath)}
            />
            <Plate src={art('btn_settings')} label="せってい" className="mt-[1.4%] w-[43%]" onClick={() => navigate('/settings')} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TitleScreen;
