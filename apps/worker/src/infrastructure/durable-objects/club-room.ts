import { DurableObject } from 'cloudflare:workers'
import { Result } from '@adrienlcp/result'
import { z } from 'zod'

import {
  type ClubRecord,
  clubRecordSchema
} from '@scoreboard/protocol/club-record'
import { clubErasureAtMs } from '@scoreboard/protocol/club-retention'
import { logoContentTypes, type UploadedLogo } from '@scoreboard/protocol/logo'
import { API_ROUTES, fillRoute } from '@scoreboard/protocol/routes'
import { instantMsSchema } from '@scoreboard/protocol/scoring-event'

import { logoIdsToDrop } from '@/domain/club/club-logos'
import type { StoredLogo } from '@/domain/club/clubs'
import { nowMs } from '@/infrastructure/clock'

const RECORD_KEY = 'club'

/** Each logo under its own key, out of the record the club replaces whole on every change. */
const LOGO_KEY_PREFIX = 'logo:'

const logoKeyOf = (logoId: string) => `${LOGO_KEY_PREFIX}${logoId}`

const storedLogoSchema = z.object({
  bytes: z.instanceof(ArrayBuffer),
  contentType: z.enum(logoContentTypes)
})

const storedAtSchema = z.object({ storedAtMs: instantMsSchema })

const storedAtMsOf = (value: unknown) => {
  const parsed = storedAtSchema.safeParse(value)

  return parsed.success ? parsed.data.storedAtMs : null
}

/**
 * One club: its teams, licensees, the clubs it meets and their logos. Its
 * alarm erases it once it has gone unchanged for its retention.
 */
export class ClubRoom extends DurableObject<Env> {
  async open(record: ClubRecord): Promise<Result<void, 'taken'>> {
    if ((await this.read()) !== null) {
      return Result.failure('taken')
    }

    await this.save(record)

    return Result.success()
  }

  async read(): Promise<ClubRecord | null> {
    const parsed = clubRecordSchema.safeParse(
      await this.ctx.storage.get(RECORD_KEY)
    )

    return parsed.success ? parsed.data : null
  }

  async write(record: ClubRecord): Promise<Result<void, 'not_found'>> {
    if ((await this.read()) === null) {
      return Result.failure('not_found')
    }

    await this.save(record)

    return Result.success()
  }

  /** Keeps a new logo under a fresh id, dropping those neither the record nor a live event can still show. */
  async storeLogo(
    logo: StoredLogo
  ): Promise<Result<UploadedLogo, 'not_found'>> {
    const record = await this.read()

    if (record === null) {
      return Result.failure('not_found')
    }

    const roomId = this.ctx.id.toString()
    const logoUrlOf = (logoId: string) =>
      fillRoute(API_ROUTES.logo, { logoId, roomId })
    const storedLogos = await this.ctx.storage.list({
      prefix: LOGO_KEY_PREFIX
    })
    const now = nowMs()
    const droppedIds = logoIdsToDrop({
      logoUrlOf,
      nowMs: now,
      record,
      stored: [...storedLogos].map(([key, value]) => ({
        logoId: key.slice(LOGO_KEY_PREFIX.length),
        storedAtMs: storedAtMsOf(value)
      }))
    })

    await Promise.all(
      droppedIds.map((logoId) => this.ctx.storage.delete(logoKeyOf(logoId)))
    )

    const logoId = crypto.randomUUID()
    await this.ctx.storage.put(logoKeyOf(logoId), { ...logo, storedAtMs: now })

    return Result.success({ logoUrl: logoUrlOf(logoId) })
  }

  async readLogo(logoId: string): Promise<StoredLogo | null> {
    const parsed = storedLogoSchema.safeParse(
      await this.ctx.storage.get(logoKeyOf(logoId))
    )

    return parsed.success ? parsed.data : null
  }

  override async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll()
  }

  /** Every change pushes the erasure back: the retention runs from the last one. */
  private async save(record: ClubRecord): Promise<void> {
    await this.ctx.storage.put(RECORD_KEY, record)
    await this.ctx.storage.setAlarm(clubErasureAtMs(nowMs()))
  }
}
