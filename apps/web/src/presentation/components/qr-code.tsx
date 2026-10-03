import type React from 'react'

import { type QrModules, qrModulesFor } from '@/infrastructure/qr/qr-code'

import './qr-code.sass'

const QUIET_ZONE = 2

const runPath = ({ from, to, y }: { from: number; to: number; y: number }) =>
  `M${from} ${y}h${to - from}v1h${from - to}z`

/** One path of horizontal runs: a few hundred segments instead of a rect per module. */
const darkRunsPath = (modules: QrModules): string =>
  modules
    .flatMap((row, y) => {
      const runs: string[] = []
      let start: number | null = null

      row.forEach((isDark, x) => {
        if (isDark && start === null) {
          start = x
        }

        if (!isDark && start !== null) {
          runs.push(runPath({ from: start, to: x, y }))
          start = null
        }
      })

      if (start !== null) {
        runs.push(runPath({ from: start, to: row.length, y }))
      }

      return runs
    })
    .join('')

type QrCodeProps = {
  /** What the code opens, read by assistive technology. */
  label: string
  url: string
}

/** A scannable code on its own white tile, whatever the screen around it. */
export const QrCode: React.FC<QrCodeProps> = ({ label, url }) => {
  const modules = qrModulesFor(url)

  if (modules.status === 'failure') {
    return null
  }

  const size = modules.data.length + QUIET_ZONE * 2

  return (
    <span className='qr-code'>
      <svg
        aria-label={label}
        role='img'
        shapeRendering='crispEdges'
        viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${size} ${size}`}
      >
        <path d={darkRunsPath(modules.data)} />
      </svg>
    </span>
  )
}
