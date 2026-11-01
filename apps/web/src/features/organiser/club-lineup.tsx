import type React from 'react'

import type { DirectoryPlayer } from '@scoreboard/protocol/club-record'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

import type { ClubSide } from '@scoreboard/core/club/club-encounter'

import { absentSeatsLast, seatPlayer } from '@/features/club/club-edits'
import {
  byRecentThenName,
  familyFirst,
  splitTypedName
} from '@/features/club/directory-search'
import { type Pick, PickField } from '@/features/club/pick-field'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

export type SeatedLineup = readonly (PlayerId | null)[]

type ClubLineupProps = {
  groupCount: number
  letters: readonly string[]
  lineup: SeatedLineup
  /** Adds a typed licensee to the side's club; his id, or `null` when the name will not do. */
  onAddPlayer: (typed: string) => PlayerId | null
  onChange: (lineup: SeatedLineup) => void
  side: ClubSide
}

const fullNameOf = (player: DirectoryPlayer): string =>
  `${player.firstName} ${player.lastName}`

/** How a side's composition reads folded: each letter and who holds it. */
export const lineupSummaryOf = ({
  letters,
  lineup,
  side
}: {
  letters: readonly string[]
  lineup: SeatedLineup
  side: ClubSide
}): string =>
  letters
    .map((letter, index) => {
      const player = side.club.players.find(
        (candidate) => candidate.id === lineup.at(index)
      )

      return `${letter} ${player?.lastName ?? '–'}`
    })
    .join(' · ')

/**
 * The club's players a letter offers: the team's last composition first, in
 * its order, then the most recently played; each with the letter he already
 * holds today and his ranking points.
 */
const playerPicksOf = ({
  letters,
  lineup,
  side
}: {
  letters: readonly string[]
  lineup: SeatedLineup
  side: ClubSide
}): Pick[] => {
  const lastTime = side.team.lineup
  const rankOf = (player: DirectoryPlayer) => {
    const seat = lastTime.indexOf(player.id)

    return seat === -1 ? lastTime.length : seat
  }

  return side.club.players
    .toSorted(
      (one, other) =>
        rankOf(one) - rankOf(other) || byRecentThenName(familyFirst)(one, other)
    )
    .map((player) => {
      const seat = lineup.indexOf(player.id)
      const detail = [
        seat === -1 ? null : letters.at(seat),
        player.points === null ? null : String(player.points)
      ]
        .filter((part) => part != null)
        .join(' · ')

      return {
        detail: detail === '' ? undefined : detail,
        id: player.id,
        label: fullNameOf(player)
      }
    })
}

/**
 * One side of the day's sheet, letter by letter, picked from its club's
 * players by their first letters, a newcomer typed in once. A seat left empty
 * in the first group is offered behind the second, where the club puts a
 * player away for the day.
 */
export const ClubLineup: React.FC<ClubLineupProps> = ({
  groupCount,
  letters,
  lineup,
  onAddPlayer,
  onChange,
  side
}) => {
  const translate = useTranslate()
  const picks = playerPicksOf({ letters, lineup, side })
  const groupSize = letters.length / Math.max(groupCount, 1)
  const absentLast = absentSeatsLast({
    groupSize,
    letterCount: letters.length,
    lineup
  })
  const emptyFirstLetters = letters
    .slice(0, groupSize)
    .filter((_, index) => (lineup.at(index) ?? null) === null)

  return (
    <fieldset className='club-lineup'>
      <legend className='club-lineup-team'>{side.team.name}</legend>
      <div className='club-lineup-letters'>
        {letters.map((letter, index) => (
          <PickField
            addLabel={(typed) =>
              splitTypedName(typed) === null
                ? null
                : translate('organiser.pick.addPlayer', { name: typed.trim() })
            }
            emptyLabel={(typed) =>
              translate('organiser.pick.fullName', { typed })
            }
            key={letter}
            label={letter}
            onAdd={onAddPlayer}
            onChange={(playerId) =>
              onChange(
                seatPlayer({
                  index,
                  playerId,
                  team: { ...side.team, lineup: [...lineup] }
                }).lineup
              )
            }
            picks={picks}
            placeholder={translate('club.team.nobody')}
            selectedId={lineup.at(index) ?? null}
          />
        ))}
      </div>
      {absentLast === null ? null : (
        <div className='club-lineup-absent'>
          <Icon name='move' />
          <p>
            {translate('organiser.clubEncounter.absentHint', {
              empty: emptyFirstLetters.join(', '),
              later: `${letters.at(groupSize) ?? ''}–${letters.at(-1) ?? ''}`
            })}
          </p>
          <Button onPress={() => onChange(absentLast)} variant='quiet'>
            {translate('organiser.clubEncounter.absentMove')}
          </Button>
        </div>
      )}
    </fieldset>
  )
}
