import { Result } from '@adrienlcp/result'
import { useEffect, useState, useSyncExternalStore } from 'react'

import type {
  ClubCode,
  ClubRecord,
  DirectoryClubId
} from '@scoreboard/protocol/club-record'

import {
  createClub,
  readClub,
  saveClub,
  uploadClubLogo
} from '@/infrastructure/api/scoreboard-api'
import { resizeLogo } from '@/infrastructure/images/resize-logo'
import {
  forgetClubCode,
  readClubCode,
  writeClubCode
} from '@/infrastructure/storage/club-code-storage'

import { changeClubLogo } from './club-edits'

export type ClubState =
  | { status: 'none' }
  | { status: 'loading' }
  | { code: ClubCode; status: 'missing' }
  | { code: ClubCode; status: 'offline' }
  | {
      code: ClubCode
      /** The last change did not reach the server: it lives on this device only. */
      isUnsaved: boolean
      /** The record before the last change, for one-gesture undo. */
      previous: ClubRecord | null
      record: ClubRecord
      status: 'ready'
    }

export type LogoUploadError = 'not_an_image' | 'offline' | 'refused'

const storedCode = (): ClubCode | null => {
  const read = readClubCode()

  return read.status === 'success' ? read.data : null
}

/**
 * One club per page, whatever reads it: the console's encounter forms and its
 * results write-back edit the same record, so no save carries a stale one.
 */
let clubState: ClubState = { status: 'none' }
let openReaders = 0
const listeners = new Set<() => void>()

const setClubState = (next: ClubState) => {
  clubState = next

  for (const listener of listeners) {
    listener()
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

const readClubState = (): ClubState => clubState

const load = async (code: ClubCode) => {
  setClubState({ status: 'loading' })
  const read = await readClub(code)

  if (read.status === 'success') {
    writeClubCode(code)
    setClubState({
      code,
      isUnsaved: false,
      previous: null,
      record: read.data,
      status: 'ready'
    })

    return
  }

  setClubState({
    code,
    status: read.error === 'network' ? 'offline' : 'missing'
  })
}

const commit = (
  code: ClubCode,
  record: ClubRecord,
  previous: ClubRecord | null
) => {
  setClubState({
    code,
    isUnsaved: false,
    previous,
    record,
    status: 'ready'
  })
  void saveClub({ clubCode: code, record }).then((saved) => {
    if (
      saved.status === 'failure' &&
      clubState.status === 'ready' &&
      clubState.record === record
    ) {
      setClubState({ ...clubState, isUnsaved: true })
    }
  })
}

/** Applies a change to the record as it stands now, even from an answer that took its time. */
const edit = (apply: (record: ClubRecord) => ClubRecord) => {
  if (clubState.status === 'ready') {
    const next = apply(clubState.record)

    if (next !== clubState.record) {
      commit(clubState.code, next, clubState.record)
    }
  }
}

/**
 * The club this device prepares days for: read from the server by the code
 * the device keeps (or the one another device's QR code just handed over)
 * when a page first needs it, every change saved whole at once, the last one
 * undone in one tap.
 */
export const useClub = (scannedCode: ClubCode | null = null) => {
  const state = useSyncExternalStore(subscribe, readClubState)
  const [opening] = useState(() => ({
    code: scannedCode ?? storedCode(),
    isScanned: scannedCode !== null
  }))

  useEffect(() => {
    openReaders += 1

    if (openReaders === 1 || opening.isScanned) {
      if (opening.code === null) {
        setClubState({ status: 'none' })
      } else {
        void load(opening.code)
      }
    }

    return () => {
      openReaders -= 1
    }
  }, [opening])

  const create = async (name: string): Promise<boolean> => {
    const created = await createClub({ name })

    if (created.status === 'failure') {
      return false
    }

    await load(created.data.clubCode)

    return true
  }

  const change = (record: ClubRecord) => edit(() => record)

  const undo = () => {
    if (clubState.status === 'ready' && clubState.previous !== null) {
      commit(clubState.code, clubState.previous, null)
    }
  }

  const uploadLogo = async ({
    clubId,
    file
  }: {
    clubId: DirectoryClubId
    file: Blob
  }): Promise<Result<void, LogoUploadError>> => {
    const current = clubState

    if (current.status !== 'ready') {
      return Result.failure('offline')
    }

    const resized = await resizeLogo(file)

    if (resized.status === 'failure') {
      return Result.failure('not_an_image')
    }

    const uploaded = await uploadClubLogo({
      clubCode: current.code,
      logo: resized.data
    })

    if (uploaded.status === 'failure') {
      return Result.failure(
        uploaded.error === 'network' ? 'offline' : 'refused'
      )
    }

    edit((record) =>
      changeClubLogo({ clubId, logoUrl: uploaded.data.logoUrl, record })
    )

    return Result.success()
  }

  const forget = () => {
    forgetClubCode()
    setClubState({ status: 'none' })
  }

  return {
    change,
    create,
    edit,
    forget,
    join: load,
    state,
    undo,
    uploadLogo
  }
}
