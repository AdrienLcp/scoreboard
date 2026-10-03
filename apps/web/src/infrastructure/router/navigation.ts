import {
  generatePath,
  isRouteErrorResponse,
  type PathParam,
  useLocation,
  useNavigate,
  useParams,
  useRouteError
} from 'react-router'

import {
  type DisplayId,
  displayIdSchema,
  type EventId,
  eventIdSchema,
  type UmpireCode
} from '@scoreboard/protocol/identifiers'

import { parseUmpireCode } from '@scoreboard/core/access/access-codes'

export const paths = {
  display: '/e/:eventId/display',
  displayOf: '/e/:eventId/display/:displayId',
  home: '/',
  organiser: '/e/:eventId/organiser',
  spectator: '/e/:eventId',
  umpire: '/e/:eventId/umpire/:umpireCode',
  umpireEntry: '/e/:eventId/umpire'
} as const

const pathFor = <TPath extends string>(
  path: TPath,
  params: Record<PathParam<TPath>, string>
): string => generatePath<string>(path, params)

export const displayPathFor = (eventId: EventId): string =>
  pathFor(paths.display, { eventId })

export const displayOfPathFor = ({
  displayId,
  eventId
}: {
  displayId: DisplayId
  eventId: EventId
}): string => pathFor(paths.displayOf, { displayId, eventId })

export const spectatorPathFor = (eventId: EventId): string =>
  pathFor(paths.spectator, { eventId })

export const organiserPathFor = (eventId: EventId): string =>
  pathFor(paths.organiser, { eventId })

export const umpireEntryPathFor = (eventId: EventId): string =>
  pathFor(paths.umpireEntry, { eventId })

export const umpirePathFor = ({
  code,
  eventId
}: {
  code: UmpireCode
  eventId: EventId
}): string => pathFor(paths.umpire, { eventId, umpireCode: code })

export const useEventIdParam = (): EventId | null => {
  const { eventId } = useParams<PathParam<typeof paths.display>>()
  const parsed = eventIdSchema.safeParse(eventId)

  return parsed.success ? parsed.data : null
}

/** `null` on the default display, which has no id and shows every table. */
export const useDisplayIdParam = (): DisplayId | 'unknown' | null => {
  const { displayId } = useParams<PathParam<typeof paths.displayOf>>()

  if (displayId === undefined) {
    return null
  }

  const parsed = displayIdSchema.safeParse(displayId)

  return parsed.success ? parsed.data : 'unknown'
}

export const useUmpireCodeParam = (): UmpireCode | null => {
  const { umpireCode } = useParams<PathParam<typeof paths.umpire>>()

  return umpireCode === undefined ? null : parseUmpireCode(umpireCode)
}

export const useCurrentPath = (): string => useLocation().pathname

/** Moves to a page after an action, like an event just opened. */
export const useNavigateTo = (): ((path: string) => void) => {
  const navigate = useNavigate()

  return (path) => {
    void navigate(path)
  }
}

/** The error that broke the route, flattened to one line for the error screen. */
export const useRouteFailure = (): string => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  return error instanceof Error ? error.message : String(error)
}
