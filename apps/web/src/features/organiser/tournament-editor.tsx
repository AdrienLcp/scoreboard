import type React from 'react'
import { useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { EventSetup, Player, Team } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'
import { tableTennisBestOfs } from '@scoreboard/protocol/match-format'

import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'
import { tablesPerPool } from '@scoreboard/core/tournament/tournament-setup'

import { addOpponentClub, addTypedPlayer } from '@/features/club/club-edits'
import {
  byLastPlayed,
  latestPlayed,
  splitTypedName
} from '@/features/club/directory-search'
import { PickField } from '@/features/club/pick-field'
import { useClub } from '@/features/club/use-club'
import { useClubTranslate } from '@/features/club/use-club-translate'
import {
  newDirectoryClubId,
  newMatchId,
  newPlayerId
} from '@/infrastructure/ids'
import { useClubPath } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Switch } from '@/presentation/components/switch'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'

import {
  canBuildTournament,
  draftPoolsOf,
  hasClubmatesTogether,
  isTournamentUnderWay,
  swapPoolPlayers,
  type TiedGroup,
  type TournamentClub,
  type TournamentDraft,
  tiedGroupsOf,
  toggleClub,
  togglePlayer,
  tournamentClubsFor,
  tournamentDraftFor,
  tournamentTablesFor,
  tournamentTeamsFor,
  withDrawFor,
  withoutTournament,
  withTournament
} from './tournament-edits'

import './tournament-editor.sass'

/** How many clubs and players stand as chips before the search takes over: a Top 12 brings six clubs. */
const CHIPS_SHOWN = 8

/** The picked ones first, then the best suggestions, up to `CHIPS_SHOWN`. */
const chipsOf = <T extends { id: string }>(
  entries: readonly T[],
  pickedIds: readonly string[]
): T[] => {
  const picked = entries.filter((entry) => pickedIds.includes(entry.id))
  const others = entries.filter((entry) => !pickedIds.includes(entry.id))

  return [
    ...picked,
    ...others.slice(0, Math.max(0, CHIPS_SHOWN - picked.length))
  ]
}

const WIN_POINTS = [1, 2, 3] as const
const LOSS_POINTS = [0, 1] as const

