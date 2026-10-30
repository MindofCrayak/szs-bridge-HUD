import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { defineConfig } from 'vite';
import { handleAlfredRequest, handleAlfredStatus } from './server/alfredProxy.ts';

loadEnv({ path: path.resolve(import.meta.dirname, '.env.local'), quiet: true });
loadEnv({ path: path.resolve(import.meta.dirname, '../../.env.local'), quiet: true });

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'alfred-server-proxy',
        configureServer(server) {
          server.middlewares.use('/api/alfred/status', (req, res) => handleAlfredStatus(req, res));
          server.middlewares.use('/api/alfred', (req, res) => {
            void handleAlfredRequest(req, res);
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/alfred/status', (req, res) => handleAlfredStatus(req, res));
          server.middlewares.use('/api/alfred', (req, res) => {
            void handleAlfredRequest(req, res);
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT) || 3000,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
