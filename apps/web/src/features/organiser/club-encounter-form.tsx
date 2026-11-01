import type React from 'react'
import { useState } from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { EventSetup } from '@scoreboard/protocol/event-setup'

import {
  addClubEncounter,
  type ClubSide,
  defaultTablesFor
} from '@scoreboard/core/club/club-encounter'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

import { useClub } from '@/features/club/use-club'
import { newEncounterId, newMatchId } from '@/infrastructure/ids'
import { paths } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'

import './club-encounter-form.sass'

type ClubEncounterFormProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

const sidesOf = (record: ClubRecord, isOwn: boolean): ClubSide[] =>
  (isOwn ? [record.own] : record.opponents).flatMap((club) =>
    club.teams.map((team) => ({ club, team }))
  )

/** Our teams not yet playing today come first: the next encounter is one of theirs. */
const firstFreeTeamId = (
  sides: readonly ClubSide[],
  setup: EventSetup
): string | null =>
  (
    sides.find(
      (side) =>
        !setup.encounters.some((encounter) => encounter.home === side.team.id)
    ) ?? sides.at(0)
  )?.team.id ?? null

/**
 * The Sunday morning in a few taps: one of our teams, the club it meets, and
 * the encounter lands on its own tables with our last composition seated.
 */
export const ClubEncounterForm: React.FC<ClubEncounterFormProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const { state } = useClub()
  const [homeId, setHomeId] = useState<string | null>(null)
  const [awayId, setAwayId] = useState<string | null>(null)
  const [firstTable, setFirstTable] = useState<string | null>(null)

  if (state.status !== 'ready') {
    return (
      <div className='organiser-panel club-encounter-form'>
        <p className='organiser-note'>
          {translate(
            state.status === 'loading'
              ? 'organiser.clubEncounter.loading'
              : 'organiser.clubEncounter.noClub'
          )}
        </p>
        <ButtonLink href={paths.club}>
          <Icon name='open' />
          {translate('organiser.clubEncounter.prepare')}
        </ButtonLink>
      </div>
    )
  }

  const own = sidesOf(state.record, true)
  const opponents = sidesOf(state.record, false)
  const pickedHomeId = homeId ?? firstFreeTeamId(own, setup)
  const home = own.find((side) => side.team.id === pickedHomeId) ?? null
  const away = opponents.find((side) => side.team.id === awayId) ?? null
  const format = encounterFormatFor(
    home?.team.formatId ?? 'fftt-6-players-20-games'
  )
  const autoTables =
    home === null
      ? []
      : defaultTablesFor({ format, preferred: home.team.tables, setup })
  const tables =
    firstTable === null
      ? autoTables
      : Array.from(
          { length: format.groupCount },
          (_, offset) => Number(firstTable) + offset
        ).filter((table) => table <= setup.tableCount)
  const tablesLabel = (run: readonly number[]) =>
    translate('club.team.tablesChoice', {
      count: run.length,
      tables: run.map(String)
    })

  return (
    <Form
      className='organiser-panel club-encounter-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (home === null || away === null) {
          return
        }

        onSave(
          addClubEncounter({
            away,
            awayColour: away.team.colour,
            encounterId: newEncounterId(),
            home,
            newMatchId,
            setup,
            tables
          })
        )
        setHomeId(null)
        setAwayId(null)
        setFirstTable(null)
      }}
    >
      <h3>{translate('organiser.clubEncounter.title')}</h3>
      <ChoiceField
        choices={own.map((side) => ({
          id: side.team.id,
          label: side.team.name
        }))}
        label={translate('organiser.clubEncounter.home')}
        onChange={(id) => {
          setHomeId(id)
          setFirstTable(null)
        }}
        placeholder={translate('organiser.chooseTeam')}
        selectedId={pickedHomeId}
      />
      <ChoiceField
        choices={opponents.map((side) => ({
          id: side.team.id,
          label: side.team.name
        }))}
        label={translate('organiser.clubEncounter.away')}
        onChange={setAwayId}
        placeholder={translate(
          opponents.length === 0
            ? 'organiser.clubEncounter.noOpponent'
            : 'organiser.chooseTeam'
        )}
        selectedId={awayId}
      />
      <ChoiceField
        choices={Array.from(
          { length: Math.max(0, setup.tableCount - format.groupCount + 1) },
          (_, index) => ({
            id: String(index + 1),
            label: tablesLabel(
              Array.from(
                { length: format.groupCount },
                (_, offset) => index + 1 + offset
              )
            )
          })
        )}
        label={translate('organiser.clubEncounter.tables')}
        onChange={setFirstTable}
        placeholder={translate('organiser.clubEncounter.noTables')}
        selectedId={tables[0] === undefined ? null : String(tables[0])}
      />
      <div className='club-encounter-actions'>
        <Button isDisabled={home === null || away === null} type='submit'>
          <Icon name='plus' />
          {translate('organiser.clubEncounter.add')}
        </Button>
        <ButtonLink href={paths.club} variant='quiet'>
          <Icon name='open' />
          {translate('organiser.clubEncounter.edit')}
        </ButtonLink>
      </div>
    </Form>
  )
}
