import type React from 'react'

import type {
  ChampionshipPool,
  Fixture,
  FixtureResult
} from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { Side } from '@scoreboard/protocol/side'

import { fixtureTeamsOf } from '@scoreboard/core/championship/championship-calendar'
import {
  isSameResult,
  resultChoicesFor
} from '@scoreboard/core/championship/championship-results'
import { outcomeFor } from '@scoreboard/core/championship/championship-standings'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import { matchPointsFor } from '@scoreboard/core/encounter/match-points'
import { opponentOf } from '@scoreboard/core/match/opponent'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { scoreText, versusText } from '@/features/event/score-text'
import { ChoiceField } from '@/features/organiser/choice-field'
import { dayAsDate } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'

import {
  type FixtureAt,
  invertedFixture,
  pickedResult
} from './championship-edits'
import { clubSideOf, isOwnTeam } from './club-teams'
import { numbered } from './numbered'

type PoolRoundsProps = {
  onChange: (pool: ChampionshipPool) => void
  pool: ChampionshipPool
  record: ClubRecord
}

const NO_RESULT = 'none'

const resultIdOf = (result: FixtureResult | null): string => {
  if (result === null) {
    return NO_RESULT
  }

  return result.forfeit === null
    ? `${result.score.home}-${result.score.away}`
    : `forfeit-${result.forfeit}`
}

/** The sheet our teams play on: the first of ours in the pool, the club's default otherwise. */
const sheetOf = (pool: ChampionshipPool, record: ClubRecord) => {
  const ours = record.own.teams.find((team) => pool.teams.includes(team.id))

  return {
    format: encounterFormatFor(ours?.formatId ?? 'fftt-6-players-20-games'),
    matchPoints: matchPointsFor(ours?.matchPoints ?? 'one-per-win')
  }
}

const ownSideOf = (
  pool: ChampionshipPool,
  record: ClubRecord,
  fixture: Fixture
): Side | null => {
  const teams = fixtureTeamsOf(pool, fixture)

  if (isOwnTeam(record, teams.home)) {
    return 'home'
  }

  return isOwnTeam(record, teams.away) ? 'away' : null
}

/** "J3 · dim. 12 oct.": a round's number and its date, as the calendar heads it. */
const RoundHead: React.FC<{ date: string | null; index: number }> = ({
  date,
  index
}) => {
  const translate = useClubTranslate()

  return (
    <>
      <span className='pool-round-number'>
        {translate('club.championship.rounds.short', {
          number: String(index + 1)
        })}
      </span>
      <span className='pool-round-date'>
        {date === null
          ? translate('club.championship.rounds.undated')
          : translate('club.championship.rounds.date', { at: dayAsDate(date) })}
      </span>
    </>
  )
}

/**
 * The pool's rounds, ours on each line: where we play, against whom, how it
 * ended. Open, a round lists every encounter of the day with its result
 * picked in one choice, ours first; the standings follow.
 */
