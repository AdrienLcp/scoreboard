import { z } from 'zod'

export const hexColourSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

/** A club's own identity, laid over the app's default one on its events. */
export const clubIdentitySchema = z.object({
  colours: z
    .object({
      primary: hexColourSchema,
      secondary: hexColourSchema
    })
    .nullable(),
  logoUrl: z.url().max(500).nullable(),
  name: z.string().trim().min(1).max(80)
})
export type ClubIdentity = z.infer<typeof clubIdentitySchema>
