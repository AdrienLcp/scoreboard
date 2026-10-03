import type { EventRoom } from './infrastructure/durable-objects/event-room'

/** The bindings `wrangler.jsonc` declares. */
export type Env = {
  ASSETS: Fetcher
  EVENT_ROOMS: DurableObjectNamespace<EventRoom>
}
