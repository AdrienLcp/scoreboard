import type { EventRooms } from '@/domain/event/event-rooms'

export const eventRoomsOf = (namespace: Env['EVENT_ROOMS']): EventRooms => {
  const roomOf = (eventId: string) =>
    namespace.get(namespace.idFromName(eventId))

  return {
    connect: (eventId, request) => roomOf(eventId).fetch(request),
    open: (eventId, input, organiserCode) =>
      roomOf(eventId).open(input, organiserCode)
  }
}
