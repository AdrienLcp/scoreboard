import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join } from 'node:path'

import lighthouse, {
  type Config,
  type Flags,
  type RunnerResult
} from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

import { type ColorScheme, launchMutedBrowser } from './checks/muted-browser.ts'
import {
  type RunningPreview,
  startPreviewServer
} from './checks/preview-server.ts'

/**
 * Every audited page, on a phone and on a desktop, in daylight and at night,
 * scores 100 in accessibility, best practices and SEO, and stays inside its
 * budgets, or the run fails. An app gates no performance score and no LCP:
 * simulated throttling swings them by ten points between two runs of one
 * build. They are printed for every run, to read, not to judge.
 *
 * `LIGHTHOUSE_BASE_URL` audits a deployment; otherwise the built `dist` is
 * served by `vite preview`. `LIGHTHOUSE_DEBUGGING_PORT` pins the browser's
 * debugging port; otherwise the system hands out a free one, so two projects'
 * runs never meet on it.
 */

const ROOT = join(import.meta.dirname, '..')
const REPORT_DIR = join(ROOT, 'lighthouse-reports')

/** A public site reads its pages from its sitemap instead. */
const AUDITED_PATHS = ['/']

const GATED_CATEGORIES = ['accessibility', 'best-practices', 'seo']
const MIN_SCORE = 100

/**
 * Lighthouse CI's assertion names, so a budget reads the same here as in any
 * Lighthouse documentation. Set with headroom over what the pages measure
 * today: a regression shows before a score moves.
 */
const BUDGETS_WITH_HEADROOM = {
  'cumulative-layout-shift': 0.01,
  'resource-summary:script:size': 240_000
}

/**
 * Every page is measured three times and judged on the median, the way
 * Lighthouse CI does: one simulated run swings between two runs of one build,
 * so a single run that passes proves as little as one that fails.
 */
const RUNS_PER_AUDIT = 3

type FormFactor = 'desktop' | 'mobile'

type Measure = {
  cls: number
  fcpMs: number
  lcpMs: number
  report: string
  scores: Record<string, number>
  scriptBytes: number
  tbtMs: number
}

const configFor: Record<FormFactor, Config | undefined> = {
  desktop: desktopConfig,
  mobile: undefined
}

/** A port nothing listens on, as the system hands it out. */
const freePort = (): Promise<number> =>
  new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() =>
        typeof address === 'object' && address !== null
          ? resolvePort(address.port)
          : reject(new Error('The system handed out no port'))
      )
    })
  })

const DEBUGGING_PORT =
  Number(process.env.LIGHTHOUSE_DEBUGGING_PORT) || (await freePort())

const numericValueOf = (result: RunnerResult, audit: string): number =>
  result.lhr.audits[audit]?.numericValue ?? 0

const scriptBytesIn = (result: RunnerResult): number => {
  const details = result.lhr.audits['resource-summary']?.details
  const rows = details?.type === 'table' ? details.items : []
  const scripts = rows.find((row) => row.resourceType === 'script')

  return typeof scripts?.transferSize === 'number' ? scripts.transferSize : 0
}

/** Throws on a run that measured nothing: a page that never painted is no score of 0. */
const measure = async (
  url: string,
  formFactor: FormFactor
): Promise<Measure> => {
  const flags: Flags = {
    logLevel: 'error',
    onlyCategories: ['performance', ...GATED_CATEGORIES],
    output: 'html',
    port: DEBUGGING_PORT
  }
  const result = await lighthouse(url, flags, configFor[formFactor])

  if (result === undefined) {
    throw new Error(`Lighthouse returned nothing for ${url} (${formFactor})`)
  }

  const { runtimeError } = result.lhr

  if (runtimeError !== undefined) {
    throw new Error(
      `${url} (${formFactor}): ${runtimeError.code} ${runtimeError.message}`
    )
  }

  const scores = Object.fromEntries(
    GATED_CATEGORIES.map((id) => {
      const score = result.lhr.categories[id]?.score

      if (typeof score !== 'number') {
        throw new Error(
          `${url} (${formFactor}): Lighthouse could not score ${id}`
        )
      }

      return [id, Math.round(score * 100)]
    })
  )

  return {
    cls: numericValueOf(result, 'cumulative-layout-shift'),
    fcpMs: numericValueOf(result, 'first-contentful-paint'),
    lcpMs: numericValueOf(result, 'largest-contentful-paint'),
    report: String(result.report),
    scores,
    scriptBytes: scriptBytesIn(result),
    tbtMs: numericValueOf(result, 'total-blocking-time')
  }
}

