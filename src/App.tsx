import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, UNSAFE_LocationContext, useLocation, useNavigationType } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DoorPanel } from './components/ui/Doors';
import { useStillDoors } from './hooks/useStillDoors';
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
// Versus brings the network library; it is fetched only when that screen opens.
const VersusScreen = lazy(() => import('./features/versus/VersusScreen'));
import WordBook from './features/words/WordBook';
import TutorialStage from './features/tutorial/TutorialStage';
import PrologueScreen from './features/prologue/PrologueScreen';
import KanaEpisode from './features/kana/KanaEpisode';
import MojiEpisodeScreen from './features/moji/MojiEpisodeScreen';
import EquipScreen from './features/equip/EquipScreen';
import ZukanScreen from './features/zukan/ZukanScreen';

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
            <Route path="/versus" element={<Suspense fallback={null}><VersusScreen /></Suspense>} />
            <Route path="/words" element={<WordBook />} />
            <Route path="/tutorial" element={<TutorialStage />} />
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
