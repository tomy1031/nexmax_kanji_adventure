import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, UNSAFE_LocationContext, useLocation, useNavigationType } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { GiCog } from 'react-icons/gi';
import { preloadScreens } from './lib/preload';
import { Arc } from './types/kanji';
import { useGameStore } from './store/gameStore';
import TitleScreen from './features/title/TitleScreen';
import ArcSelect from './features/map/ArcSelect';
import StageSelect from './features/map/StageSelect';
import StagePlayer from './features/stage/StagePlayer';
import ForgeScreen from './features/forge/ForgeScreen';
import GachaScreen from './features/gacha/GachaScreen';
import CollectionScreen from './features/collection/CollectionScreen';
import DailyScreen from './features/daily/DailyScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import VersusScreen from './features/versus/VersusScreen';
import WordBook from './features/words/WordBook';
import TutorialStage from './features/tutorial/TutorialStage';
import PrologueScreen from './features/prologue/PrologueScreen';
import KanaEpisode from './features/kana/KanaEpisode';
import MojiEpisodeScreen from './features/moji/MojiEpisodeScreen';
import EquipScreen from './features/equip/EquipScreen';

/**
 * Routing is hash-based: the game ships to GitHub Pages, which has no
 * server-side rewrite, so a path-based route would 404 on refresh.
 */

/** The arc drives the whole palette, so it is set on <html> rather than per-screen. */
const ArcTheme = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const arc = pathname.includes('/gendai')
      ? Arc.GENDAI
      : pathname.includes('/mirai')
        ? Arc.MIRAI
        : pathname.includes('/moji') || pathname.includes('/kana/')
          ? Arc.MOJI
          : Arc.MUKASHI;
    document.documentElement.dataset.arc = arc;
  }, [pathname]);

  return null;
};

/**
 * Moving between screens the way a game changes scene: a pair of doors closes
 * over the screen being left, the next screen is put in behind them, and they
 * open on it once its pictures are ready — instead of a page blanking and
 * loading (2026-09-30「webアプリではなくゲームなので…ワンページのように
 * スムーズに」). It replaces the old short fade.
 *
 * Only the doors move, by transform, with no filter (moving filters are what
 * made iPhone and iPad heavy, 2026-09-26). The screens are never transformed:
 * a transform would become the containing block for their fixed backdrops and
 * tab bars. The app's first screen appears without doors; with reduced motion
 * the doors become a quick fade.
 */
const CLOSE = 0.16;
const OPEN = 0.26;
/** The longest the doors wait for the next screen's pictures. */
const WAIT_MS = 200;

const doorVariants = (side: -1 | 1) => ({
  shut: { x: '0%', visibility: 'visible' as const, transition: { duration: CLOSE, ease: 'easeIn' as const } },
  open: { x: `${side * 101}%`, transition: { duration: OPEN, ease: 'easeOut' as const }, transitionEnd: { visibility: 'hidden' as const } },
});
const fadeVariants = {
  shut: { opacity: 1, visibility: 'visible' as const, transition: { duration: 0.12 } },
  open: { opacity: 0, transition: { duration: 0.18 }, transitionEnd: { visibility: 'hidden' as const } },
};
const emblemVariants = {
  shut: { opacity: 1, transition: { duration: CLOSE } },
  open: { opacity: 0, transition: { duration: OPEN * 0.5 } },
};

/** Deep night blue with lamplight at the seam and brass on the edge. */
const DOOR_BG =
  'radial-gradient(ellipse 60% 45% at var(--seam) 50%, rgba(255,170,70,0.22) 0%, rgba(255,170,70,0) 70%), repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 16px), linear-gradient(180deg, #1c1740 0%, #120e2b 60%, #0b0920 100%)';

