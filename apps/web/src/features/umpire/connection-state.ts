import type { SocketStatus } from '@/infrastructure/messaging/use-event-socket'

/**
 * What the umpire needs to know about the network, by what to do about it:
 * - `online` — every point has reached the server
 * - `sending` — connected, points on their way
 * - `offline` — scoring keeps working, points wait on this device
 * - `refused` — the server turned the console away; reload or check the code
 */
export type ConnectionState =
  | { kind: 'online' }
  | { kind: 'sending'; pending: number }
  | { kind: 'offline'; pending: number }
  | { kind: 'refused' }

export const connectionStateOf = ({
  pending,
  status
}: {
  pending: number
  status: SocketStatus
}): ConnectionState => {
  switch (status) {
    case 'refused':
      return { kind: 'refused' }
    case 'open':
      return pending === 0 ? { kind: 'online' } : { kind: 'sending', pending }
    case 'closed':
    case 'connecting':
      return { kind: 'offline', pending }
  }
}
