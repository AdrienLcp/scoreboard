import type React from 'react'

import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { FederationSource } from '@/features/club/federation-source'
import type { RoundEntry } from '@/features/club/round-entries'
import { withPlayedEntries } from '@/features/club/round-entries'
import { useClub } from '@/features/club/use-club'
import { useClubTranslate } from '@/features/club/use-club-translate'
import { paintOf } from '@/features/event/team-paint'
import { dayAsDate } from '@/infrastructure/dates'
import { newEncounterId, newMatchId } from '@/infrastructure/ids'
import { organiserPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import type { Translate } from '@/presentation/i18n/translation'
import { apiErrorKey } from '@/presentation/i18n/translation'

import {
  type ClubRound,
  roundEventInput,
  roundEventOf,
  roundProgressIn,
  standingTableCountOf
} from './club-day'
import { useDefaultPlanName } from './default-plan-name'
import { useCreateEvent } from './use-create-event'

import './club-round.sass'

/** The round's number and day: the headline, and the name of the event it opens. */
const roundTitleOf = (translate: Translate, round: ClubRound): string => {
  if (round.number !== null && round.date !== null) {
    return translate('home.round.title', {
      at: dayAsDate(round.date),
      number: String(round.number)
    })
  }

  if (round.number !== null) {
    return translate('home.round.titleNoDate', {
      number: String(round.number)
    })
  }

  return round.date === null
    ? translate('home.round.titleOpen')
    : translate('home.round.titleOn', { at: dayAsDate(round.date) })
}

const TeamChip: React.FC<{ team: DirectoryTeam }> = ({ team }) => {
  const paint = paintOf(team)

  return (
    <span
      className='club-round-team'
      data-white={paint.isWhite || undefined}
      style={{ background: paint.colour, color: paint.textColour }}
    >
      {team.name}
    </span>
  )
}

const awayLineOf = (translate: Translate, entries: readonly RoundEntry[]) =>
  translate('home.round.away', {
    fixtures: entries
      .map((entry) =>
        entry.home === null
          ? translate('home.round.awayOpen', {
              team: entry.away?.team.name ?? ''
            })
          : translate('home.round.awayAt', {
              host: entry.home.team.name,
              team: entry.away?.team.name ?? ''
            })
      )
      .join(' · ')
  })

type ClubRoundProps = {
  organisedEventIds: readonly EventId[]
  record: ClubRecord
  round: ClubRound
}

/**
 * The club's next championship round: our encounters at home with the
 * tables they go on and the away ones in a line, prepared in one tap with
 * the default plan and each team's last composition, then picked up again.
 */
export const ClubRoundSection: React.FC<ClubRoundProps> = ({
  organisedEventIds,
  record,
  round
}) => {
  const translate = useClubTranslate()
  const { edit } = useClub()
  const { create, state } = useCreateEvent()
  const planName = useDefaultPlanName(record)
  const title = roundTitleOf(translate, round)
  const eventId = roundEventOf(round, organisedEventIds)
  const draft = (name: string) =>
    roundEventInput({ name, newEncounterId, newMatchId, record, round })
  const preview = eventId === null ? draft(title).placed : []
  const progress = eventId === null ? null : roundProgressIn(round, eventId)

  const prepare = () => {
    const { input, placed } = draft(title)

    void create(input, (createdId) =>
      edit((current) =>
        withPlayedEntries({ eventId: createdId, placed, record: current })
      )
    )
  }

  const sideOf = (entry: RoundEntry): React.ReactNode => {
    const playedAs = entry.kept?.fixture.playedAs
    const result = entry.kept?.fixture.result ?? null

    if (result !== null) {
      return `${result.score.home}–${result.score.away}`
    }

    if (eventId !== null && playedAs?.eventId === eventId) {
      return (
        <>
          <Icon name='check' />
          <span className='visually-hidden'>
            {translate('organiser.round.added')}
          </span>
        </>
      )
    }

    if (entry.away === null) {
      return null
    }

    const tables =
      preview.find((placed) => placed.entry === entry)?.tables ?? []

    return tables.length === 0
      ? translate('home.round.noTables')
      : translate('club.team.tablesChoice', {
          count: tables.length,
          tables: tables.map(String)
        })
  }

  return (
    <section aria-labelledby='club-round-title' className='club-round'>
      <h1 className='home-hero' id='club-round-title'>
        {title}
      </h1>
      <p className='home-summary'>
        {[
          round.phase === null
            ? translate('home.round.summaryMixed')
            : translate('home.round.summaryPhase', {
                phase: String(round.phase)
              }),
          round.home.length === 0
            ? translate('home.round.summaryAway')
            : translate('home.round.summaryHome', {
                count: round.home.length,
                tables: standingTableCountOf(record)
              })
        ].join(' ')}
      </p>
      {round.home.length === 0 ? null : (
        <ul className='club-round-list'>
          {round.home.map((entry) => (
            <li
              key={`${entry.poolId}-${entry.home?.team.id}-${entry.away?.team.id}`}
            >
              {entry.home === null ? null : <TeamChip team={entry.home.team} />}
              <span className='club-round-receives'>
                {translate('home.round.receives')}
              </span>
              {entry.away === null ? (
                <span className='club-round-open'>
                  {translate('organiser.round.unknown')}
                </span>
              ) : (
                <TeamChip team={entry.away.team} />
              )}
              <span className='club-round-side'>{sideOf(entry)}</span>
            </li>
          ))}
        </ul>
      )}
      {round.away.length === 0 ? null : (
        <p className='club-round-away'>{awayLineOf(translate, round.away)}</p>
      )}
      {round.isFromFederation ? <FederationSource /> : null}
      {eventId !== null && progress !== null ? (
        <div className='club-round-actions'>
          <ButtonLink href={organiserPathFor(eventId)} variant='primary'>
            {translate('home.round.resume')}
            <Icon name='arrowRight' />
          </ButtonLink>
          <p className='home-hint'>
            {progress.finished === 0
              ? translate('home.round.ready')
              : progress.finished === progress.total
                ? translate('home.round.done')
                : translate('home.round.progress', {
                    finished: progress.finished,
                    total: String(progress.total)
                  })}
          </p>
        </div>
      ) : preview.length === 0 ? null : (
        <div className='club-round-actions'>
          <Button
            isPending={state.status === 'creating'}
            onPress={prepare}
            variant='primary'
          >
            {translate('home.round.prepare')}
            <Icon name='arrowRight' />
          </Button>
          {state.status === 'failed' ? (
            <p className='home-alert' role='alert'>
              <Icon name='alert' />
              {translate(apiErrorKey(state.error))}
            </p>
          ) : (
            <p className='home-hint'>
              {translate('home.round.prepareNote', { plan: planName })}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
