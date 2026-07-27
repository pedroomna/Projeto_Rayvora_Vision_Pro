import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifest: {
          name: 'Rayvora Vision Pro',
          short_name: 'Rayvora',
          description: 'Sistema de estimativa de peso e acompanhamento de bovinos com visão computacional',
          theme_color: '#1e3a8a',
          background_color: '#0e1320',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/maskable-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Keeps the app usable (cached shell) even with a flaky connection.
          // Note: this does NOT make /api/analyze work offline — that endpoint
          // always needs the ml-service reachable, since weight prediction
          // requires the model to run on the server.
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
        devOptions: {
          // Lets you test the PWA (installability, manifest) during `npm run dev`,
          // not only in the production build.
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Also ignore the ml-service folder (Python venv + model files) so changes made
      // by the Python process there don't trigger unnecessary front-end reloads.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/ml-service/**'],
      },
      // Adicionado para corrigir o erro "Failed to fetch" em desenvolvimento.
      // O proxy redireciona as chamadas de API do frontend (ex: /api/analyze)
      // para o servidor Express que está rodando no mesmo processo.
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});