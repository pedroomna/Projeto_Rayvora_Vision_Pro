import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Subcaminho usado apenas quando o build é publicado no GitHub Pages
// (https://<usuario>.github.io/Rayvora-Vision-Pro/). Para dev local e
// para `npm start` (servido pelo Express na raiz), a base deve ser '/'.
const GH_PAGES_BASE = '/Rayvora-Vision-Pro/';

export default defineConfig(({ command }) => {
  // Só usa o subcaminho do GitHub Pages quando explicitamente pedido via
  // variável de ambiente no momento do build de deploy, ex:
  //   GITHUB_PAGES=true npm run build
  const isGitHubPagesBuild = command === 'build' && process.env.GITHUB_PAGES === 'true';
  const base = isGitHubPagesBuild ? GH_PAGES_BASE : '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico'],
        manifestFilename: 'manifest.webmanifest',
        manifest: {
          name: 'Rayvora Vision Pro',
          short_name: 'Rayvora',
          description: 'Sistema de estimativa de peso e acompanhamento de bovinos com visão computacional',
          theme_color: '#1e3a8a',
          background_color: '#0e1320',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            // Sem "/" na frente: assim o vite-plugin-pwa aplica a `base`
            // corretamente tanto em dev quanto no build do GitHub Pages.
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Mantém o app usável (shell em cache) mesmo com conexão instável.
          // Isso NÃO faz o /api/analyze funcionar offline — esse endpoint
          // sempre precisa do ml-service acessível, já que a estimativa de
          // peso depende do modelo rodando no servidor.
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Adiciona o prefixo do subdiretório do GitHub Pages aos URLs no
          // manifesto do Service Worker. Esta é a correção crucial para que
          // o PWA encontre os arquivos (JS, CSS) após a instalação.
          modifyURLPrefix: isGitHubPagesBuild ? { '': GH_PAGES_BASE } : {},
        },
        devOptions: {
          // Permite testar o PWA (instalabilidade, manifest) durante o
          // `npm run dev`, não só no build de produção.
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
      // Configuração de HMR e Watch revisada para garantir estabilidade.
      // A configuração anterior podia causar a "tela branca" ao desativar
      // o file watching de forma muito agressiva. Esta nova abordagem é mais segura.
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'ws',
        host: 'localhost',
      },
      watch: {
        ignored: ['**/ml-service/**'],
      },
      // Removido o proxy de '/api' -> 'http://localhost:3000': como este
      // Vite roda em "middleware mode" dentro do próprio server.ts (Express),
      // as rotas /api/* já são atendidas diretamente pelo Express no mesmo
      // processo e porta. Fazer proxy de volta para a própria porta só faz
      // sentido se alguém rodar `vite` isoladamente (sem o Express) — e
      // nesse caso apontaria pra si mesmo, causando erro de conexão.
    },
  };
});