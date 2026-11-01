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

import {
  addTypedOpponentTeam,
  addTypedPlayer,
  keepLineup,
  markPlayed
} from '@/features/club/club-edits'
import { byRecentThenName } from '@/features/club/directory-search'
import { PickField } from '@/features/club/pick-field'
import { useClub } from '@/features/club/use-club'
import { nowMs } from '@/infrastructure/clock'
import { toLocalDay } from '@/infrastructure/dates'
import {
  newDirectoryClubId,
  newEncounterId,
  newMatchId,
  newPlayerId,
  newTeamId
} from '@/infrastructure/ids'
import { paths } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'
import { ClubLineup, lineupSummaryOf, type SeatedLineup } from './club-lineup'

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

type DayLineups = {
  /** `null` while the side keeps its last composition. */
  away: SeatedLineup | null
  home: SeatedLineup | null
}

const NO_CHANGE: DayLineups = { away: null, home: null }

/** The opposing teams a Sunday picks from: those met most recently first. */
const RECENT_OPPONENTS = 4

/** Our club's teams fit as chips: a club fields a handful, Angles seven. */
const OWN_TEAMS_AS_CHIPS = 8

const teamPicksOf = (sides: readonly ClubSide[]) =>
  sides.map((side) => ({
    detail: side.team.division ?? undefined,
    id: side.team.id,
    label: side.team.name
  }))

const isSameLineup = (one: SeatedLineup, other: SeatedLineup): boolean =>
  JSON.stringify(one) === JSON.stringify(other)

/**
 * The Sunday morning in a few taps: one of our teams, the club it meets, and
 * the encounter lands on its own tables with the last composition seated.
 * The day's changes to it are kept for the next encounter unless told not to.
 */
export const ClubEncounterForm: React.FC<ClubEncounterFormProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const club = useClub()
  const { state } = club
  const [homeId, setHomeId] = useState<string | null>(null)
  const [awayId, setAwayId] = useState<string | null>(null)
  const [firstTable, setFirstTable] = useState<string | null>(null)
  const [dayLineups, setDayLineups] = useState<DayLineups>(NO_CHANGE)
  const [keepsLineup, setKeepsLineup] = useState(true)

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

  const { record } = state
  const own = sidesOf(record, true)
  const opponents = sidesOf(record, false).toSorted(
    byRecentThenName((side: ClubSide) => side.team)
  )
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
  const homeLineup = dayLineups.home ?? home?.team.lineup ?? []
  const awayLineup = dayLineups.away ?? away?.team.lineup ?? []
  const addPlayerTo = (side: ClubSide, typed: string) => {
    const added = addTypedPlayer({
      clubId: side.club.id,
      newPlayerId,
      record,
      typed
    })

    if (added === null) {
      return null
    }

    club.change(added.record)

    return added.playerId
  }
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
            away: { ...away, team: { ...away.team, lineup: [...awayLineup] } },
            awayColour: away.team.colour,
            encounterId: newEncounterId(),
            home: { ...home, team: { ...home.team, lineup: [...homeLineup] } },
            newMatchId,
            setup,
            tables
          })
        )

        const keeps =
          keepsLineup &&
          !(
            isSameLineup(homeLineup, home.team.lineup) &&
            isSameLineup(awayLineup, away.team.lineup)
          )

        club.edit((current) => {
          const played = markPlayed({
            on: toLocalDay(nowMs()),
            playerIds: [...homeLineup, ...awayLineup].filter(
              (playerId) => playerId !== null
            ),
            record: current,
            teamIds: [home.team.id, away.team.id]
          })

          return keeps
            ? keepLineup({
                lineup: awayLineup,
                record: keepLineup({
                  lineup: homeLineup,
                  record: played,
                  teamId: home.team.id
                }),
                teamId: away.team.id
              })
            : played
        })

        setHomeId(null)
        setAwayId(null)
        setFirstTable(null)
        setDayLineups(NO_CHANGE)
      }}
    >
      <h3>{translate('organiser.clubEncounter.title')}</h3>
      <PickField
        emptyLabel={(typed) => translate('organiser.pick.none', { typed })}
        label={translate('organiser.clubEncounter.home')}
        onChange={(id) => {
          setHomeId(id)
          setFirstTable(null)
          setDayLineups((current) => ({ ...current, home: null }))
        }}
        picks={teamPicksOf(own)}
        placeholder={translate('organiser.chooseTeam')}
        quickPicks={OWN_TEAMS_AS_CHIPS}
        selectedId={pickedHomeId}
      />
      <PickField
        addLabel={(typed) =>
          translate('organiser.pick.addTeam', { name: typed.trim() })
        }
        emptyLabel={(typed) => translate('organiser.pick.none', { typed })}
        label={translate('organiser.clubEncounter.away')}
        onAdd={(typed) => {
          const added = addTypedOpponentTeam({
            newClubId: newDirectoryClubId,
            newTeamId,
            record,
            typed
          })

          club.change(added.record)

          return added.teamId
        }}
        onChange={(id) => {
          setAwayId(id)
          setDayLineups((current) => ({ ...current, away: null }))
        }}
        picks={teamPicksOf(opponents)}
        placeholder={translate('organiser.pick.teamPlaceholder')}
        quickPicks={RECENT_OPPONENTS}
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
      {home === null || away === null ? null : (
        <Disclosure className='club-encounter-lineup'>
          <Button
            className='club-encounter-lineup-trigger'
            slot='trigger'
            variant='quiet'
          >
            {translate('organiser.clubEncounter.lineup')}
            <span className='club-encounter-lineup-summary'>
              {lineupSummaryOf({
                letters: format.homeLetters,
                lineup: homeLineup,
                side: home
              })}
            </span>
            <Icon name='chevronDown' />
          </Button>
          <DisclosurePanel>
            <div className='club-encounter-lineup-body'>
              <ClubLineup
                groupCount={format.groupCount}
                letters={format.homeLetters}
                lineup={homeLineup}
                onAddPlayer={(typed) => addPlayerTo(home, typed)}
                onChange={(lineup) =>
                  setDayLineups((current) => ({ ...current, home: lineup }))
                }
                side={home}
              />
              <ClubLineup
                groupCount={format.groupCount}
                letters={format.awayLetters}
                lineup={awayLineup}
                onAddPlayer={(typed) => addPlayerTo(away, typed)}
                onChange={(lineup) =>
                  setDayLineups((current) => ({ ...current, away: lineup }))
                }
                side={away}
              />
              <Switch isSelected={keepsLineup} onChange={setKeepsLineup}>
                {translate('organiser.clubEncounter.keepLineup')}
              </Switch>
            </div>
          </DisclosurePanel>
        </Disclosure>
      )}
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
