/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs/promises';
import svgr from '@svgr/rollup';

export default defineConfig({
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },

  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      plugins: [
        {
          name: 'load-js-files-as-jsx',
          setup(build) {
            build.onLoad({ filter: /src\\.*\.js$/ }, async (args) => ({
              loader: 'jsx',
              contents: await fs.readFile(args.path, 'utf8'),
            }));
          },
        },
      ],
    },
  },

  plugins: [svgr(), react()],
  assetsInclude: ['**/*.mp4', '**/*.mov'],

  // Dev server: expose on the network and proxy /api to the local backend so the
  // whole app is reachable behind a single public URL (cloudflared tunnel → :5173).
  // Frontend calls /api same-origin → no CORS, no second tunnel. See VITE_API_BASE_URL=/api in .env.
  server: {
    host: true, // listen on 0.0.0.0 so the tunnel can reach it
    allowedHosts: ['.trycloudflare.com'], // accept cloudflared quick-tunnel hostnames
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Backend CORS whitelists localhost:5173 — rewrite Origin so the tunnel host
        // (which isn't whitelisted) passes the backend's Origin check. Survives tunnel URL changes.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:5173');
          });
        },
      },
    },
  },
});