type TournamentEditorProps = {
  matches: readonly MatchView[]
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

const swatchStyle = (colour: string): React.CSSProperties => ({
  '--team': colour
})

const Swatch: React.FC<{ colour: string }> = ({ colour }) => (
  <span
    aria-hidden='true'
    className='tournament-swatch'
    data-white={colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR || undefined}
    style={swatchStyle(colour)}
  />
)

/** A short row of numbers, one picked: points for a win, games to win. */
const NumberChoice: React.FC<{
  label: string
  onChange: (value: number) => void
  options: readonly number[]
  optionLabel?: (value: number) => string
  value: number
}> = ({ label, onChange, optionLabel, options, value }) => (
  <div className='tournament-choice'>
    <span className='tournament-choice-label'>{label}</span>
    <ToggleButtonGroup
      aria-label={label}
      disallowEmptySelection
      onSelectionChange={(keys) => {
        const [picked] = [...keys]

        if (picked !== undefined) {
          onChange(Number(picked))
        }
      }}
      selectedKeys={[String(value)]}
      selectionMode='single'
    >
      {options.map((option) => (
        <ToggleButton id={String(option)} key={option}>
          {optionLabel?.(option) ?? option}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </div>
)

/**
 * Players level after the tie-break, in one finished pool: they share their
 * place until the organiser draws them, then stand in the draw's order.
 */
const TieDraw: React.FC<{
  group: TiedGroup
  onDraw: () => void
  playerOf: (playerId: PlayerId) => Player | undefined
  teamOf: (teamId: TeamId | null) => Team | undefined
}> = ({ group, onDraw, playerOf, teamOf }) => {
  const translate = useClubTranslate()
  const lastRank = group.firstRank + group.playerIds.length - 1

  return (
    <section className='tournament-pool tournament-tie'>
      <h3>
        {translate(
          group.playerIds.length === 2
            ? 'organiser.tournament.tiePair'
            : 'organiser.tournament.tieGroup',
          {
            first: group.firstRank,
            last: lastRank,
            pool: group.poolNumber
          }
        )}
      </h3>
      <ol>
        {group.playerIds.map((playerId, index) => {
          const player = playerOf(playerId)
          const team = teamOf(player?.teamId ?? null)

          return (
            <li className='tournament-tie-player' key={playerId}>
              <span className='tournament-number'>
                {group.isDrawn ? group.firstRank + index : group.firstRank}
              </span>
              <Swatch colour={team?.colour ?? DEFAULT_OPPONENT_COLOUR} />
              <span className='tournament-entrant-name'>
                {player?.name ?? ''}
                <small>{team?.name}</small>
              </span>
            </li>
          )
        })}
      </ol>
      <Button onPress={onDraw}>
        <Icon name='shuffle' />
        {translate(
          group.isDrawn
            ? 'organiser.tournament.drawAgain'
            : 'organiser.tournament.draw'
        )}
      </Button>
    </section>
  )
}

/**
 * The Top 12 in a few taps: the clubs, which bring their two best players,
 * the pools seeded by themselves, the clubs' rules already set, and every
 * match built on the hall's tables. Each change is undone in one tap.
 */
export const TournamentEditor: React.FC<TournamentEditorProps> = ({
  matches,
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const clubPath = useClubPath()
  const club = useClub()
  const { state } = club
  const record = state.status === 'ready' ? state.record : null
  const [draft, setDraft] = useState<TournamentDraft>(() =>
    tournamentDraftFor(setup)
  )
  const [previous, setPrevious] = useState<EventSetup | null>(null)
  const [swapping, setSwapping] = useState<PlayerId | null>(null)
  const clubs = tournamentClubsFor({ record, setup })
  const directoryClubs =
    record === null ? [] : [record.own, ...record.opponents]
  const lastPlayedOf = (clubId: TeamId) => {
    const entry = directoryClubs.find((candidate) => candidate.id === clubId)

    return {
      lastPlayedOn:
        entry === undefined
          ? undefined
          : latestPlayed([...entry.teams, ...entry.players])
    }
  }
  /** The club's own first, then those met most recently. */
  const suggestedClubs = clubs.toSorted((one, other) =>
    one.id === record?.own.id
      ? -1
      : other.id === record?.own.id
        ? 1
        : byLastPlayed(lastPlayedOf(one.id), lastPlayedOf(other.id))
  )
  const teams = tournamentTeamsFor({ clubs, draft, setup })
  const colourOf = (teamId: TeamId | null): string =>
    teams.find((team: Team) => team.id === teamId)?.colour ??
    DEFAULT_OPPONENT_COLOUR
  const players = clubs.flatMap((club) => club.players)
  const playerOf = (playerId: PlayerId) =>
    players.find((player) => player.id === playerId) ??
    setup.players.find((player) => player.id === playerId)
  const pools = draftPoolsOf({ clubs, draft })
  const tables = tournamentTablesFor({ pools, setup })
  const isUnderWay = isTournamentUnderWay(matches)
  const tiedGroups = tiedGroupsOf({ matches, setup })
  const hasTournament =
    setup.tournament !== null && setup.tournament !== undefined
  const stagedCount = setup.matches.filter(
    (match) => match.stage != null
  ).length
  const plannedCount =
    pools.reduce(
      (sum, pool) => sum + (pool.length * (pool.length - 1)) / 2,
      0
    ) +
    3 +
    (draft.hasThirdPlace ? 1 : 0)
  const isBuildable = canBuildTournament(pools)

  const save = (next: EventSetup) => {
    if (onSave(next)) {
      setPrevious(setup)
      setSwapping(null)
    }
  }
  const edit = (next: TournamentDraft) => {
    setDraft(next)
    setSwapping(null)
  }
  const tapPoolPlayer = (playerId: PlayerId) => {
    if (swapping === null) {
      setSwapping(playerId)

      return
    }

    if (swapping !== playerId) {
      setDraft({
        ...draft,
        pools: swapPoolPlayers({ first: swapping, pools, second: playerId })
      })
    }

    setSwapping(null)
  }

  const undo =
    previous === null ? null : (
      <Button
        onPress={() => {
          if (onSave(previous)) {
            setDraft(tournamentDraftFor(previous))
            setPrevious(null)
          }
        }}
        variant='quiet'
      >
        <Icon name='undo' />
        {translate('organiser.tournament.undo')}
      </Button>
    )

  const poolCards = (
    <div className='tournament-pools'>
      {pools.map((pool, index) => (
        <div className='tournament-pool' key={String(index + 1)}>
          <h3>
            {translate('organiser.tournament.pool', {
              number: index + 1
            })}
          </h3>
          <ol>
            {pool.map((playerId, at) => {
              const player = playerOf(playerId)

              return (
                <li key={playerId}>
                  <AriaButton
                    aria-pressed={swapping === playerId}
                    className='tournament-entrant'
                    isDisabled={isUnderWay}
                    onPress={() => tapPoolPlayer(playerId)}
                  >
                    <span className='tournament-number'>{at + 1}</span>
                    <Swatch colour={colourOf(player?.teamId ?? null)} />
                    <span className='tournament-entrant-name'>
                      {player?.name ?? ''}
                      <small>
                        {teams.find((team) => team.id === player?.teamId)?.name}
                      </small>
                    </span>
                    {player?.points == null ? null : (
                      <span className='tournament-points'>{player.points}</span>
                    )}
                  </AriaButton>
                </li>
              )
            })}
          </ol>
          {hasClubmatesTogether({ clubs, pool }) ? (
            <p className='tournament-warning'>
              <Icon name='alert' />
              {translate('organiser.tournament.clubmates')}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )

  if (isUnderWay) {
    return (
      <div className='tournament-editor'>
        <p className='organiser-note'>
          {translate('organiser.tournament.underWay')}
        </p>
        {poolCards}
        {tiedGroups.length === 0 ? null : (
          <div className='tournament-ties'>
            <p className='organiser-note'>
              {translate('organiser.tournament.drawHint')}
            </p>
            {tiedGroups.map((group) => (
              <TieDraw
                group={group}
                key={group.playerIds.join()}
                onDraw={() =>
                  save(
                    withDrawFor({
                      playerIds: group.playerIds,
                      random: Math.random,
                      setup
                    })
                  )
                }
                playerOf={playerOf}
                teamOf={(teamId) => teams.find((team) => team.id === teamId)}
              />
            ))}
          </div>
        )}
        {undo}
      </div>
    )
  }

  const tablesOfPool = (playerIds: PlayerId[]) =>
    tablesPerPool({ id: '', name: '', playerIds })
  const poolTables = pools.map((pool, index) => {
    const first = pools
      .slice(0, index)
      .reduce((sum, earlier) => sum + tablesOfPool(earlier), 0)

    return tables.slice(first, first + tablesOfPool(pool))
  })

  return (
    <div className='tournament-editor'>
      <section className='tournament-section'>
        <h2 className='organiser-subheading'>
          {translate('organiser.tournament.clubs')}
        </h2>
        {clubs.length === 0 ? (
          <div className='tournament-empty'>
            <p className='organiser-empty'>
              {translate('organiser.tournament.noClub')}
            </p>
            <ButtonLink href={clubPath}>
              <Icon name='open' />
              {translate('organiser.clubEncounter.prepare')}
            </ButtonLink>
          </div>
        ) : (
          <>
            <p className='organiser-note'>
              {translate('organiser.tournament.clubsHint')}
            </p>
            <ul className='tournament-chips'>
              {chipsOf(suggestedClubs, draft.clubIds).map(
                (entry: TournamentClub) => {
                  const isPicked = draft.clubIds.includes(entry.id)

                  return (
                    <li key={entry.id}>
                      <AriaButton
                        aria-pressed={isPicked}
                        className='tournament-chip'
                        onPress={() => edit(toggleClub({ club: entry, draft }))}
                      >
                        <Swatch
                          colour={
                            isPicked
                              ? colourOf(entry.id)
                              : (entry.colour ?? DEFAULT_OPPONENT_COLOUR)
                          }
                        />
                        <span className='tournament-chip-name'>
                          {entry.name}
                        </span>
                        {isPicked ? <Icon name='check' /> : null}
                      </AriaButton>
                    </li>
                  )
                }
              )}
            </ul>
            {record === null ? null : (
              <PickField
                addLabel={(typed) =>
                  translate('organiser.pick.addClub', { name: typed.trim() })
                }
                emptyLabel={(typed) =>
                  translate('organiser.pick.none', { typed })
                }
                label={translate('organiser.tournament.otherClub')}
                onAdd={(typed) => {
                  const clubId = newDirectoryClubId()
                  const name = typed.trim()

                  club.change(
                    addOpponentClub({ name, newClubId: () => clubId, record })
                  )
                  edit(
                    toggleClub({
                      club: {
                        colour: null,
                        id: clubId,
                        logoUrl: null,
                        name,
                        players: []
                      },
                      draft
                    })
                  )

                  return null
                }}
                onChange={(clubId) => {
                  const entry = clubs.find(
                    (candidate) => candidate.id === clubId
                  )

                  if (entry !== undefined) {
                    edit(toggleClub({ club: entry, draft }))
                  }
                }}
                picks={suggestedClubs
                  .filter((entry) => !draft.clubIds.includes(entry.id))
                  .map((entry) => ({ id: entry.id, label: entry.name }))}
                placeholder={translate('organiser.pick.clubPlaceholder')}
                selectedId={null}
              />
            )}
          </>
        )}
      </section>

      {draft.clubIds.length === 0 ? null : (
        <section className='tournament-section'>
          <h2 className='organiser-subheading'>
            {translate('organiser.tournament.players')}
          </h2>
          <p className='organiser-note'>
            {translate('organiser.tournament.playersHint')}
          </p>
          <div className='tournament-clubs'>
            {draft.clubIds.flatMap((clubId) => {
              const entry = clubs.find((candidate) => candidate.id === clubId)

              if (entry === undefined) {
                return []
              }

              const unpicked = entry.players.filter(
                (player) => !draft.playerIds.includes(player.id)
              )
              const canAdd =
                record !== null &&
                directoryClubs.some((candidate) => candidate.id === entry.id)

              return [
                <div className='tournament-club' key={entry.id}>
                  <h3>
                    <Swatch colour={colourOf(entry.id)} />
                    {entry.name}
                  </h3>
                  <ul className='tournament-chips'>
                    {chipsOf(entry.players, draft.playerIds).map((player) => (
                      <li key={player.id}>
                        <AriaButton
                          aria-pressed={draft.playerIds.includes(player.id)}
                          className='tournament-chip'
                          onPress={() =>
                            edit(togglePlayer({ draft, playerId: player.id }))
                          }
                        >
                          <span className='tournament-chip-name'>
                            {player.name}
                          </span>
                          {player.points === null ? null : (
                            <small className='tournament-points'>
                              {player.points}
                            </small>
                          )}
                        </AriaButton>
                      </li>
                    ))}
                  </ul>
                  {!canAdd && unpicked.length <= CHIPS_SHOWN ? null : (
                    <PickField
                      addLabel={(typed) =>
                        splitTypedName(typed) === null
                          ? null
                          : translate('organiser.pick.addPlayer', {
                              name: typed.trim()
                            })
                      }
                      emptyLabel={(typed) =>
                        translate(
                          canAdd
                            ? 'organiser.pick.fullName'
                            : 'organiser.pick.none',
                          { typed }
                        )
                      }
                      label={translate('organiser.tournament.otherPlayer')}
                      onAdd={
                        record === null || !canAdd
                          ? undefined
                          : (typed) => {
                              const added = addTypedPlayer({
                                clubId: entry.id,
                                newPlayerId,
                                record,
                                typed
                              })

                              if (added !== null) {
                                club.change(added.record)
                                edit(
                                  togglePlayer({
                                    draft,
                                    playerId: added.playerId
                                  })
                                )
                              }

                              return null
                            }
                      }
                      onChange={(playerId) => {
                        if (playerId !== null) {
                          edit(togglePlayer({ draft, playerId }))
                        }
                      }}
                      picks={unpicked.map((player) => ({
                        detail:
                          player.points === null
                            ? undefined
                            : String(player.points),
                        id: player.id,
                        label: player.name
                      }))}
                      placeholder={translate(
                        'organiser.pick.playerPlaceholder'
                      )}
                      selectedId={null}
                    />
                  )}
                </div>
              ]
            })}
          </div>
        </section>
      )}

      {draft.playerIds.length === 0 ? null : (
        <section className='tournament-section'>
          <h2 className='organiser-subheading'>
            {translate('organiser.tournament.pools')}
          </h2>
          <div className='tournament-hint'>
            <p aria-live='polite' className='organiser-note'>
              {translate(
                swapping === null
                  ? 'organiser.tournament.poolsHint'
                  : 'organiser.tournament.swapping'
              )}
            </p>
            {draft.pools === null ? null : (
              <Button
                onPress={() => edit({ ...draft, pools: null })}
                variant='quiet'
              >
                <Icon name='sync' />
                {translate('organiser.tournament.reseed')}
              </Button>
            )}
          </div>
          {poolCards}
        </section>
      )}

      <section className='tournament-section'>
        <h2 className='organiser-subheading'>
          {translate('organiser.tournament.rules')}
        </h2>
        <div className='tournament-rules'>
          <NumberChoice
            label={translate('organiser.matches.bestOf')}
            onChange={(bestOf) => {
              const picked = tableTennisBestOfs.find(
                (option) => option === bestOf
              )

              if (picked !== undefined) {
                edit({ ...draft, bestOf: picked })
              }
            }}
            optionLabel={(bestOf) =>
              translate('organiser.matches.bestOfOption', {
                count: Math.ceil(bestOf / 2)
              })
            }
            options={tableTennisBestOfs}
            value={draft.bestOf}
          />
          <NumberChoice
            label={translate('organiser.tournament.winPoints')}
            onChange={(winPoints) => edit({ ...draft, winPoints })}
            options={WIN_POINTS}
            value={draft.winPoints}
          />
          <NumberChoice
            label={translate('organiser.tournament.lossPoints')}
            onChange={(lossPoints) => edit({ ...draft, lossPoints })}
            options={LOSS_POINTS}
            value={draft.lossPoints}
          />
          <Switch
            isSelected={draft.hasThirdPlace}
            onChange={(hasThirdPlace) => edit({ ...draft, hasThirdPlace })}
          >
            {translate('organiser.tournament.thirdPlaceSwitch')}
          </Switch>
        </div>
      </section>

      {isBuildable ? (
        <section className='tournament-section'>
          <h2 className='organiser-subheading'>
            {translate('organiser.tournament.tables')}
          </h2>
          <ul className='tournament-tables'>
            {poolTables.map((run, index) => (
              <li key={String(index + 1)}>
                {translate('organiser.tournament.tablesPool', {
                  number: index + 1,
                  tables: run.map(String)
                })}
              </li>
            ))}
            <li>
              {translate('organiser.tournament.tablesBracket', {
                first: tables[0] ?? 1,
                second: tables[1] ?? 2
              })}
            </li>
          </ul>
          <p className='organiser-note'>
            {translate('organiser.tournament.tablesHint')}
          </p>
        </section>
      ) : null}

      <div className='tournament-actions'>
        {hasTournament ? (
          <p className='tournament-ready'>
            <Icon name='check' />
            {translate('organiser.tournament.ready', { count: stagedCount })}
          </p>
        ) : isBuildable ? null : (
          <p className='organiser-note'>
            {translate('organiser.tournament.needPlayers')}
          </p>
        )}
        <Button
          isDisabled={!isBuildable}
          onPress={() =>
            save(
              withTournament({
                clubs,
                draft,
                labels: {
                  final: translate('organiser.tournament.final'),
                  poolMatch: (_, home, away) =>
                    translate('organiser.tournament.poolMatch', { away, home }),
                  semiFinal: (slot) =>
                    translate('organiser.tournament.semiFinal', { slot }),
                  thirdPlace: translate('organiser.tournament.thirdPlace')
                },
                newMatchId,
                poolName: (number) => String(number),
                setup
              })
            )
          }
          variant='primary'
        >
          <Icon name={hasTournament ? 'sync' : 'plus'} />
          {translate(
            hasTournament
              ? 'organiser.tournament.rebuild'
              : 'organiser.tournament.build',
            { count: plannedCount }
          )}
        </Button>
        <div className='tournament-secondary'>
          {undo}
          {hasTournament ? (
            <Button
              onPress={() => save(withoutTournament(setup))}
              variant='quiet'
            >
              <Icon name='close' />
              {translate('organiser.tournament.remove')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
