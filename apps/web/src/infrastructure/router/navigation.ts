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

const CONSOLE_STEP_SEARCH_PARAM = 'step'

const CONSOLE_STEPS = ['hall', 'encounters', 'live', 'settings'] as const

/** Where the organiser's console stands: the day's three steps, or its settings aside. */
export type ConsoleStep = (typeof CONSOLE_STEPS)[number]

const isConsoleStep = (value: string | null): value is ConsoleStep =>
  CONSOLE_STEPS.some((step) => step === value)

/** The console opened on one step, kept in the address so a reload reopens it. */
export const organiserStepPathFor = ({
  eventId,
  step
}: {
  eventId: EventId
  step: ConsoleStep
}): string =>
  `${organiserPathFor(eventId)}?${CONSOLE_STEP_SEARCH_PARAM}=${step}`

export const useConsoleStepParam = (): ConsoleStep | null => {
  const [search] = useSearchParams()
  const typed = search.get(CONSOLE_STEP_SEARCH_PARAM)

  return isConsoleStep(typed) ? typed : null
}

const SCREEN_CONNECT_SEARCH_PARAM = 'connect'

/** The console's Salle step with the form that connects a big screen open. */
export const organiserConnectPathFor = (eventId: EventId): string =>
  `${organiserStepPathFor({ eventId, step: 'hall' })}&${SCREEN_CONNECT_SEARCH_PARAM}`

/**
 * Whether the address asks for the form that connects a big screen. Its
 * `dismiss` takes that ask and a scanned TV's code out of the address, so the
 * next ask opens the form again.
 */
export const useScreenConnectParam = (): {
  dismiss: () => void
  isAsked: boolean
} => {
  const [search, setSearch] = useSearchParams()
  const dismiss = useCallback(() => {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(SCREEN_CONNECT_SEARCH_PARAM)
        next.delete(PAIRING_SEARCH_PARAM)

        return next
      },
      { replace: true }
    )
  }, [setSearch])

  return { dismiss, isAsked: search.has(SCREEN_CONNECT_SEARCH_PARAM) }
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

const CLUB_RETURN_SEARCH_PARAM = 'from'

/** `/club` opened from an event's console: its back button leads to that console again. */
export const clubPathFrom = (eventId: EventId): string =>
  `${paths.club}?${CLUB_RETURN_SEARCH_PARAM}=${eventId}`

export const useClubReturnEventParam = (): EventId | null => {
  const [search] = useSearchParams()
  const parsed = eventIdSchema.safeParse(
    search.get(CLUB_RETURN_SEARCH_PARAM)?.toLowerCase()
  )

  return parsed.success ? parsed.data : null
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

/** The club page's address from wherever it is offered: inside an event, it remembers the event. */
export const useClubPath = (): string => {
  const eventId = useEventIdParam()

  return eventId === null ? paths.club : clubPathFrom(eventId)
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
