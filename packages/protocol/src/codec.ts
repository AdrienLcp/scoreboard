import type { z } from 'zod'

export type DecodeResult<TMessage> =
  | { message: TMessage; status: 'success' }
  | { reason: string; status: 'failure' }

/**
 * A WebSocket frame is an untrusted string, so both ends run every inbound
 * frame through the schema of what they expect. Malformed JSON and well-formed
 * JSON that is not a message collapse into one `failure`: the caller rejects
 * the frame either way.
 */
export const decodeMessage = <TMessage>(
  schema: z.ZodType<TMessage>,
  raw: string
): DecodeResult<TMessage> => {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(raw)
  } catch {
    return { reason: 'frame is not valid JSON', status: 'failure' }
  }

  const validated = schema.safeParse(parsedJson)

  if (!validated.success) {
    return {
      reason: validated.error.issues.map(describeIssue).join('; '),
      status: 'failure'
    }
  }

  return { message: validated.data, status: 'success' }
}

export const encodeMessage = (message: unknown): string =>
  JSON.stringify(message)

/**
 * Encodes through the schema rather than around it: Zod drops unknown keys,
 * so a view that carries more than its role may see loses the extra fields
 * instead of leaking them. Throws on a message that breaks its own schema,
 * which is a bug in the sender.
 */
export const encodeChecked = <TMessage>(
  schema: z.ZodType<TMessage>,
  message: TMessage
): string => JSON.stringify(schema.parse(message))

/** The path and the rule only: a received value can be a name, and this ends up in logs. */
const describeIssue = (issue: z.core.$ZodIssue): string =>
  `${issue.path.join('.') || '<root>'}: ${issue.code}`
