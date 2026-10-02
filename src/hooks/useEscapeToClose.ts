import { useEffect, useRef } from 'react';

/**
 * A dialog that closes on Esc (a PC or a keyboard), and that puts the
 * keyboard on its first button when it opens, so Enter does the obvious
 * thing. Returns the ref for that button.
 */
export const useEscapeToClose = <T extends HTMLElement = HTMLButtonElement>(onClose: () => void) => {
  const firstRef = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return firstRef;
};
