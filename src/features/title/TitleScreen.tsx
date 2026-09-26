import { useNavigate } from 'react-router-dom';
import { useMapPath } from '../../lib/nav';
import { motion, useReducedMotion } from 'framer-motion';
import { GiCog, GiCrown, GiWorld } from 'react-icons/gi';
import { assetPath } from '../../lib/assetPath';
import { RubyText } from '../../components/ui/Ruby';
import { GameIcon } from '../../components/ui/GameIcon';
import { Backdrop } from '../../components/ui/Backdrop';
import { LogoText } from '../../components/ui/LogoText';
import { useGameStore } from '../../store/gameStore';

/**
 * Title (public/img/design/ネクマックス漢字アドベンチャー.png): the logo, Nexmax
 * with a sword, kanji tiles floating around him, three buttons, and the
 * promise of the game on a scroll — 漢字を まなぶと、ネクマックスは どんどん
 * つよくなる.
 *
 * 2026-09-24「商用 レベルに」: the screen comes in as a sequence — light
 * behind the logo, the logo drops in, Nexmax rises on his magic circle, the
 * tiles pop, the buttons slide up — and then keeps breathing: a light runs
 * through the lettering, the circle turns, specks of light drift up.
 *
 * The old key art has its title and signs painted in, with no furigana, so
 * the screen is built from the picture book instead and every kanji on it
 * carries its reading.
 */

const TILES: { ruby: string; x: string; y: string; color: string; delay: number; tilt: number }[] = [
  { ruby: '学(がく)', x: '6%', y: '31%', color: '#3aa8f0', delay: 0.9, tilt: -8 },
  { ruby: '森(もり)', x: '76%', y: '29%', color: '#46a83a', delay: 1.0, tilt: 7 },
  { ruby: '水(みず)', x: '9%', y: '48%', color: '#2f6fd6', delay: 1.1, tilt: 5 },
  { ruby: '火(ひ)', x: '78%', y: '46%', color: '#ef5a24', delay: 1.2, tilt: -6 },
];

/**
 * The magic circle under Nexmax: two rings, points of a star, no letters.
 *
 * Its glow is drawn into the picture (a wide faint ring), not a CSS
 * drop-shadow: a filter over a rotating circle is recomputed every frame, and
 * on iPhone and iPad that alone made the title screen heavy (2026-09-26
 * 「オープニングから重い」).
 */
const MagicCircle = ({ still }: { still: boolean }) => (
  <div
    className="absolute bottom-[-9%] left-1/2 aspect-square w-[135%] -translate-x-1/2"
    style={{ transform: 'scaleY(0.32)' }}
    aria-hidden
  >
    <motion.svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      style={{ willChange: 'transform' }}
      animate={still ? undefined : { rotate: 360 }}
      transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="100" cy="100" r="93" fill="none" stroke="rgba(120,220,255,0.35)" strokeWidth="14" />
      <circle cx="100" cy="100" r="92" fill="rgba(140,230,255,0.35)" stroke="#e6fbff" strokeWidth="6" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#9eeaff" strokeWidth="4" strokeDasharray="8 6" />
      <circle cx="100" cy="100" r="54" fill="none" stroke="#ffffff" strokeWidth="4" />
      <path
        d="M100 22 L118 82 L178 100 L118 118 L100 178 L82 118 L22 100 L82 82 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <circle key={i} cx={100 + Math.cos(a) * 85} cy={100 + Math.sin(a) * 85} r="3.2" fill="#fff" />;
      })}
    </motion.svg>
  </div>
);

