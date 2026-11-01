import { z } from 'zod'

/** A logo's longest side as the app keeps it: sharp on the wall's 72-pixel header at twice its density and more. */
export const LOGO_SIZE_PX = 256

/** Far above a 256-pixel WebP or PNG logo: anything bigger was not resized. */
export const MAX_LOGO_BYTES = 200_000

export const logoContentTypes = [
  'image/webp',
  'image/png',
  'image/jpeg'
] as const
export type LogoContentType = (typeof logoContentTypes)[number]

export const isLogoContentType = (type: string): type is LogoContentType =>
  logoContentTypes.some((candidate) => candidate === type)

/** A path on the app's own site, never a protocol-relative `//host` link. */
const ownSitePath = /^\/(?!\/)[\w/.-]{1,200}$/

/** A logo on the web, or one a club uploaded, served from the app's own site. */
export const logoUrlSchema = z.union([
  z.url().max(500),
  z.string().regex(ownSitePath)
])
export type LogoUrl = z.infer<typeof logoUrlSchema>

export const uploadedLogoSchema = z.object({ logoUrl: logoUrlSchema })
export type UploadedLogo = z.infer<typeof uploadedLogoSchema>
