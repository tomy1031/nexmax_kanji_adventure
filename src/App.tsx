import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, UNSAFE_LocationContext, useLocation, useNavigationType, useParams } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DoorPanel } from './components/ui/Doors';
import { useStillDoors } from './hooks/useStillDoors';
import { preloadScreens } from './lib/preload';
import { Arc } from './types/kanji';
import { useGameStore } from './store/gameStore';
import TitleScreen from './features/title/TitleScreen';
import MojiRouteMap from './features/map/MojiRouteMap';
import ForgeScreen from './features/forge/ForgeScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import PrologueScreen from './features/prologue/PrologueScreen';
import KanaEpisode from './features/kana/KanaEpisode';
import MojiEpisodeScreen from './features/moji/MojiEpisodeScreen';
import EquipScreen from './features/equip/EquipScreen';
import ZukanScreen from './features/zukan/ZukanScreen';

/**
 * Screens outside 文字が 消えた 町 — the older arcs (closing), versus, the word
 * book — are separate files, so the first load carries only what a player
 * meets first. They are fetched quietly once the title is up (warmLater), so
 * opening one later does not wait.
 */
const later = {
  arcSelect: () => import('./features/map/ArcSelect'),
  stageSelect: () => import('./features/map/StageSelect'),
  stagePlayer: () => import('./features/stage/StagePlayer'),
  gacha: () => import('./features/gacha/GachaScreen'),
  collection: () => import('./features/collection/CollectionScreen'),
  daily: () => import('./features/daily/DailyScreen'),
  // Versus brings the network library.
  versus: () => import('./features/versus/VersusScreen'),
  words: () => import('./features/words/WordBook'),
  tutorial: () => import('./features/tutorial/TutorialStage'),
};
const ArcSelect = lazy(later.arcSelect);
const StageSelect = lazy(later.stageSelect);
const StagePlayer = lazy(later.stagePlayer);
const GachaScreen = lazy(later.gacha);
const CollectionScreen = lazy(later.collection);
const DailyScreen = lazy(later.daily);
const VersusScreen = lazy(later.versus);
const WordBook = lazy(later.words);
const TutorialStage = lazy(later.tutorial);

const warmLater = () => {
  const run = () => Object.values(later).forEach((load) => void load().catch(() => {}));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 6000 });
  else setTimeout(run, 3000);
};

/** /map/moji is the town's stage select (in the first load); the older arcs' maps come later. */
const MapRoute = () => {
  const { arc } = useParams<{ arc: string }>();
  return arc === 'moji' ? <MojiRouteMap /> : <StageSelect />;
};

const Later = ({ children }: { children: ReactNode }) => <Suspense fallback={null}>{children}</Suspense>;

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

/** The first screen of a launch just appears; every one after it comes through the doors (components/ui/Doors.tsx). */
let appeared = false;

/**
 * One screen between the doors. While it leaves, it keeps seeing the location
 * it was opened with (so it does not re-render as the next screen for the
 * moment the doors take to close).
 */
const Scene = ({ location, instant, still, children }: { location: Location; instant: boolean; still: boolean; children: ReactNode }) => {
  const navigationType = useNavigationType();
  return (
    <UNSAFE_LocationContext.Provider value={{ location, navigationType }}>
      <DoorPanel instant={instant} still={still} onShown={() => (appeared = true)}>
        {children}
      </DoorPanel>
    </UNSAFE_LocationContext.Provider>
  );
};

const ScreenDoors = ({ children }: { children: (location: Location) => ReactNode }) => {
  const location = useLocation();
  const still = useStillDoors();
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
    warmLater();
  }, []);

  return (
    <HashRouter>
      <ArcTheme />
      <ScreenDoors>
        {(location) => (
          <Routes location={location}>
            <Route path="/" element={<TitleScreen />} />
            <Route path="/map" element={<Later><ArcSelect /></Later>} />
            <Route path="/map/:arc" element={<Later><MapRoute /></Later>} />
            <Route path="/stage/:stageId" element={<Later><StagePlayer /></Later>} />
            <Route path="/forge" element={<ForgeScreen />} />
            <Route path="/gacha" element={<Later><GachaScreen /></Later>} />
            <Route path="/collection" element={<Later><CollectionScreen /></Later>} />
            <Route path="/daily" element={<Later><DailyScreen /></Later>} />
            <Route path="/versus" element={<Later><VersusScreen /></Later>} />
            <Route path="/words" element={<Later><WordBook /></Later>} />
            <Route path="/tutorial" element={<Later><TutorialStage /></Later>} />
            <Route path="/prologue" element={<PrologueScreen />} />
            <Route path="/kana/:id" element={<KanaEpisode />} />
            <Route path="/moji/:id" element={<MojiEpisodeScreen />} />
            <Route path="/equip" element={<EquipScreen />} />
            <Route path="/zukan" element={<ZukanScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<TitleScreen />} />
          </Routes>
        )}
      </ScreenDoors>
    </HashRouter>
  );
};

export default App;
