import { z } from 'zod'

import { playerIdSchema } from './identifiers'

export const poolIdSchema = z.string().trim().min(1).max(40)
export type PoolId = z.infer<typeof poolIdSchema>

export const MAX_POOL_PLAYERS = 16

/** A pool of an individual tournament: its players numbered 1, 2, 3… in this order. */
export const poolSchema = z.object({
  id: poolIdSchema,
  name: z.string().trim().min(1).max(40),
  playerIds: z.array(playerIdSchema).min(2).max(MAX_POOL_PLAYERS)
})
export type Pool = z.infer<typeof poolSchema>

export const semiFinalSlots = [1, 2] as const
export type SemiFinalSlot = (typeof semiFinalSlots)[number]

/**
 * Where a match sits in an individual tournament: a pool's round robin, or the
 * bracket after it. Semi-final 1 is the first pool's winner against the second
 * pool's runner-up, semi-final 2 the other way round.
 */
export const matchStageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('pool'), poolId: poolIdSchema }),
  z.object({ kind: z.literal('semi-final'), slot: z.literal(semiFinalSlots) }),
  z.object({ kind: z.literal('third-place') }),
  z.object({ kind: z.literal('final') })
])
export type MatchStage = z.infer<typeof matchStageSchema>

export const DEFAULT_WIN_POINTS = 2
export const DEFAULT_LOSS_POINTS = 1

/**
 * An individual tournament played in two pools, then crossed semi-finals and a
 * final, like the yearly Top 12. Every rule is a setting with the clubs'
 * defaults, since they are still deciding them.
 */
export const tournamentSchema = z.object({
  /**
   * The organiser's draw, best first, for players the tie-break leaves level:
   * a player missing from it ranks after those in it, by pool number.
   */
  drawOrder: z
    .array(playerIdSchema)
    .max(MAX_POOL_PLAYERS * 2)
    .default([]),
  lossPoints: z.number().int().min(0).max(10).default(DEFAULT_LOSS_POINTS),
  pools: z.array(poolSchema).length(2),
  winPoints: z.number().int().min(1).max(10).default(DEFAULT_WIN_POINTS)
})
export type Tournament = z.infer<typeof tournamentSchema>
