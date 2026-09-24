import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { tap } from './lib/sfx';

// Every game button answers the finger with a small sound. Delegated here so
// no screen has to remember it; buttons that make their own sound (the blade,
// the forge) simply play both, and the tick is quiet enough to sit under them.
document.addEventListener(
  'pointerdown',
  (e) => {
    const el = e.target instanceof Element ? e.target.closest('.g-btn, [data-tap]') : null;
    if (el && !(el as HTMLButtonElement).disabled) tap();
  },
  { passive: true },
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
