import { z } from 'zod'

/**
 * How a screen lays out the wall: each encounter on a row of its own, or the
 * tables where they stand in the hall, as seen from the stands.
 */
export const wallViewSchema = z.enum(['encounters', 'hall'])
export type WallView = z.infer<typeof wallViewSchema>
