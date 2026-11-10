import { md5Hex } from './md5.ts'

/** Smartping reads its timestamps as wall-clock time in Paris, whatever the clock of the caller. */
const parisWallClock = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Paris',
  year: 'numeric'
})

/** `tm`: the instant as Paris time, `YYYYMMDDHHMMSSmmm`, the 17 digits the FFTT's spec prints. */
export const smartpingTimestampOf = (instantMs: number): string => {
  const parts = Object.fromEntries(
    parisWallClock
      .formatToParts(instantMs)
      .map((part) => [part.type, part.value])
  )
  const milliseconds = String(((instantMs % 1000) + 1000) % 1000).padStart(
    3,
    '0'
  )

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}${milliseconds}`
}

/** The HMAC key: the MD5 of the password the FFTT mails, as 32 hex characters used as text. */
export const smartpingKeyOf = (password: string): string => md5Hex(password)

const hexOf = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

/** `tmc`: the timestamp signed with HMAC-SHA1 under the key, in lowercase hex. */
export const signSmartpingTimestamp = async (
  key: string,
  timestamp: string
): Promise<string> => {
  const encoder = new TextEncoder()
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { hash: 'SHA-1', name: 'HMAC' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    encoder.encode(timestamp)
  )

  return hexOf(new Uint8Array(signature))
}

const SERIAL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const SERIAL_LENGTH = 15
/** The largest multiple of the alphabet's size under 256: a byte above it is drawn again, so every character is as likely. */
const UNBIASED_BYTE_LIMIT =
  Math.floor(256 / SERIAL_ALPHABET.length) * SERIAL_ALPHABET.length

/** A Smartping serial: 15 characters A–Z 0–9, drawn once for the worker and registered with `xml_initialisation`. */
export const drawSmartpingSerial = (
  randomBytes: (count: number) => Uint8Array
): string => {
  let serial = ''

  while (serial.length < SERIAL_LENGTH) {
    for (const byte of randomBytes(SERIAL_LENGTH)) {
      if (byte < UNBIASED_BYTE_LIMIT && serial.length < SERIAL_LENGTH) {
        serial += SERIAL_ALPHABET[byte % SERIAL_ALPHABET.length]
      }
    }
  }

  return serial
}
