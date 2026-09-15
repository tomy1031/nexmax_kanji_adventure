import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this repo from a sub-path. Every runtime asset lookup
// goes through src/lib/assetPath.ts, which reads import.meta.env.BASE_URL, so
// changing this one value is enough to re-host the game anywhere.
const BASE = '/nexmax_kanji_adventure/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        id: BASE,
        name: 'ネクマックスの漢字アドベンチャー',
        short_name: '漢字アドベンチャー',
        description: '漢字を学んで、武器をふやして、つよくなろう！',
        lang: 'ja',
        theme_color: '#0b1a33',
        background_color: '#0b1a33',
        display: 'standalone',
        orientation: 'portrait',
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        dontCacheBustURLsMatching: /\.(png|jpg|jpeg|svg|webp|woff|woff2|csv|mp3|ogg|wav)$/,
        // Precache the shell plus stroke data: the writing drill is the one
        // screen that must never stall, and its JSON is small.
        globPatterns: ['**/*.{js,css,html}', 'kanji-data/**/*.json'],
        globIgnores: ['**/icon-*.png'],
        cleanupOutdatedCaches: true,
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.csv'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'csv-data-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url }) => /\.(png|jpg|jpeg|svg|webp)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 700,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('hanzi-writer-data'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kanji-data-cache',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
