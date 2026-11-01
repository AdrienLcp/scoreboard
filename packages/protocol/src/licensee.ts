import { z } from 'zod'

/** FFTT licence number, 5 to 7 digits: the key a licensee is fetched by. */
export const licenceSchema = z.string().regex(/^\d{5,7}$/)
export type Licence = z.infer<typeof licenceSchema>

/** FFTT ranking points, shown beside a player's name. */
export const rankingPointsSchema = z.number().int().min(0).max(5000)
