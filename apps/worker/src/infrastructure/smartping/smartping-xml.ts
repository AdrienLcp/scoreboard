import { XMLParser } from 'fast-xml-parser'

const strictUtf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false })
/** The WHATWG `iso-8859-1` label is windows-1252, which Latin-1 bytes decode under unchanged. */
const latin1 = new TextDecoder('windows-1252')

/**
 * Smartping's text, whatever its bytes: the responses declare ISO-8859-1 but
 * are sometimes UTF-8, so UTF-8 is tried strictly first and Latin-1 read when
 * it fails.
 */
export const decodeSmartpingBytes = (bytes: Uint8Array): string => {
  try {
    return strictUtf8.decode(bytes)
  } catch {
    return latin1.decode(bytes)
  }
}

/** The roots the FFTT answers a refused or broken call with, with a 200 as well as without. */
const ERROR_BODY = /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<(?:erreurs?|user)\b|\{)/

/** A body that carries an error rather than data: never cached, never parsed as a list. */
export const isSmartpingErrorBody = (text: string): boolean =>
  ERROR_BODY.test(text)

/** An `&` that starts no entity: the FFTT leaves some bare in names, which a strict parser rejects. */
const BARE_AMPERSAND = /&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g

const CDATA_SECTION = /(<!\[CDATA\[[\s\S]*?\]\]>)/

/** Bare ampersands escaped outside CDATA, where the FFTT's links keep theirs as they are. */
const escapeBareAmpersands = (text: string) =>
  text
    .split(CDATA_SECTION)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replace(BARE_AMPERSAND, '&amp;')
    )
    .join('')

/** One repeated element of a Smartping list: its fields by tag name. */
export type SmartpingItem = Readonly<Record<string, unknown>>

export type SmartpingList = Readonly<
  Record<string, readonly SmartpingItem[] | undefined>
>

const isItem = (value: unknown): value is SmartpingItem =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * The repeated elements under `<liste>`, by tag. With one result the FFTT
 * writes a single element, not a list: each tag asked for is read as a list
 * whatever its count. `null` when the text is no `<liste>`.
 */
export const parseSmartpingList = (
  text: string,
  repeatedTags: readonly string[]
): SmartpingList | null => {
  const listPaths = new Set(repeatedTags.map((tag) => `liste.${tag}`))
  const parser = new XMLParser({
    htmlEntities: true,
    ignoreAttributes: true,
    ignoreDeclaration: true,
    isArray: (_, path) => typeof path === 'string' && listPaths.has(path),
    jPath: true,
    parseTagValue: false
  })
  let parsed: unknown

  try {
    parsed = parser.parse(escapeBareAmpersands(text))
  } catch {
    return null
  }

  if (!isItem(parsed) || !('liste' in parsed)) {
    return null
  }

  const root = parsed.liste

  if (!isItem(root)) {
    return {}
  }

  return Object.fromEntries(
    repeatedTags.map((tag) => {
      const items = root[tag]

      return [tag, Array.isArray(items) ? items.filter(isItem) : []]
    })
  )
}
