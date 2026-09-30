import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { SCENES } from './scenes';
import { layerId } from './layerId';
import { RENDERED } from './rendered.generated';

describe('pre-rendered picture-book layers', () => {
  it('exist for every layer and effect, so no scene falls back to live SVG filters', () => {
    // A layer edited without re-running `npx vite-node scripts/render_scenes.ts`
    // would quietly bring the iPhone lag back (2026-09-26).
    const missing: string[] = [];
    for (const [name, scene] of Object.entries(SCENES)) {
      for (const layer of [...scene.layers, ...Object.values(scene.fx).flat()]) {
        const id = layerId(layer.svg);
        if (!RENDERED.has(id) || !existsSync(`public/img/scenes/${id}.webp`)) missing.push(`${name}/${layer.key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
