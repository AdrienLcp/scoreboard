import { randomBytes } from 'node:crypto'

import { nowMs } from '../src/infrastructure/clock.ts'
import {
  drawSmartpingSerial,
  signSmartpingTimestamp,
  smartpingKeyOf,
  smartpingTimestampOf
} from '../src/infrastructure/smartping/smartping-signature.ts'

/**
 * Draws the worker's Smartping serial and registers it with
 * `xml_initialisation`, once, when the FFTT's key arrives. The app ID and the
 * password are read from `.dev.vars` (or the environment), never from the
 * command line, so they stay out of the shell's history.
 */

const INITIALISATION_URL =
  'https://apiv2.fftt.com/mobile/pxml/xml_initialisation.php'

const appId = process.env.SMARTPING_APP_ID?.trim() ?? ''
const password = process.env.SMARTPING_PASSWORD ?? ''

if (appId === '' || password === '') {
  console.error(
    'Put SMARTPING_APP_ID and SMARTPING_PASSWORD in apps/worker/.dev.vars, then run this again.'
  )
  process.exit(1)
}

const serial = drawSmartpingSerial((count) => randomBytes(count))
const timestamp = smartpingTimestampOf(nowMs())
const url = new URL(INITIALISATION_URL)
url.searchParams.set('id', appId)
url.searchParams.set('serie', serial)
url.searchParams.set('tm', timestamp)
url.searchParams.set(
  'tmc',
  await signSmartpingTimestamp(smartpingKeyOf(password), timestamp)
)

const response = await fetch(url)
const body = await response.text()
const granted = response.ok && /<appli>\s*1\s*<\/appli>/.test(body)

if (!granted) {
  console.error(
    `The FFTT refused the serial (HTTP ${response.status}):\n${body.slice(0, 500)}`
  )
  process.exit(1)
}

console.info(`Serial registered: ${serial}

1. Add it to apps/worker/.dev.vars:
   SMARTPING_SERIAL=${serial}

2. Set the three secrets on the deployed worker (each command asks for its value):
   pnpm --filter @scoreboard/worker exec wrangler secret put SMARTPING_APP_ID
   pnpm --filter @scoreboard/worker exec wrangler secret put SMARTPING_PASSWORD
   pnpm --filter @scoreboard/worker exec wrangler secret put SMARTPING_SERIAL
`)
