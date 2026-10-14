import { useState } from 'react'

import { sendsGlobalPrivacyControl } from '@/infrastructure/browser'
import {
  readAnalyticsOptOut,
  writeAnalyticsOptOut
} from '@/infrastructure/storage/analytics-opt-out-storage'

/**
 * Whether this browser's visits are counted: by the visitor's choice here,
 * by Global Privacy Control, or not at all where storage is blocked.
 */
export type MeasurementChoice =
  | 'counted'
  | 'refused'
  | 'refused-by-browser'
  | 'storage-blocked'

const readMeasurementChoice = (): MeasurementChoice => {
  if (sendsGlobalPrivacyControl()) {
    return 'refused-by-browser'
  }

  const optOut = readAnalyticsOptOut()

  if (optOut.status === 'failure') {
    return 'storage-blocked'
  }

  return optOut.data ? 'refused' : 'counted'
}

export const useMeasurementChoice = () => {
  const [choice, setChoice] = useState(readMeasurementChoice)
  const [hasSaveFailed, setHasSaveFailed] = useState(false)

  const setCounted = (isCounted: boolean): void => {
    const saved = writeAnalyticsOptOut(!isCounted)

    setHasSaveFailed(saved.status === 'failure')

    if (saved.status === 'success') {
      setChoice(isCounted ? 'counted' : 'refused')
    }
  }

  return { choice, hasSaveFailed, setCounted }
}
