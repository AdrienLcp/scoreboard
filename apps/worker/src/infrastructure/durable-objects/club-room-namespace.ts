import type { Clubs } from '@/domain/club/clubs'

export const clubsOf = (namespace: Env['CLUB_ROOMS']): Clubs => {
  const roomOf = (code: string) => namespace.get(namespace.idFromName(code))

  /** An id this namespace never drew is refused by `idFromString`, as an unknown room. */
  const roomAt = (roomId: string) => {
    try {
      return namespace.get(namespace.idFromString(roomId))
    } catch {
      return null
    }
  }

  return {
    open: (code, record) => roomOf(code).open(record),
    read: (code) => roomOf(code).read(),
    readLogo: async (roomId, logoId) =>
      (await roomAt(roomId)?.readLogo(logoId)) ?? null,
    storeLogo: (code, logo) => roomOf(code).storeLogo(logo),
    write: (code, record) => roomOf(code).write(record)
  }
}
