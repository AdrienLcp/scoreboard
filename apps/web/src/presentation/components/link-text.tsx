import type React from 'react'
import { Fragment } from 'react'

import './link-text.sass'

/** `https://host/e/abc/umpire/CODE` → `host`, `/e/abc`, `/umpire/CODE`: a line only breaks between them. */
const segmentsOf = (url: string): string[] => {
  const [host = '', ...path] = url.replace(/^https?:\/\//, '').split('/')
  const segments = [host]

  for (let index = 0; index < path.length; index += 2) {
    segments.push(`/${path.slice(index, index + 2).join('/')}`)
  }

  return segments
}

/** A link written out in full for someone to type: no scheme, never cut inside a code. */
export const LinkText: React.FC<{ url: string }> = ({ url }) => (
  <span className='link-text' translate='no'>
    {segmentsOf(url).map((segment, index) => (
      <Fragment key={segment}>
        {index === 0 ? null : <wbr />}
        <span>{segment}</span>
      </Fragment>
    ))}
  </span>
)
