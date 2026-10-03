import { z } from 'zod'

import { eventSetupSchema, matchSetupSchema } from './event-setup'
import {
  encounterIdSchema,
  matchIdSchema,
  tableNumberSchema,
  umpireCodeSchema
} from './identifiers'
import { matchStateSchema } from './match-state'
import { scoringEventSchema } from './scoring-event'
import { scoreSchema, sideSchema } from './side'

export const matchViewSchema = matchSetupSchema.extend({
  state: matchStateSchema
})
export type MatchView = z.infer<typeof matchViewSchema>

export const encounterOutcomeSchema = z.union([sideSchema, z.literal('draw')])
export type EncounterOutcome = z.infer<typeof encounterOutcomeSchema>

export const encounterViewSchema = z.object({
  id: encounterIdSchema,
  /** `null` until every match of the sheet is over. */
  outcome: encounterOutcomeSchema.nullable(),
  /** Points earned match by match, as the sheet counts them. */
  points: scoreSchema
})
export type EncounterView = z.infer<typeof encounterViewSchema>

export const tableViewSchema = z.object({
  /** The match being played, or next up, on this table. */
  matchId: matchIdSchema.nullable(),
  number: tableNumberSchema
})
export type TableView = z.infer<typeof tableViewSchema>

/** What anyone in the room may see: no access code. */
export const publicSnapshotSchema = eventSetupSchema
  .omit({ matches: true })
  .extend({
    encounterViews: z.array(encounterViewSchema),
    matches: z.array(matchViewSchema),
    tables: z.array(tableViewSchema)
  })
export type PublicSnapshot = z.infer<typeof publicSnapshotSchema>

/**
 * An umpire's table, with the log of the match on it so the console can lay
 * the points it has not delivered yet over the server's record.
 */
export const umpireSnapshotSchema = z.object({
  event: publicSnapshotSchema,
  log: z.array(scoringEventSchema),
  table: tableNumberSchema
})
export type UmpireSnapshot = z.infer<typeof umpireSnapshotSchema>

export const tableAccessSchema = z.object({
  code: umpireCodeSchema,
  table: tableNumberSchema
})
export type TableAccess = z.infer<typeof tableAccessSchema>

export const organiserSnapshotSchema = z.object({
  event: publicSnapshotSchema,
  setup: eventSetupSchema,
  tableAccesses: z.array(tableAccessSchema)
})
export type OrganiserSnapshot = z.infer<typeof organiserSnapshotSchema>