const failuresOf = (reading: Measure): string[] => [
  ...Object.entries(reading.scores)
    .filter(([, score]) => score < MIN_SCORE)
    .map(([id, score]) => `${id} ${score}`),
  ...(reading.cls > BUDGETS_WITH_HEADROOM['cumulative-layout-shift']
    ? [`cumulative-layout-shift ${reading.cls.toFixed(3)}`]
    : []),
  ...(reading.scriptBytes >
  BUDGETS_WITH_HEADROOM['resource-summary:script:size']
    ? [
        `resource-summary:script:size ${Math.round(reading.scriptBytes / 1000)} kB`
      ]
    : [])
]

const timingsOf = ({ fcpMs, lcpMs, tbtMs }: Measure): string =>
  `FCP ${Math.round(fcpMs)} ms · LCP ${Math.round(lcpMs)} ms · TBT ${Math.round(tbtMs)} ms`

const median = (values: number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0

const medianOf = (readings: Measure[]): Measure => ({
  cls: median(readings.map(({ cls }) => cls)),
  fcpMs: median(readings.map(({ fcpMs }) => fcpMs)),
  lcpMs: median(readings.map(({ lcpMs }) => lcpMs)),
  report: readings.at(-1)?.report ?? '',
  scores: Object.fromEntries(
    GATED_CATEGORIES.map((id) => [
      id,
      median(readings.map(({ scores }) => scores[id] ?? 0))
    ])
  ),
  scriptBytes: median(readings.map(({ scriptBytes }) => scriptBytes)),
  tbtMs: median(readings.map(({ tbtMs }) => tbtMs))
})

const reportNameFor = (
  path: string,
  formFactor: FormFactor,
  scheme: ColorScheme
) =>
  `${path.slice(1).replaceAll('/', '-') || 'root'}.${formFactor}.${scheme}.html`

const auditEveryPage = async (origin: string): Promise<string[]> => {
  const failures: string[] = []

  await mkdir(REPORT_DIR, { recursive: true })

  for (const colorScheme of ['light', 'dark'] satisfies ColorScheme[]) {
    const browser = await launchMutedBrowser({
      colorScheme,
      debuggingPort: DEBUGGING_PORT
    })

    try {
      for (const formFactor of ['mobile', 'desktop'] satisfies FormFactor[]) {
        for (const path of AUDITED_PATHS) {
          const label = `${path} ${formFactor} ${colorScheme}`
          const readings: Measure[] = []

          while (readings.length < RUNS_PER_AUDIT) {
            const reading = await measure(`${origin}${path}`, formFactor)
            readings.push(reading)
            console.info(
              `     ${label.padEnd(24)} run ${readings.length}: ${timingsOf(reading)}`
            )
          }

          const reading = medianOf(readings)
          const broken = failuresOf(reading)

          console.info(
            `${broken.length === 0 ? 'ok  ' : 'FAIL'} ${label.padEnd(24)} CLS ${reading.cls.toFixed(3)} · JS ${Math.round(reading.scriptBytes / 1000)} kB${broken.length === 0 ? '' : ` · ${broken.join(', ')}`}`
          )

          if (broken.length > 0) {
            failures.push(`${label}: ${broken.join(', ')}`)
          }
          await writeFile(
            join(REPORT_DIR, reportNameFor(path, formFactor, colorScheme)),
            reading.report
          )
        }
      }
    } finally {
      await browser.close()
    }
  }

  return failures
}

const baseUrl = process.env.LIGHTHOUSE_BASE_URL
const local: RunningPreview | undefined =
  baseUrl === undefined ? await startPreviewServer() : undefined

try {
  const failures = await auditEveryPage(baseUrl ?? local?.origin ?? '')

  if (failures.length > 0) {
    console.error(
      `\n${failures.length} audit(s) under the bar, reports in lighthouse-reports/:\n${failures.join('\n')}`
    )
    process.exitCode = 1
  } else {
    console.info(
      '\nEvery page meets its scores and budgets, on both screens and in both themes.'
    )
  }
} catch (error) {
  console.error('\nThe Lighthouse gate could not measure:', error)
  process.exitCode = 1
} finally {
  await local?.close()
}
