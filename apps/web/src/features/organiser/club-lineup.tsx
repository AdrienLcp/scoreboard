import type React from 'react'

import type { PlayerId } from '@scoreboard/protocol/identifiers'

import type { ClubSide } from '@scoreboard/core/club/club-encounter'

import { seatPlayer } from '@/features/club/club-edits'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'

export type SeatedLineup = readonly (PlayerId | null)[]

type ClubLineupProps = {
  letters: readonly string[]
  lineup: SeatedLineup
  onChange: (lineup: SeatedLineup) => void
  side: ClubSide
}

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

/** One side of the day's sheet, letter by letter, from its club's players. */
export const ClubLineup: React.FC<ClubLineupProps> = ({
  letters,
  lineup,
  onChange,
  side
}) => {
  const translate = useTranslate()
  const players = side.club.players.map((player) => ({
    id: player.id,
    label: `${player.firstName} ${player.lastName}`
  }))

  return (
    <fieldset className='club-lineup'>
      <legend className='club-lineup-team'>{side.team.name}</legend>
      <div className='club-lineup-letters'>
        {letters.map((letter, index) => (
          <ChoiceField
            choices={players}
            key={letter}
            label={letter}
            onChange={(playerId) =>
              onChange(
                seatPlayer({
                  index,
                  playerId,
                  team: { ...side.team, lineup: [...lineup] }
                }).lineup
              )
            }
            placeholder={translate('club.team.nobody')}
            selectedId={lineup.at(index) ?? null}
          />
        ))}
      </div>
    </fieldset>
  )
}
