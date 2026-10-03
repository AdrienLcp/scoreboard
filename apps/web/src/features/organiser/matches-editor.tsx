import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { tableNumbers } from '@scoreboard/core/event/table-queue'

import { MatchLine } from '@/features/event/match-line'
import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ChoiceField } from './choice-field'
import { PlannedTimeForm } from './planned-time-form'
import { ScoreCorrection } from './score-correction'
import {
  addMatch,
  moveMatchToTable,
  planMatch,
  removeMatch
} from './setup-edits'

type MatchesEditorProps = {
  matches: readonly MatchView[]
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

const NO_TABLE = 'none'

/** The programme: matches in playing order, their tables, and corrections. */
export const MatchesEditor: React.FC<MatchesEditorProps> = ({
  matches,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [homeId, setHomeId] = useState<string | null>(null)
  const [awayId, setAwayId] = useState<string | null>(null)

  const playerChoices = setup.players.map((player) => ({
    id: player.id,
    label: player.name
  }))
  const tableChoices = [
    { id: NO_TABLE, label: translate('organiser.matches.noTable') },
    ...tableNumbers(setup.tableCount).map((number) => ({
      id: String(number),
      label: translate('table.name', { number })
    }))
  ]

  return (
    <>
      <ol>
        {matches.map((match) => (
          <li key={match.id}>
            <MatchLine match={match} players={setup.players} />
            <ChoiceField
              choices={tableChoices}
              label={translate('organiser.matches.table')}
              onChange={(id) =>
                onSave(
                  moveMatchToTable({
                    matchId: match.id,
                    setup,
                    table: id === null || id === NO_TABLE ? null : Number(id)
                  })
                )
              }
              selectedId={match.table === null ? NO_TABLE : String(match.table)}
            />
            <Button onPress={() => onSave(removeMatch(setup, match.id))}>
              {translate('organiser.matches.remove')}
            </Button>
            <PlannedTimeForm
              key={match.plannedAtMs}
              match={match}
              onPlan={(plannedAtMs) =>
                onSave(planMatch({ matchId: match.id, plannedAtMs, setup }))
              }
            />
            <ScoreCorrection match={match} onRecord={onRecord} />
          </li>
        ))}
      </ol>
      <Form
        onSubmit={(event) => {
          event.preventDefault()

          if (homeId === null || awayId === null) {
            return
          }

          onSave(
            addMatch(setup, {
              away: { playerIds: [awayId] },
              encounterId: null,
              format: setup.defaultFormat,
              home: { playerIds: [homeId] },
              id: newId(),
              label: null,
              plannedAtMs: null,
              table: null
            })
          )
        }}
      >
        <ChoiceField
          choices={playerChoices}
          label={translate('organiser.matches.home')}
          onChange={setHomeId}
          selectedId={homeId}
        />
        <ChoiceField
          choices={playerChoices}
          label={translate('organiser.matches.away')}
          onChange={setAwayId}
          selectedId={awayId}
        />
        <Button isDisabled={homeId === null || awayId === null} type='submit'>
          {translate('organiser.matches.add')}
        </Button>
      </Form>
    </>
  )
}
