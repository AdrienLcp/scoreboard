import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { Side } from '@scoreboard/protocol/side'

import { hallPlanOf } from '@scoreboard/core/hall/hall-plan'

import type { ConsoleStep } from '@/infrastructure/router/navigation'

import {
  encounterLineupOf,
  seatedCountOf,
  sideLettersOf
} from './encounter-lineups'
import { type EventFormat, eventFormatOf } from './event-format'
import { hasPlayBegun } from './live-state'

const SIDES: readonly Side[] = ['home', 'away']

const isRunning = (match: PublicSnapshot['matches'][number]) =>
  match.timing.startedAtMs !== null && match.timing.finishedAtMs === null

export const runningMatchCountOf = (event: PublicSnapshot): number =>
  event.matches.filter(isRunning).length

/** The step a console opens on without one in its address: the live day once a match has begun. */
export const firstStepOf = (event: PublicSnapshot): ConsoleStep =>
  hasPlayBegun(event) ? 'live' : 'hall'

/** Each step's one-line state, said under its name in the step bar. */
export type StepStatus =
  | { kind: 'hall'; screens: number; tables: number }
  | { kind: 'formatToChoose' }
  | { kind: 'pools'; players: number }
  | { kind: 'freeMatches'; matches: number }
  | { kind: 'noEncounter' }
  | { kind: 'unseated'; encounters: number }
  | { kind: 'lineupsToDo'; encounters: number }
  | { kind: 'encountersReady'; encounters: number }
  | { kind: 'running'; matches: number }
  | { kind: 'nothingRunning' }

const encountersStatusOf = (
  setup: EventSetup,
  event: PublicSnapshot,
  chosenFormat: EventFormat | null
): StepStatus => {
  const format = chosenFormat ?? eventFormatOf(setup)

  if (format === 'pools') {
    return { kind: 'pools', players: setup.players.length }
  }

  if (format === 'free') {
    return { kind: 'freeMatches', matches: setup.matches.length }
  }

  if (format === null) {
    return { kind: 'formatToChoose' }
  }

  if (setup.encounters.length === 0) {
    return { kind: 'noEncounter' }
  }

  const matchesOf = (encounterId: string) =>
    setup.matches.filter((match) => match.encounterId === encounterId)
  const unseated = setup.encounters.filter((encounter) =>
    matchesOf(encounter.id).every((match) => match.table === null)
  ).length

  if (unseated > 0) {
    return { encounters: unseated, kind: 'unseated' }
  }

  const lineupsToDo = setup.encounters.filter((encounter) =>
    SIDES.some(
      (side) =>
        seatedCountOf(encounterLineupOf({ encounter, setup, side })) <
        sideLettersOf(encounter, side).length
    )
  ).length

  return lineupsToDo > 0
    ? { encounters: lineupsToDo, kind: 'lineupsToDo' }
    : { encounters: event.encounters.length, kind: 'encountersReady' }
}

export const stepStatusOf = ({
  chosenFormat = null,
  connectedScreens = 0,
  event,
  setup,
  step
}: {
  /** The format picked in the console before anything of it is saved. */
  chosenFormat?: EventFormat | null
  /** The screens a TV shows right now. */
  connectedScreens?: number
  event: PublicSnapshot
  setup: EventSetup
  step: Exclude<ConsoleStep, 'settings'>
}): StepStatus => {
  if (step === 'hall') {
    return {
      kind: 'hall',
      screens: connectedScreens,
      tables: hallPlanOf(setup).tables.filter((table) => !table.isHidden).length
    }
  }

  if (step === 'encounters') {
    return encountersStatusOf(setup, event, chosenFormat)
  }

  const running = runningMatchCountOf(event)

  return running > 0
    ? { kind: 'running', matches: running }
    : { kind: 'nothingRunning' }
}
