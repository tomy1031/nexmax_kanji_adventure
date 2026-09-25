import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import KanaEpisode from './features/kana/KanaEpisode';
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
 * A short fade when the screen changes, so moving between menus feels like
 * one game rather than pages loading. Opacity only: a transform here would
 * become the containing block for the screens' fixed backdrops and tab bar.
 */
const ScreenFade = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
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
      <ScreenFade>
      <Routes>
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
        <Route path="/kana/:id" element={<KanaEpisode />} />
        <Route path="/equip" element={<EquipScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<TitleScreen />} />
      </Routes>
      </ScreenFade>
    </HashRouter>
  );
};

export default App;
