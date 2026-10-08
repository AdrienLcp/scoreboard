import type { Plugin } from 'postcss'

/**
 * Arial and the faces drawn on its metrics: Linux ships no Arial and Android
 * only Roboto, so a fallback face that names Arial alone fails to load there
 * and the web font's swap moves every line.
 */
const ARIAL_METRIC_TWINS = ['Arial', 'Liberation Sans', 'Arimo', 'Roboto']

const ARIAL_ONLY_SOURCE = /^local\(\s*["']?Arial["']?\s*\)$/

/**
 * Runs after fontaine and widens the `src` of each fallback face it writes
 * from Arial alone to Arial's metric twins.
 */
export const metricTwinFallbacks = (): Plugin => ({
  AtRule: {
    'font-face': (rule) => {
      rule.walkDecls('src', (declaration) => {
        if (ARIAL_ONLY_SOURCE.test(declaration.value.trim())) {
          declaration.value = ARIAL_METRIC_TWINS.map(
            (face) => `local("${face}")`
          ).join(', ')
        }
      })
    }
  },
  postcssPlugin: 'metric-twin-fallbacks'
})
