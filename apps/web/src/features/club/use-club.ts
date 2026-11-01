import { useCallback, useEffect, useState } from 'react'

import type { ClubCode, ClubRecord } from '@scoreboard/protocol/club-record'

import {
  createClub,
  readClub,
  saveClub
} from '@/infrastructure/api/scoreboard-api'
import {
  forgetClubCode,
  readClubCode,
  writeClubCode
} from '@/infrastructure/storage/club-code-storage'

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

const storedCode = (): ClubCode | null => {
  const read = readClubCode()

  return read.status === 'success' ? read.data : null
}

/**
 * The club this device prepares days for: read from the server by the code
 * the device keeps, every change saved whole at once, the last one undone in
 * one tap.
 */
export const useClub = () => {
  const [state, setState] = useState<ClubState>(() =>
    storedCode() === null ? { status: 'none' } : { status: 'loading' }
  )

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
    const code = storedCode()

    if (code !== null) {
      void load(code)
    }
  }, [load])

  const create = async (name: string): Promise<boolean> => {
    const created = await createClub({ name })

    if (created.status === 'failure') {
      return false
    }

    await load(created.data.clubCode)

    return true
  }

  const commit = (record: ClubRecord, previous: ClubRecord | null) => {
    if (state.status !== 'ready') {
      return
    }

    setState({ ...state, isUnsaved: false, previous, record })
    void saveClub({ clubCode: state.code, record }).then((saved) => {
      if (saved.status === 'failure') {
        setState((current) =>
          current.status === 'ready' && current.record === record
            ? { ...current, isUnsaved: true }
            : current
        )
      }
    })
  }

  const change = (record: ClubRecord) => {
    if (state.status === 'ready') {
      commit(record, state.record)
    }
  }

  const undo = () => {
    if (state.status === 'ready' && state.previous !== null) {
      commit(state.previous, null)
    }
  }

  const forget = () => {
    forgetClubCode()
    setState({ status: 'none' })
  }

  return { change, create, forget, join: load, state, undo }
}
