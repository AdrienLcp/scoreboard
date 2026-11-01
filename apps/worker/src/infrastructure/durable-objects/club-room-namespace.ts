import type { Clubs } from '@/domain/club/clubs'

export const clubsOf = (namespace: Env['CLUB_ROOMS']): Clubs => {
  const roomOf = (code: string) => namespace.get(namespace.idFromName(code))

  return {
    open: (code, record) => roomOf(code).open(record),
    read: (code) => roomOf(code).read(),
    write: (code, record) => roomOf(code).write(record)
  }
}
