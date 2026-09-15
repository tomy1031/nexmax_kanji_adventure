import { createElement } from 'react';
import { GAME_ICONS } from '../../lib/gameIcons';

interface GameIconProps {
  /** Name from the registry, e.g. "GiBroadsword". */
  name: string;
  size?: number;
  className?: string;
  /** Shown when the name is not in the registry. */
  fallback?: string;
}

/**
 * Renders a Game Icons glyph by name.
 *
 * Wrapping the lookup in a component keeps the resolved icon out of the
 * caller's render body — looking one up into a local `const Icon = …` and
 * rendering `<Icon />` reads as a component defined during render, which
 * remounts the subtree on every change.
 *
 * `createElement` rather than JSX for the same reason: the registry entry is a
 * stable module-level component picked by name, not a component being defined
 * here, and going through createElement says so.
 */
export const GameIcon = ({ name, size = 24, className, fallback = '⚔' }: GameIconProps) => {
  const entry = GAME_ICONS[name];
  if (!entry) return <span className={className}>{fallback}</span>;
  return createElement(entry, { size, className });
};

export default GameIcon;