export const PoolRounds: React.FC<PoolRoundsProps> = ({
  onChange,
  pool,
  record
}) => {
  const translate = useClubTranslate()
  const choices = resultChoicesFor(sheetOf(pool, record))
  const nameOf = (teamId: string | null, number: number) =>
    clubSideOf(record, teamId)?.team.name ??
    translate('club.championship.unknownTeam', { number: String(number) })

  const resultLabel = (
    result: FixtureResult,
    names: Record<Side, string>
  ): string =>
    result.forfeit === null
      ? scoreText(result.score.home, result.score.away)
      : translate('club.championship.rounds.forfeit', {
          name: names[result.forfeit]
        })

  return (
    <div className='pool-rounds'>
      <h4 className='club-label'>
        {translate('club.championship.rounds.title')}
      </h4>
      <ol>
        {numbered(pool.rounds).map(({ entry: round, number }) => {
          const roundIndex = number - 1
          const placed = round.fixtures.map((fixture, fixtureIndex) => ({
            at: { fixtureIndex, roundIndex } satisfies FixtureAt,
            fixture,
            ownSide: ownSideOf(pool, record, fixture)
          }))
          const ours = placed.filter((entry) => entry.ownSide !== null)
          const ordered = [
            ...ours,
            ...placed.filter((entry) => entry.ownSide === null)
          ]

          return (
            <li key={number}>
              <Disclosure className='pool-round'>
                <Button
                  className='pool-round-trigger'
                  slot='trigger'
                  variant='quiet'
                >
                  <RoundHead date={round.date} index={roundIndex} />
                  <span className='pool-round-ours'>
                    {ours.length === 0 ? (
                      <span className='pool-round-line'>
                        {translate('club.championship.rounds.rest')}
                      </span>
                    ) : (
                      ours.map(({ fixture, ownSide }) => {
                        const side = ownSide ?? 'home'
                        const other = opponentOf(side)
                        const teams = fixtureTeamsOf(pool, fixture)
                        const outcome =
                          fixture.result === null
                            ? null
                            : outcomeFor(fixture.result, side)

                        return (
                          <span
                            className='pool-round-line'
                            data-lost={
                              outcome === 'loss' ||
                              outcome === 'forfeit' ||
                              undefined
                            }
                            key={`${fixture.home}-${fixture.away}`}
                          >
                            <Icon name={side === 'home' ? 'home' : 'away'} />
                            <span className='visually-hidden'>
                              {translate(
                                side === 'home'
                                  ? 'club.championship.rounds.home'
                                  : 'club.championship.rounds.away'
                              )}
                            </span>
                            <span className='pool-round-opponent'>
                              {nameOf(teams[other], fixture[other])}
                            </span>
                            {fixture.result === null ? null : (
                              <span className='pool-round-score'>
                                {fixture.result.forfeit === null
                                  ? scoreText(
                                      fixture.result.score[side],
                                      fixture.result.score[other]
                                    )
                                  : translate(
                                      outcome === 'forfeit'
                                        ? 'club.championship.rounds.forfeitOurs'
                                        : 'club.championship.rounds.forfeitTheirs'
                                    )}
                              </span>
                            )}
                          </span>
                        )
                      })
                    )}
                  </span>
                  <Icon name='chevronDown' />
                </Button>
                <DisclosurePanel>
                  <ul className='pool-fixtures'>
                    {ordered.map(({ at, fixture, ownSide }) => {
                      const teams = fixtureTeamsOf(pool, fixture)
                      const names = {
                        away: nameOf(teams.away, fixture.away),
                        home: nameOf(teams.home, fixture.home)
                      }
                      const { result } = fixture
                      const listed =
                        result === null ||
                        choices.some((choice) => isSameResult(choice, result))
                          ? choices
                          : [result, ...choices]

                      return (
                        <li
                          data-own={ownSide !== null || undefined}
                          key={`${fixture.home}-${fixture.away}`}
                        >
                          <ChoiceField
                            choices={[
                              {
                                id: NO_RESULT,
                                label: translate(
                                  'club.championship.rounds.notPlayed'
                                )
                              },
                              ...listed.map((choice) => ({
                                id: resultIdOf(choice),
                                label: resultLabel(choice, names)
                              }))
                            ]}
                            label={versusText(names.home, names.away)}
                            onChange={(id) =>
                              onChange(
                                pickedResult({
                                  at,
                                  pool,
                                  result:
                                    listed.find(
                                      (choice) => resultIdOf(choice) === id
                                    ) ?? null
                                })
                              )
                            }
                            selectedId={resultIdOf(fixture.result)}
                          />
                          <Button
                            aria-label={translate(
                              'club.championship.rounds.invert',
                              { name: names.away }
                            )}
                            className='pool-fixture-invert'
                            onPress={() =>
                              onChange(invertedFixture({ at, pool }))
                            }
                            variant='quiet'
                          >
                            <Icon name='swap' />
                          </Button>
                          {fixture.playedAs === null ? null : (
                            <p className='pool-fixture-sheet'>
                              <Icon name='sync' />
                              {translate(
                                result === null
                                  ? 'club.championship.rounds.followed'
                                  : 'club.championship.rounds.fromSheet'
                              )}
                            </p>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </DisclosurePanel>
              </Disclosure>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
