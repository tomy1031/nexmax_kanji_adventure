import { useEffect, useState } from 'react';

/**
 * Size for the writing canvas: as large as fits, never so large that the
 * surrounding chrome (rep counter, hint button) gets pushed off a phone.
 *
 * Ported from kanji_go.
 */
export const useCanvasSize = (maxSize = 300, heightRatio = 0.4, widthMargin = 64): number => {
  const compute = () =>
    Math.max(
      160,
      Math.min(maxSize, window.innerWidth - widthMargin, Math.floor(window.innerHeight * heightRatio)),
    );

  const [size, setSize] = useState(compute);

  useEffect(() => {
    const onResize = () => setSize(compute());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSize, heightRatio, widthMargin]);

  return size;
};
