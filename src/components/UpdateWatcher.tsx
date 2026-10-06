import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { UPDATE_CHECK_MS, isSafeToReload } from '../lib/appUpdate';

/**
 * Switches the app to a new version by itself (lib/appUpdate.ts).
 *
 * The service worker looks for a new version when the app opens, every half
 * hour while it stays open, and whenever it comes back to the front. A new
 * version waits until the player is on a screen where nothing is lost (the
 * title, a map, the settings) and then takes over with a reload — right
 * away if they are on one already.
 */
export const UpdateWatcher = () => {
  const { pathname } = useLocation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      setInterval(check, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

  useEffect(() => {
    if (needRefresh && isSafeToReload(pathname)) void updateServiceWorker(true);
  }, [needRefresh, pathname, updateServiceWorker]);

  return null;
};

export default UpdateWatcher;