const Curtain = ({ still }: { still: boolean }) =>
  still ? (
    <motion.div aria-hidden variants={fadeVariants} className="fixed inset-0 z-[200] bg-[#120e2b]" />
  ) : (
    <>
      <motion.div
        aria-hidden
        variants={doorVariants(-1)}
        className="fixed inset-y-0 left-0 z-[200] w-1/2"
        style={{ background: DOOR_BG, ['--seam' as string]: '100%', boxShadow: 'inset -4px 0 0 #d9a44c, inset -10px 0 0 rgba(0,0,0,0.35)', willChange: 'transform' }}
      />
      <motion.div
        aria-hidden
        variants={doorVariants(1)}
        className="fixed inset-y-0 right-0 z-[200] w-1/2"
        style={{ background: DOOR_BG, ['--seam' as string]: '0%', boxShadow: 'inset 4px 0 0 #d9a44c, inset 10px 0 0 rgba(0,0,0,0.35)', willChange: 'transform' }}
      />
      <motion.div
        aria-hidden
        variants={emblemVariants}
        className="pointer-events-none fixed top-1/2 left-1/2 z-[201] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#d9a44c] text-[#ffcf6e]"
        style={{ background: 'radial-gradient(circle, #3a2a52 0%, #16122e 75%)' }}
      >
        <GiCog className="h-14 w-14" />
      </motion.div>
    </>
  );

/** The first screen of a launch just appears; every one after it comes through the doors. */
let appeared = false;

/**
 * One screen between the doors. While it leaves, it keeps seeing the location
 * it was opened with (so it does not re-render as the next screen for the
 * moment the doors take to close).
 */
const Scene = ({ location, instant, still, children }: { location: Location; instant: boolean; still: boolean; children: ReactNode }) => {
  const navigationType = useNavigationType();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(instant);

  useEffect(() => {
    appeared = true;
  }, []);

  useEffect(() => {
    if (ready) return;
    let live = true;
    const pictures = Array.from(ref.current?.querySelectorAll('img') ?? []);
    const loaded = Promise.all(pictures.map((img) => img.decode().catch(() => undefined)));
    const cap = new Promise((resolve) => setTimeout(resolve, WAIT_MS));
    void Promise.race([loaded, cap]).then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, [ready]);

  return (
    <UNSAFE_LocationContext.Provider value={{ location, navigationType }}>
      <motion.div ref={ref} initial="shut" animate={ready ? 'open' : 'shut'} exit="shut" variants={{ shut: { opacity: 1 }, open: { opacity: 1 } }}>
        {children}
        <Curtain still={still} />
      </motion.div>
    </UNSAFE_LocationContext.Provider>
  );
};

const ScreenDoors = ({ children }: { children: (location: Location) => ReactNode }) => {
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const settingReduced = useGameStore((s) => s.settings.reducedMotion);
  const still = Boolean(prefersReduced || settingReduced);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Scene key={location.pathname} location={location} instant={!appeared} still={still}>
        {children(location)}
      </Scene>
    </AnimatePresence>
  );
};

const App = () => {
  const rollDailyIfNeeded = useGameStore((s) => s.rollDailyIfNeeded);

  // A save written yesterday must roll its daily counters before any screen
  // reads them.
  useEffect(() => {
    rollDailyIfNeeded();
  }, [rollDailyIfNeeded]);

  // The forge's pictures are the heaviest a player opens from the map.
  useEffect(() => {
    preloadScreens(['forge']);
  }, []);

  return (
    <HashRouter>
      <ArcTheme />
      <ScreenDoors>
        {(location) => (
          <Routes location={location}>
            <Route path="/" element={<TitleScreen />} />
            <Route path="/map" element={<ArcSelect />} />
            <Route path="/map/:arc" element={<StageSelect />} />
            <Route path="/stage/:stageId" element={<StagePlayer />} />
            <Route path="/forge" element={<ForgeScreen />} />
            <Route path="/gacha" element={<GachaScreen />} />
            <Route path="/collection" element={<CollectionScreen />} />
            <Route path="/daily" element={<DailyScreen />} />
            <Route path="/versus" element={<VersusScreen />} />
            <Route path="/words" element={<WordBook />} />
            <Route path="/tutorial" element={<TutorialStage />} />
            <Route path="/prologue" element={<PrologueScreen />} />
            <Route path="/kana/:id" element={<KanaEpisode />} />
            <Route path="/moji/:id" element={<MojiEpisodeScreen />} />
            <Route path="/equip" element={<EquipScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<TitleScreen />} />
          </Routes>
        )}
      </ScreenDoors>
    </HashRouter>
  );
};

export default App;
