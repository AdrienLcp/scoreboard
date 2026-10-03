import type { Env } from './env'
import { handleRequest } from './infrastructure/http/handle-request'

export { EventRoom } from './infrastructure/durable-objects/event-room'

export default {
  fetch: handleRequest
} satisfies ExportedHandler<Env>
