import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'

import {
  umpireCandidatesOf,
  umpireOf
} from '@scoreboard/core/encounter/umpire-turn'

import { useClubTranslate } from '@/features/club/use-club-translate'

import { ChoiceField } from './choice-field'
import { chooseUmpire } from './setup-edits'

/** The choice that hands the match back to the clubs' turn. */
const SHEET_TURN = 'sheet'
/** The choice that shows no umpire for the match. */
const NOBODY = 'nobody'

type UmpireFieldProps = {
  event: PublicSnapshot
  match: MatchView
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/**
 * Who umpires the match on a table: the clubs' turn picks a player of the
 * encounter, and the organiser replaces him with any other in one pick.
 */
export const UmpireField: React.FC<UmpireFieldProps> = ({
  event,
  match,
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const encounter = event.encounters.find(({ id }) => id === match.encounterId)
  const encounterMatches = event.matches.filter(
    (other) => other.encounterId === match.encounterId
  )
  const nameOf = (playerId: string | null): string | null =>
    event.players.find((player) => player.id === playerId)?.name ?? null
  const teamNameOf = (teamId: string | undefined): string =>
    event.teams.find((team) => team.id === teamId)?.name ?? ''
  const sheetId = umpireOf({
    encounterMatches,
    match: { ...match, umpireId: undefined }
  })
  const sheetName = nameOf(sheetId)
  const candidates = umpireCandidatesOf({ encounterMatches, match }).flatMap(
    ({ playerId, side }) => {
      const name = nameOf(playerId)

      return name === null || playerId === sheetId
        ? []
        : [
            {
              id: playerId,
              label: translate('organiser.umpireChoice.candidate', {
                name,
                team: teamNameOf(encounter?.[side])
              })
            }
          ]
    }
  )
  const chosenId = match.umpireId
  const selectedId =
    chosenId === null
      ? NOBODY
      : candidates.some(({ id }) => id === chosenId)
        ? (chosenId ?? SHEET_TURN)
        : SHEET_TURN

  return (
    <ChoiceField
      choices={[
        {
          id: SHEET_TURN,
          label:
            sheetName === null
              ? translate('organiser.umpireChoice.sheetNobody')
              : translate('organiser.umpireChoice.sheet', { name: sheetName })
        },
        ...candidates,
        { id: NOBODY, label: translate('organiser.umpireChoice.nobody') }
      ]}
      label={translate('organiser.umpireChoice.label')}
      onChange={(id) => {
        if (id === null || id === selectedId) {
          return
        }

        onSave(
          chooseUmpire({
            matchId: match.id,
            setup,
            umpireId: id === SHEET_TURN ? undefined : id === NOBODY ? null : id
          })
        )
      }}
      selectedId={selectedId}
    />
  )
}