export const TitleScreen = () => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  const showFurigana = useGameStore((s) => s.settings.furigana);
  const hasSave = useGameStore((s) => s.clearedStages.length > 0 || s.weapons.length > 0);
  // A new player starts in 0話, where the one idea the game rests on —
  // writing a character does something — is shown in a few minutes.
  const seenIntro = useGameStore((s) => s.tutorials.intro);
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);

  return (
    <div className="relative flex h-dvh flex-col items-center overflow-hidden">
      <Backdrop scene="mukashi_village" dim={0.12} motes={18} />

      {/* 空を 整える: ロゴの 後ろに 絵本の 太陽や 木が 重ならないように */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42%]"
        style={{ background: 'linear-gradient(180deg, #57b6f2 0%, rgba(125,200,245,0.92) 45%, rgba(170,220,248,0) 100%)' }}
      />

      {/* ロゴの 後ろの 光 ------------------------------------------------ */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[-14%] left-1/2 aspect-square w-[150%] -translate-x-1/2"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, rgba(255,247,200,0.55) 0deg 7deg, rgba(255,247,200,0) 7deg 18deg)',
          maskImage: 'radial-gradient(circle, #000 12%, transparent 58%)',
          WebkitMaskImage: 'radial-gradient(circle, #000 12%, transparent 58%)',
          willChange: 'transform',
        }}
        initial={{ opacity: 0 }}
        animate={still ? { opacity: 1 } : { opacity: 1, rotate: 360 }}
        transition={{ opacity: { duration: 1 }, rotate: { duration: 60, repeat: Infinity, ease: 'linear' } }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[4%] left-1/2 h-[26%] w-[90%] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(255,250,215,0.85) 0%, rgba(255,240,180,0.35) 40%, transparent 70%)' }}
      />

      {/* ロゴ ---------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: -80, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 13, delay: 0.25 }}
        className="relative z-10 mt-[max(14px,env(safe-area-inset-top))] flex flex-col items-center text-center"
      >
        <motion.span
          aria-hidden
          style={{ color: '#ffd23a', filter: 'drop-shadow(0 2px 0 #7a4a12) drop-shadow(0 0 10px rgba(255,220,100,0.9))' }}
          animate={still ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GiCrown size={40} />
        </motion.span>
        <h1 className="-mt-1 leading-none">
          <LogoText tone="blue" className="text-[min(8.2vw,34px)] leading-[1.35]">
            ネクマックスの
          </LogoText>
          <br />
          <LogoText shine showFurigana={showFurigana} className="text-[min(10.4vw,46px)] leading-[1.55]">
            漢字(かんじ)アドベンチャー
          </LogoText>
        </h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.75, duration: 0.35 }}
          className="g-ribbon -mt-1 text-[14px] leading-[1.9]"
        >
          <RubyText showFurigana={showFurigana}>まなぶほど、つよく なる！</RubyText>
        </motion.div>
      </motion.div>

      {/* 字の タイル ----------------------------------------------------- */}
      {TILES.map((t) => (
        <motion.div
          key={t.ruby}
          className="absolute z-10"
          style={{ left: t.x, top: t.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: t.delay }}
        >
          <motion.div
            className="flex h-[68px] w-[58px] items-center justify-center rounded-2xl text-[30px] leading-[1.6] font-black"
            style={{
              background: 'linear-gradient(160deg, #ffffff 0%, #f3f7ff 60%, #dfe9fb 100%)',
              border: `3px solid ${t.color}`,
              color: '#24263a',
              boxShadow: `0 0 0 3px #fff, 0 0 18px ${t.color}, 0 6px 10px rgba(0,0,0,0.25)`,
            }}
            animate={still ? { rotate: t.tilt } : { y: [0, -10, 0], rotate: [t.tilt, -t.tilt / 2, t.tilt] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: t.delay }}
          >
            <RubyText showFurigana={showFurigana}>{t.ruby}</RubyText>
          </motion.div>
        </motion.div>
      ))}

      {/* ネクマックスと 剣、魔法陣 ------------------------------------------ */}
      <motion.div
        className="relative z-10 mt-1 flex h-[27dvh] items-end justify-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.55 }}
      >
        <div
          aria-hidden
          className="absolute bottom-[-4%] left-1/2 h-[30%] w-[110%] -translate-x-1/2 rounded-[50%]"
          style={{ background: 'radial-gradient(ellipse, rgba(170,240,255,0.95) 0%, rgba(90,200,255,0.45) 45%, transparent 72%)' }}
        />
        <MagicCircle still={still} />
        <motion.div
          className="relative"
          style={{ willChange: 'transform' }}
          animate={still ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src={assetPath('img/chara/cut/guide.webp')}
            alt=""
            aria-hidden
            className="h-[23dvh] w-auto"
            style={{ filter: 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 10px 12px rgba(0,30,80,0.35))' }}
          />
          <motion.span
            className="absolute -top-7 left-[2%] -rotate-12"
            style={{ color: '#fff7d6', filter: 'drop-shadow(0 0 12px rgba(255,210,90,1)) drop-shadow(0 2px 0 #7a4a26)', willChange: 'transform' }}
            animate={still ? undefined : { rotate: [-14, -6, -14] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GameIcon name="GiBroadsword" size={72} />
          </motion.span>
        </motion.div>
      </motion.div>

      {/* ボタン ---------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="relative z-10 mt-auto flex w-full max-w-sm flex-col items-center gap-2.5 px-7"
      >
        <motion.button
          type="button"
          className="g-btn g-btn-primary g-shine w-full !min-h-[64px] text-[26px]"
          style={{ fontFamily: 'var(--font-logo)', fontWeight: 400 }}
          whileTap={{ scale: 0.96, y: 3 }}
          onClick={() => navigate(seenIntro || hasSave ? mapPath : '/tutorial')}
        >
          {/* 光る ふち: 影を 動かすと 毎コマ 描き直しに なるので、光だけの 層の 濃さを 動かす */}
          {!still && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{ boxShadow: '0 0 26px rgba(255,210,80,0.95)', willChange: 'opacity' }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
          )}
          <span aria-hidden className="relative z-10">
            ▶
          </span>
          <span className="relative z-10">{hasSave ? 'つづきから' : 'はじめる'}</span>
        </motion.button>
        <div className="flex w-full gap-2.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="g-btn g-btn-accent flex-[1.4] !px-2 text-[15px]"
            onClick={() => navigate('/map')}
          >
            <GiWorld aria-hidden size={20} />
            <RubyText showFurigana={showFurigana}>世界(せかい)を えらぶ</RubyText>
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            className="g-btn g-btn-slate flex-1 !px-2 text-[15px]"
            onClick={() => navigate('/settings')}
          >
            <GiCog aria-hidden size={20} />
            せってい
          </motion.button>
        </div>
      </motion.div>

      {/* 巻物: 学ぶと 強くなる ---------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.15 }}
        className="g-frame relative z-10 mx-3 mt-3.5 mb-[max(12px,env(safe-area-inset-bottom))] w-[calc(100%-28px)] max-w-md px-3 pt-1.5 pb-1"
      >
        <p className="text-center text-[13px] font-black">
          <RubyText showFurigana={showFurigana}>漢字(かんじ)を まなぶと、ネクマックスは どんどん つよく なる！</RubyText>
        </p>
        <div className="mt-0.5 flex items-end justify-around">
          {(
            [
              ['nexmax', 'GiWoodStick', 'はじめたころ'],
              ['guide', 'GiBroadsword', 'たくさん まなぶと'],
              ['cheer', 'GiZeusSword', 'もっと まなぶと…！'],
            ] as const
          ).map(([pose, icon, label], i) => (
            <div key={pose} className="flex items-end gap-1">
              {i > 0 && (
                <span aria-hidden className="mb-5 text-[#c9953f]">
                  ▶
                </span>
              )}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {i === 2 && (
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-0 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(255,220,90,0.8) 0%, transparent 70%)', transform: 'scale(1.5)' }}
                    />
                  )}
                  <img className="relative" src={assetPath(`img/chara/cut/${pose}.webp`)} alt="" aria-hidden style={{ height: 42 + i * 6 }} />
                  <span className="absolute -top-1 -left-2 -rotate-45" style={{ color: i === 2 ? '#f2a91a' : '#7a5a3a' }}>
                    <GameIcon name={icon} size={18 + i * 4} />
                  </span>
                </div>
                <span className="text-[10px] font-bold">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TitleScreen;
