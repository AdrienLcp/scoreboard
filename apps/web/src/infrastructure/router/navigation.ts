import { useCallback } from 'react'
import {
  generatePath,
  isRouteErrorResponse,
  type PathParam,
  useLocation,
  useNavigate,
  useParams,
  useRouteError,
  useSearchParams
} from 'react-router'

import { type ClubCode, clubCodeSchema } from '@scoreboard/protocol/club-record'
import {
  type DisplayId,
  displayIdSchema,
  type EventId,
  eventIdSchema,
  type UmpireCode,
  type WallPairingCode
} from '@scoreboard/protocol/identifiers'
import { PAGE_ROUTES } from '@scoreboard/protocol/page-routes'

import {
  parseUmpireCode,
  parseWallPairingCode
} from '@scoreboard/core/access/access-codes'

export const paths = PAGE_ROUTES

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

export const wallPairingPathFor = (pairingCode: WallPairingCode): string =>
  pathFor(paths.wallPairing, { pairingCode })

/** The organiser console, opened on the form that puts a waiting screen on the event. */
export const organiserPairingPathFor = ({
  eventId,
  pairingCode
}: {
  eventId: EventId
  pairingCode: WallPairingCode
}): string =>
  `${organiserPathFor(eventId)}?${PAIRING_SEARCH_PARAM}=${pairingCode}`

const PAIRING_SEARCH_PARAM = 'pair'

export const usePairingSearchParam = (): WallPairingCode | null => {
  const [search] = useSearchParams()
  const typed = search.get(PAIRING_SEARCH_PARAM)

  return typed === null ? null : parseWallPairingCode(typed)
}

const CLUB_CODE_SEARCH_PARAM = 'code'

/** `/club` as another device's QR code opens it: the club is joined there and its code kept. */
export const clubJoinPathFor = (code: ClubCode): string =>
  `${paths.club}?${CLUB_CODE_SEARCH_PARAM}=${code}`

export const useClubCodeSearchParam = (): ClubCode | null => {
  const [search] = useSearchParams()
  const typed = clubCodeSchema.safeParse(
    search.get(CLUB_CODE_SEARCH_PARAM)?.toUpperCase()
  )

  return typed.success ? typed.data : null
}

const NEW_PAIRING_SEARCH_PARAM = 'new'

/** `/wall` showing a fresh code even on a TV that remembers its display: how a screen is paired again. */
export const newWallPairingPath = `${paths.wall}?${NEW_PAIRING_SEARCH_PARAM}`

export const useIsNewWallPairingAsked = (): boolean => {
  const [search] = useSearchParams()

  return search.has(NEW_PAIRING_SEARCH_PARAM)
}

export const useWallPairingCodeParam = (): WallPairingCode | null => {
  const { pairingCode } = useParams<PathParam<typeof paths.wallPairing>>()

  return pairingCode === undefined ? null : parseWallPairingCode(pairingCode)
}

/** Parameters are read case-blind: a scanned link arrives in capitals. */
export const useEventIdParam = (): EventId | null => {
  const { eventId } = useParams<PathParam<typeof paths.display>>()
  const parsed = eventIdSchema.safeParse(eventId?.toLowerCase())

  return parsed.success ? parsed.data : null
}

/** `null` on the default display, which has no id and shows every table. */
export const useDisplayIdParam = (): DisplayId | 'unknown' | null => {
  const { displayId } = useParams<PathParam<typeof paths.displayOf>>()

  if (displayId === undefined) {
    return null
  }

  const parsed = displayIdSchema.safeParse(displayId.toLowerCase())

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

/** Moves to a page in place of this one, like a paired screen leaving its waiting page. */
export const useReplaceWith = (): ((path: string) => void) => {
  const navigate = useNavigate()

  return useCallback(
    (path: string) => {
      void navigate(path, { replace: true })
    },
    [navigate]
  )
}

/** The error that broke the route, flattened to one line for the error screen. */
export const useRouteFailure = (): string => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  return error instanceof Error ? error.message : String(error)
}
