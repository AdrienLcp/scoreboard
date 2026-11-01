import { DurableObject } from 'cloudflare:workers'
import { Result } from '@adrienlcp/result'

import {
  type ClubRecord,
  clubRecordSchema
} from '@scoreboard/protocol/club-record'
import { clubErasureAtMs } from '@scoreboard/protocol/club-retention'

import { nowMs } from '@/infrastructure/clock'

const RECORD_KEY = 'club'

/**
 * One club: its teams, licensees and the clubs it meets. Its alarm erases it
 * once it has gone unchanged for its retention.
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

  override async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll()
  }

  /** Every change pushes the erasure back: the retention runs from the last one. */
  private async save(record: ClubRecord): Promise<void> {
    await this.ctx.storage.put(RECORD_KEY, record)
    await this.ctx.storage.setAlarm(clubErasureAtMs(nowMs()))
  }
}
