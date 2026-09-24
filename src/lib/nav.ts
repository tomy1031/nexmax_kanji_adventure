import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

/**
 * Where "home" is for the player: the stage map of the world they last
 * played. Menus used to send everyone to むかし編, so a player in 現代編 who
 * opened the forge came back to the wrong world.
 */
export const useMapPath = (): string => {
  const arc = useGameStore((s) => s.lastArc);
  return `/map/${arc}`;
};

/**
 * Back that never leaves the game. When the screen was opened directly (a
 * bookmark, a reload) there is no in-app page behind it, and history back
 * would close the app or go to another site.
 */
export const useSafeBack = (fallback?: string) => {
  const navigate = useNavigate();
  const mapPath = useMapPath();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback ?? mapPath);
  }, [navigate, fallback, mapPath]);
};
