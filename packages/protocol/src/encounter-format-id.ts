import { z } from 'zod'

/**
 * The team-encounter formats an event can pick, the club's own first. Each one
 * is a data definition in `@scoreboard/core/encounter/encounter-formats`.
 */
export const encounterFormatIds = [
  'fftt-6-players-20-games',
  'fftt-4-players-14-games',
  'fftt-3-players-10-games'
] as const
export const encounterFormatIdSchema = z.enum(encounterFormatIds)
export type EncounterFormatId = z.infer<typeof encounterFormatIdSchema>
