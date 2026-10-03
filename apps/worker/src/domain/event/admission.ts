import { z } from 'zod'

import { tableNumberSchema } from '@scoreboard/protocol/identifiers'

/**
 * Who a socket turned out to be once its hello was checked. Kept on the socket
 * itself, so it survives the Durable Object hibernating between frames.
 */
export const admissionSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('display') }),
  z.object({ role: z.literal('spectator') }),
  z.object({ role: z.literal('umpire'), table: tableNumberSchema }),
  z.object({ role: z.literal('organiser') })
])
export type Admission = z.infer<typeof admissionSchema>
