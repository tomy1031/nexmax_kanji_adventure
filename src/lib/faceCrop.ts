import { FACE_CROPS } from '../data/faceCrops.generated';
import { CARD_FACES } from '../data/cardFaces.generated';
import { assetPath } from './assetPath';

/**
 * A portrait placed in a square frame of `px` so its face fills it
 * (scripts/face_crops.mjs found where the face is on each picture — the story's
 * portraits and the companions' cards). `widen`
 * shows that much more around the face. A picture it does not know is just
 * the background image, left to the frame's own CSS.
 */
export const faceStyle = (src: string, px: number, widen = 1): Record<string, string> => {
  const style: Record<string, string> = { backgroundImage: `url(${assetPath(src)})`, backgroundRepeat: 'no-repeat' };
  const crop = FACE_CROPS[src] ?? CARD_FACES[src];
  if (!crop) return style;
  const [x, y, size, aspect] = crop;
  const w = px / Math.min(1, size * widen);
  const h = w * aspect;
  return { ...style, backgroundSize: `${w}px ${h}px`, backgroundPosition: `${px / 2 - x * w}px ${px / 2 - y * h}px` };
};
