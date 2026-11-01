import { DurableObject } from 'cloudflare:workers'
import { Result } from '@adrienlcp/result'
import { z } from 'zod'

import {
  displayIdSchema,
  eventIdSchema
} from '@scoreboard/protocol/identifiers'
import type { PairedWall, WallPairingStatus } from '@scoreboard/protocol/routes'

import {
  claimWallPairing,
  collectWallPairing,
  openWallPairing,
  type WallPairingState
} from '@/domain/wall-pairing/wall-pairing'
import { nowMs } from '@/infrastructure/clock'

const STATE_KEY = 'pairing'

const stateSchema: z.ZodType<WallPairingState> = z.discriminatedUnion(
  'status',
  [
    z.object({ expiresAtMs: z.number(), status: z.literal('waiting') }),
    z.object({
      displayId: displayIdSchema.nullable(),
      eventId: eventIdSchema,
      expiresAtMs: z.number(),
      status: z.literal('paired')
    })
  ]
)

/** One pairing code: a screen waiting for the organiser to name its event. Its alarm forgets it at expiry. */
export class WallPairingRoom extends DurableObject<Env> {
  async open(): Promise<Result<{ expiresAtMs: number }, 'taken'>> {
    const opened = openWallPairing(await this.readState(), nowMs())

    if (opened.status === 'failure') {
      return opened
    }

    await this.writeState(opened.data)
    await this.ctx.storage.setAlarm(opened.data.expiresAtMs)

    return Result.success({ expiresAtMs: opened.data.expiresAtMs })
  }

  async claim(wall: PairedWall): Promise<Result<void, 'not_found'>> {
    const claimed = claimWallPairing({
      nowMs: nowMs(),
      state: await this.readState(),
      wall
    })

    if (claimed.status === 'failure') {
      return claimed
    }

    await this.writeState(claimed.data)

    return Result.success()
  }

  async collect(): Promise<WallPairingStatus | null> {
    const { next, status } = collectWallPairing(await this.readState(), nowMs())

    if (next === null) {
      await this.forget()
    }

    return status
  }

  override async alarm(): Promise<void> {
    await this.forget()
  }

  private async readState(): Promise<WallPairingState | null> {
    const parsed = stateSchema.safeParse(await this.ctx.storage.get(STATE_KEY))

    return parsed.success ? parsed.data : null
  }

  private async writeState(state: WallPairingState): Promise<void> {
    await this.ctx.storage.put(STATE_KEY, state)
  }

  private async forget(): Promise<void> {
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }
}
