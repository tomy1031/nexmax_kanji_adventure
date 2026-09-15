import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Arc } from './types/kanji';
import { useGameStore } from './store/gameStore';
import TitleScreen from './features/title/TitleScreen';
import WorldMap from './features/map/WorldMap';
import StagePlayer from './features/stage/StagePlayer';
import ForgeScreen from './features/forge/ForgeScreen';
import GachaScreen from './features/gacha/GachaScreen';
import CollectionScreen from './features/collection/CollectionScreen';
import DailyScreen from './features/daily/DailyScreen';
import SettingsScreen from './features/settings/SettingsScreen';

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
        : Arc.MUKASHI;
    document.documentElement.dataset.arc = arc;
  }, [pathname]);

  return null;
};

const App = () => {
  const rollDailyIfNeeded = useGameStore((s) => s.rollDailyIfNeeded);

  // A save written yesterday must roll its daily counters before any screen
  // reads them.
  useEffect(() => {
    rollDailyIfNeeded();
  }, [rollDailyIfNeeded]);

  return (
    <HashRouter>
      <ArcTheme />
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/map" element={<WorldMap />} />
        <Route path="/map/:arc" element={<WorldMap />} />
        <Route path="/stage/:stageId" element={<StagePlayer />} />
        <Route path="/forge" element={<ForgeScreen />} />
        <Route path="/gacha" element={<GachaScreen />} />
        <Route path="/collection" element={<CollectionScreen />} />
        <Route path="/daily" element={<DailyScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<TitleScreen />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
