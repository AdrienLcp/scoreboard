import { Result } from '@adrienlcp/result'
import { useCallback, useEffect, useRef, useState } from 'react'

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
 * The club this device prepares days for: read from the server by the code
 * the device keeps (or the one another device's QR code just handed over),
 * every change saved whole at once, the last one undone in one tap.
 */
export const useClub = (scannedCode: ClubCode | null = null) => {
  const [firstCode] = useState(() => scannedCode ?? storedCode())
  const [state, setState] = useState<ClubState>(() =>
    firstCode === null ? { status: 'none' } : { status: 'loading' }
  )
  /** What an answer arriving later edits: the record as it is then, not as it was when the request left. */
  const latest = useRef(state)

  useEffect(() => {
    latest.current = state
  }, [state])

  const load = useCallback(async (code: ClubCode) => {
    setState({ status: 'loading' })
    const read = await readClub(code)

    if (read.status === 'success') {
      writeClubCode(code)
      setState({
        code,
        isUnsaved: false,
        previous: null,
        record: read.data,
        status: 'ready'
      })

      return
    }

    setState({
      code,
      status: read.error === 'network' ? 'offline' : 'missing'
    })
  }, [])

  useEffect(() => {
    if (firstCode !== null) {
      void load(firstCode)
    }
  }, [firstCode, load])

  const create = async (name: string): Promise<boolean> => {
    const created = await createClub({ name })

    if (created.status === 'failure') {
      return false
    }

    await load(created.data.clubCode)

    return true
  }

  const commit = (
    code: ClubCode,
    record: ClubRecord,
    previous: ClubRecord | null
  ) => {
    const next: ClubState = {
      code,
      isUnsaved: false,
      previous,
      record,
      status: 'ready'
    }

    latest.current = next
    setState(next)
    void saveClub({ clubCode: code, record }).then((saved) => {
      if (saved.status === 'failure') {
        setState((current) =>
          current.status === 'ready' && current.record === record
            ? { ...current, isUnsaved: true }
            : current
        )
      }
    })
  }

  /** Applies a change to the record as it stands now, even from an answer that took its time. */
  const edit = (apply: (record: ClubRecord) => ClubRecord) => {
    const current = latest.current

    if (current.status === 'ready') {
      commit(current.code, apply(current.record), current.record)
    }
  }

  const change = (record: ClubRecord) => edit(() => record)

  const undo = () => {
    const current = latest.current

    if (current.status === 'ready' && current.previous !== null) {
      commit(current.code, current.previous, null)
    }
  }

  const uploadLogo = async ({
    clubId,
    file
  }: {
    clubId: DirectoryClubId
    file: Blob
  }): Promise<Result<void, LogoUploadError>> => {
    const current = latest.current

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
    setState({ status: 'none' })
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
