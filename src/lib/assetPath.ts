/**
 * The game is served from a sub-path on GitHub Pages, so no runtime asset URL
 * may be written as a bare absolute path. Everything that reaches the network
 * goes through here.
 */
const BASE = import.meta.env.BASE_URL ?? '/';

export const assetPath = (path: string): string => {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE}${clean}`;
};
