import type React from 'react'
import { useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { EventSetup, Team } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'
import { tableTennisBestOfs } from '@scoreboard/protocol/match-format'

import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'
import { tablesPerPool } from '@scoreboard/core/tournament/tournament-setup'

import { useClub } from '@/features/club/use-club'
import { newMatchId } from '@/infrastructure/ids'
import { paths } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Switch } from '@/presentation/components/switch'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  canBuildTournament,
  draftPoolsOf,
  drawnPlayersOf,
  hasClubmatesTogether,
  isTournamentUnderWay,
  swapPoolPlayers,
  type TournamentClub,
  type TournamentDraft,
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
 * The Top 12 in a few taps: the clubs, which bring their two best players,
 * the pools seeded by themselves, the clubs' rules already set, and every
 * match built on the hall's tables. Each change is undone in one tap.
 */
export const TournamentEditor: React.FC<TournamentEditorProps> = ({
  matches,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const { state } = useClub()
  const [draft, setDraft] = useState<TournamentDraft>(() =>
    tournamentDraftFor(setup)
  )
  const [previous, setPrevious] = useState<EventSetup | null>(null)
  const [swapping, setSwapping] = useState<PlayerId | null>(null)
  const clubs = tournamentClubsFor({
    record: state.status === 'ready' ? state.record : null,
    setup
  })
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
  const drawn = drawnPlayersOf({ matches, setup })
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
        {drawn.length === 0 ? null : (
          <div className='organiser-panel tournament-draw'>
            <p className='organiser-note'>
              {translate('organiser.tournament.drawHint')}
            </p>
            <Button
              onPress={() =>
                save(
                  withDrawFor({ playerIds: drawn, random: Math.random, setup })
                )
              }
            >
              <Icon name='shuffle' />
              {translate(
                (setup.tournament?.drawOrder.length ?? 0) === 0
                  ? 'organiser.tournament.draw'
                  : 'organiser.tournament.drawAgain'
              )}
            </Button>
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
            <ButtonLink href={paths.club}>
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
              {clubs.map((club: TournamentClub) => {
                const isPicked = draft.clubIds.includes(club.id)

                return (
                  <li key={club.id}>
                    <AriaButton
                      aria-pressed={isPicked}
                      className='tournament-chip'
                      onPress={() => edit(toggleClub({ club, draft }))}
                    >
                      <Swatch
                        colour={
                          isPicked
                            ? colourOf(club.id)
                            : (club.colour ?? DEFAULT_OPPONENT_COLOUR)
                        }
                      />
                      <span className='tournament-chip-name'>{club.name}</span>
                      {isPicked ? <Icon name='check' /> : null}
                    </AriaButton>
                  </li>
                )
              })}
            </ul>
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
              const club = clubs.find((candidate) => candidate.id === clubId)

              return club === undefined
                ? []
                : [
                    <div className='tournament-club' key={club.id}>
                      <h3>
                        <Swatch colour={colourOf(club.id)} />
                        {club.name}
                      </h3>
                      <ul className='tournament-chips'>
                        {club.players.map((player) => (
                          <li key={player.id}>
                            <AriaButton
                              aria-pressed={draft.playerIds.includes(player.id)}
                              className='tournament-chip'
                              onPress={() =>
                                edit(
                                  togglePlayer({ draft, playerId: player.id })
                                )
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
