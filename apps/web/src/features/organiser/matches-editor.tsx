import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { tableNumbers } from '@scoreboard/core/event/table-queue'

import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ChoiceField } from './choice-field'
import { ConfirmButton } from './confirm-button'
import { MatchRow } from './match-row'
import { PlannedTimeForm } from './planned-time-form'
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

/** The programme: matches in playing order, their tables and times, and corrections. */
export const MatchesEditor: React.FC<MatchesEditorProps> = ({
  matches,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [homeId, setHomeId] = useState<string | null>(null)
  const [awayId, setAwayId] = useState<string | null>(null)
  const [table, setTable] = useState<string>(NO_TABLE)

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
  const tableOf = (id: string | null) =>
    id === null || id === NO_TABLE ? null : Number(id)

  return (
    <div className='organiser-stack'>
      <Form
        className='organiser-panel organiser-inline-form'
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
              table: tableOf(table)
            })
          )
          setHomeId(null)
          setAwayId(null)
        }}
      >
        <h3>{translate('organiser.matches.addTitle')}</h3>
        <ChoiceField
          choices={playerChoices}
          label={translate('organiser.matches.home')}
          onChange={setHomeId}
          placeholder={translate('organiser.choosePlayer')}
          selectedId={homeId}
        />
        <ChoiceField
          choices={playerChoices}
          label={translate('organiser.matches.away')}
          onChange={setAwayId}
          placeholder={translate('organiser.choosePlayer')}
          selectedId={awayId}
        />
        <ChoiceField
          choices={tableChoices}
          label={translate('organiser.matches.table')}
          onChange={(id) => setTable(id ?? NO_TABLE)}
          selectedId={table}
        />
        <Button
          isDisabled={homeId === null || awayId === null || homeId === awayId}
          type='submit'
        >
          <Icon name='plus' />
          {translate('organiser.matches.add')}
        </Button>
      </Form>

      {matches.length === 0 ? (
        <p className='organiser-empty'>
          {translate('organiser.matches.empty')}
        </p>
      ) : (
        <ol className='organiser-list'>
          {matches.map((match) => (
            <li key={match.id}>
              <MatchRow
                match={match}
                onRecord={onRecord}
                players={setup.players}
              >
                <ChoiceField
                  choices={tableChoices}
                  label={translate('organiser.matches.table')}
                  onChange={(id) =>
                    onSave(
                      moveMatchToTable({
                        matchId: match.id,
                        setup,
                        table: tableOf(id)
                      })
                    )
                  }
                  selectedId={
                    match.table === null ? NO_TABLE : String(match.table)
                  }
                />
                <PlannedTimeForm
                  key={match.plannedAtMs}
                  match={match}
                  onPlan={(plannedAtMs) =>
                    onSave(planMatch({ matchId: match.id, plannedAtMs, setup }))
                  }
                />
                <ConfirmButton
                  confirmLabel={translate('organiser.matches.removeConfirm')}
                  label={translate('organiser.matches.remove')}
                  onConfirm={() => onSave(removeMatch(setup, match.id))}
                />
              </MatchRow>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
