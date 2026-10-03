import { useState } from 'react'

import type { CreateEventInput } from '@scoreboard/protocol/routes'

import { type ApiError, createEvent } from '@/infrastructure/api/scoreboard-api'
import {
  organiserPathFor,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import { writeOrganiserCode } from '@/infrastructure/storage/organiser-code-storage'

type CreateEventState =
  | { status: 'idle' }
  | { status: 'creating' }
  | { error: ApiError; status: 'failed' }

/** Opens an event, keeps its organiser code on this device and moves to its console. */
export const useCreateEvent = () => {
  const navigateTo = useNavigateTo()
  const [state, setState] = useState<CreateEventState>({ status: 'idle' })

  const create = async (input: CreateEventInput): Promise<void> => {
    setState({ status: 'creating' })

    const created = await createEvent(input)

    if (created.status === 'failure') {
      setState({ error: created.error, status: 'failed' })

      return
    }

    const stored = writeOrganiserCode({
      code: created.data.organiserCode,
      eventId: created.data.eventId
    })

    if (stored.status === 'failure') {
      console.warn(`Organiser code not kept on this device: ${stored.error}`)
    }

    navigateTo(organiserPathFor(created.data.eventId))
  }

  return { create, state }
}
