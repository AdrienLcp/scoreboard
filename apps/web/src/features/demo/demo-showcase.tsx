import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { Icon } from '@/presentation/components/icon'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { DemoWall } from './demo-wall'
import { useDemoSnapshot } from './use-demo-day'

import './demo-page.sass'

const useFrameScale = () => {
  const frameRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const frame = frameRef.current
    const stage = stageRef.current

    if (frame === null || stage === null) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setScale(entry.contentRect.width / stage.offsetWidth)
      }
    })

    observer.observe(frame)

    return () => observer.disconnect()
  }, [])

  return { frameRef, scale, stageRef }
}

/**
 * Home's picture of the product for a first visit: the hall's TV on the
 * fictional day, live and shrunk, one tap opening it full size.
 */
export const DemoShowcase: React.FC = () => {
  const translate = useTranslate()
  const { nowMs, snapshot } = useDemoSnapshot()
  const { frameRef, scale, stageRef } = useFrameScale()

  return (
    <Link className='demo-showcase' href={paths.demo}>
      <div className='demo-showcase-frame' ref={frameRef}>
        <div
          aria-hidden='true'
          className='demo-showcase-stage'
          inert
          ref={stageRef}
          style={{ scale: String(scale) }}
        >
          <DemoWall nowMs={nowMs} snapshot={snapshot} />
        </div>
      </div>
      <span className='demo-showcase-line'>
        <span aria-hidden='true' className='demo-live' />
        {translate('home.showcase.live')}
        <span className='demo-showcase-open'>
          {translate('home.showcase.open')}
          <Icon name='arrowRight' />
        </span>
      </span>
    </Link>
  )
}
