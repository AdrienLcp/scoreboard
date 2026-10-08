import { resolve } from 'node:path'

import { metricTwins } from '@adrienlcp/styles/metric-twins'
import optimizeLocales from '@react-aria/optimize-locales-plugin'
import react from '@vitejs/plugin-react'
import fontaine from 'fontaine/postcss'
import { defineConfig } from 'vite'

import {
  API_PREFIX,
  SOCKET_PREFIX
} from '../../packages/protocol/src/routes.ts'
import { searchEnginePlugin } from './search-engine-plugin.ts'
import { REGIONAL_LOCALES } from './src/presentation/i18n/regional-locales.ts'

const WORKER_ORIGIN = 'http://127.0.0.1:8788'

/**
 * Each face gets a fallback face of its own, a local font scaled to the same
 * metrics: text paints at once in it and keeps its place when the real face
 * swaps in.
 */
const metricMatchedFallbackFaces = fontaine({
  fallbacks: ['Arial'],
  resolvePath: (path) => resolve(import.meta.dirname, 'public', `.${path}`)
})

export default defineConfig({
  css: {
    postcss: { plugins: [metricMatchedFallbackFaces, metricTwins()] }
  },
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
