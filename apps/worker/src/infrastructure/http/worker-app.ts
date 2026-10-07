import type { Hono } from 'hono'

import type { EventRooms } from '@/domain/event/event-rooms'

export type AssetFetcher = Pick<Fetcher, 'fetch'>

/** What the composition root hands every route. */
export type WorkerVariables = {
  assets: AssetFetcher
  eventRooms: EventRooms
}

export type WorkerApp = Hono<{ Bindings: Env; Variables: WorkerVariables }>
