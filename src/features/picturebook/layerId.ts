/**
 * A stable id for a layer's SVG (FNV-1a, 32 bit). scripts/render_scenes.ts
 * names each pre-rendered bitmap by it, and PictureBook looks the bitmap up
 * by it, so a layer that changes gets a new id and never shows a stale file.
 */
export const layerId = (svg: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < svg.length; i++) {
    h ^= svg.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
};
