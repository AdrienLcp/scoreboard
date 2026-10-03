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
  type EventId,
  eventIdSchema,
  type UmpireCode
} from '@scoreboard/protocol/identifiers'

import { parseUmpireCode } from '@scoreboard/core/access/access-codes'

export const paths = {
  display: '/e/:eventId/display',
  home: '/',
  organiser: '/e/:eventId/organiser',
  umpire: '/e/:eventId/umpire/:umpireCode',
  umpireEntry: '/e/:eventId/umpire'
} as const

const pathFor = <TPath extends string>(
  path: TPath,
  params: Record<PathParam<TPath>, string>
): string => generatePath<string>(path, params)

export const displayPathFor = (eventId: EventId): string =>
  pathFor(paths.display, { eventId })

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
