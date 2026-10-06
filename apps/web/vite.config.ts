import { resolve } from 'node:path'

import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { API_PREFIX, SOCKET_PREFIX } from '../../packages/protocol/src/routes'
import { searchEnginePlugin } from './search-engine-plugin'
import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales'

const WORKER_ORIGIN = 'http://127.0.0.1:8788'

export default defineConfig({
  plugins: [
    react({ compiler: { logDiagnostics: true } }),
    {
      ...optimizeLocales.vite({ locales: Object.values(REGIONAL_LOCALES) }),
      enforce: 'pre'
    },
    searchEnginePlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src')
    }
  },
  server: {
    // Umpires join from their phones over the hall's network.
    host: true,
    port: 5391,
    // Same origin in dev as in production, where the worker serves both.
    proxy: {
      [API_PREFIX]: { changeOrigin: true, target: WORKER_ORIGIN },
      [SOCKET_PREFIX]: {
        target: WORKER_ORIGIN.replace(/^http/, 'ws'),
        ws: true
      }
    },
    strictPort: true
  }
})
