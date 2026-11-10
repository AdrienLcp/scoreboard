import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { FederationSource } from '@/features/club/federation-source'
import { PoolTeamMark } from '@/features/club/pool-team-mark'
import {
  isEntryInTheDay,
  isPlayedAtHome,
  placeEntries,
  type RoundEntry,
  roundEntriesOf,
  withPlayedEntries
} from '@/features/club/round-entries'
import { useClub } from '@/features/club/use-club'
import type { FederationPoolsById } from '@/features/club/use-federation-pools'
import { nowMs } from '@/infrastructure/clock'
import { dayAsDate, toLocalDay } from '@/infrastructure/dates'
import { newEncounterId, newMatchId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './round-encounters.sass'

type RoundEncountersProps = {
  eventId: EventId
  /** The FFTT's pools that answered: their calendar gives the round, the hand-kept pools stand in for the others. */
  federationPools: FederationPoolsById
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** The day with these entries added in turn, each on the tables the ones before it left free. */
const placeEncounters = (entries: readonly RoundEntry[], setup: EventSetup) =>
  placeEntries({ entries, newEncounterId, newMatchId, setup })

/**
 * Match day from the club's calendar: each encounter of the round played in
 * our hall, added in one tap with its opponent, its tables and each team's
 * last composition; its sheet then writes the result into the standings.
 * One played in another club's hall is never offered.
 */
export const RoundEncounters: React.FC<RoundEncountersProps> = ({
  eventId,
  federationPools,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const { edit, state } = useClub()

  if (state.status !== 'ready') {
    return null
  }

  const entries = roundEntriesOf(
    state.record,
    toLocalDay(setup.startsAtMs ?? nowMs()),
    federationPools
  ).filter(isPlayedAtHome)

  if (entries.length === 0) {
    return null
  }

  const isAdded = (entry: RoundEntry) =>
    isEntryInTheDay({ entry, eventId, setup })
  const pending = entries.filter((entry) => !isAdded(entry))
  const preview = placeEncounters(pending, setup)
  const pendingHome = pending.filter((entry) => entry.away !== null)
  const roundNumbers = [...new Set(entries.map((entry) => entry.roundNumber))]
  const dates = [...new Set(entries.map((entry) => entry.date))]
  const date = dates.length === 1 ? (dates[0] ?? null) : null

  const add = (toAdd: readonly RoundEntry[]) => {
    const { placed, setup: next } = placeEncounters(toAdd, setup)

    if (placed.length === 0) {
      return
    }

    onSave(next)
    edit((record) => withPlayedEntries({ eventId, placed, record }))
  }

  return (
    <div className='organiser-panel round-encounters'>
      <h3>
        {roundNumbers.length === 1
          ? translate('organiser.round.title', {
              number: String(roundNumbers[0] ?? 1)
            })
          : translate('organiser.round.titleMixed')}
      </h3>
      <p className='organiser-note'>
        {[
          date === null
            ? null
            : translate('club.championship.rounds.date', {
                at: dayAsDate(date)
              }),
          translate('organiser.round.help')
        ]
          .filter((part) => part !== null)
          .join(' · ')}
      </p>
      <ul className='round-encounter-list'>
        {entries.map((entry) => {
          const own = entry.home
          const other = entry.away
          const tables =
            preview.placed.find((plan) => plan.entry === entry)?.tables ?? []
          const wasAdded = isAdded(entry)

          return (
            <li
              data-added={wasAdded || undefined}
              key={`${entry.poolId}-${entry.roundNumber}-${own?.team.id}-${other?.team.id}`}
            >
              {entry.ownNumber === null ? (
                <span
                  aria-hidden='true'
                  className='pool-team-mark'
                  data-empty
                />
              ) : (
                <PoolTeamMark number={entry.ownNumber} team={own?.team} />
              )}
              <span className='round-encounter-teams'>
                <span className='round-encounter-own'>{own?.team.name}</span>
                <span className='round-encounter-other'>
                  <Icon name='home' />
                  <span className='visually-hidden'>
                    {translate('organiser.round.home')}
                  </span>
                  {other?.team.name ?? translate('organiser.round.unknown')}
                </span>
                {wasAdded || tables.length === 0 ? null : (
                  <span className='round-encounter-tables'>
                    {translate('club.team.tablesChoice', {
                      count: tables.length,
                      tables: tables.map(String)
                    })}
                  </span>
                )}
              </span>
              {wasAdded ? (
                <span className='round-encounter-added'>
                  <Icon name='check' />
                  {translate('organiser.round.added')}
                </span>
              ) : other === null ? null : (
                <Button onPress={() => add([entry])}>
                  <Icon name='plus' />
                  {translate('organiser.round.add')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {entries.some((entry) => entry.isFromFederation) ? (
        <FederationSource />
      ) : null}
      {pendingHome.length < 2 ? null : (
        <Button onPress={() => add(pendingHome)} variant='primary'>
          <Icon name='plus' />
          {translate('organiser.round.addAll', { count: pendingHome.length })}
        </Button>
      )}
    </div>
  )
}
