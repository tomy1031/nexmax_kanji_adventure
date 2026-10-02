import { useEffect, useState } from 'react';

/**
 * True on a short screen — a phone browser with its address and tool bars
 * (an iPhone SE in Safari or Chrome leaves about 550px). Screens that must
 * not scroll, like the writing drills, pack themselves tighter there.
 */
export const useCompactHeight = (below = 700): boolean => {
  const query = `(max-height: ${below - 1}px)`;
  const [compact, setCompact] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return compact;
};
