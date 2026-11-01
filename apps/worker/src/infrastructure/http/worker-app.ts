import type { Hono } from 'hono'

import type { EventRooms } from '@/domain/event/event-rooms'
import type { WallPairings } from '@/domain/wall-pairing/wall-pairings'

export type AssetFetcher = Pick<Fetcher, 'fetch'>

/** What the composition root hands every route. */
export type WorkerVariables = {
  assets: AssetFetcher
  eventRooms: EventRooms
  wallPairings: WallPairings
}

export type WorkerApp = Hono<{ Bindings: Env; Variables: WorkerVariables }>
