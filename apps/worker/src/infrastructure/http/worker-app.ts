import type { Hono } from 'hono'

import type { Clubs } from '@/domain/club/clubs'
import type { EventRooms } from '@/domain/event/event-rooms'
import type { Federation } from '@/domain/federation/federation'
import type { WallPairings } from '@/domain/wall-pairing/wall-pairings'

export type AssetFetcher = Pick<Fetcher, 'fetch'>

/** What the composition root hands every route. */
export type WorkerVariables = {
  assets: AssetFetcher
  clubs: Clubs
  eventRooms: EventRooms
  federation: Federation
  wallPairings: WallPairings
}

export type WorkerApp = Hono<{ Bindings: Env; Variables: WorkerVariables }>
