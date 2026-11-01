import type React from 'react'

import type {
  ClubRecord,
  DirectoryClub,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import {
  type EncounterFormatId,
  encounterFormatIds
} from '@scoreboard/protocol/encounter-format-id'
import {
  type MatchPointsRuleId,
  matchPointsRuleIds
} from '@scoreboard/protocol/match-points-rule'

import { textColourOn } from '@scoreboard/core/club/team-colours'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

import { ChoiceField } from '@/features/organiser/choice-field'
import { ConfirmButton } from '@/features/organiser/confirm-button'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { encounterFormatKey } from '@/presentation/i18n/translation'

import { removeTeam, seatPlayer, updateTeam } from './club-edits'
import { ColourSwatches } from './colour-swatches'

type TeamEditorProps = {
  club: DirectoryClub
  /** Our own teams play at home: they get tables. */
  isOwn: boolean
  onChange: (record: ClubRecord) => void
  record: ClubRecord
  team: DirectoryTeam
}

const MAX_HALL_TABLES = 16

const isFormatId = (id: string | null): id is EncounterFormatId =>
  encounterFormatIds.some((formatId) => formatId === id)

const isMatchPointsRule = (id: string | null): id is MatchPointsRuleId =>
  matchPointsRuleIds.some((rule) => rule === id)

const tableRun = (first: number, length: number): number[] =>
  Array.from({ length }, (_, offset) => first + offset)

/** A team folded to its colour and name; open, everything about it is picked. */
export const TeamEditor: React.FC<TeamEditorProps> = ({
  club,
  isOwn,
  onChange,
  record,
  team
}) => {
  const translate = useTranslate()
  const format = encounterFormatFor(team.formatId)
  const save = (next: DirectoryTeam) =>
    onChange(updateTeam({ clubId: club.id, record, team: next }))
  const tablesLabel = (tables: readonly number[]) =>
    translate('club.team.tablesChoice', {
      count: tables.length,
      tables: tables.map(String)
    })

  const tablesChoices = Array.from(
    { length: MAX_HALL_TABLES - format.groupCount + 1 },
    (_, index) => ({
      id: String(index + 1),
      label: tablesLabel(tableRun(index + 1, format.groupCount))
    })
  )
  const playerChoices = club.players.map((player) => ({
    id: player.id,
    label: `${player.firstName} ${player.lastName}`
  }))
  const letters = isOwn ? format.homeLetters : format.awayLetters
  const firstTable = team.tables.at(0)

  return (
    <Disclosure className='team-editor'>
      <Button className='team-editor-trigger' slot='trigger' variant='quiet'>
        <span
          aria-hidden='true'
          className='team-colour'
          style={{ background: team.colour, color: textColourOn(team.colour) }}
        />
        <span className='team-editor-name'>{team.name}</span>
        <span className='team-editor-detail'>
          {[
            team.division,
            translate(encounterFormatKey(team.formatId)),
            isOwn && team.tables.length > 0 ? tablesLabel(team.tables) : null
          ]
            .filter((part) => part !== null)
            .join(' · ')}
        </span>
        <Icon name='chevronDown' />
      </Button>
      <DisclosurePanel>
        <div className='team-editor-body'>
          <TextField
            onChange={(name) => {
              if (name.trim() !== '') {
                save({ ...team, name })
              }
            }}
            value={team.name}
          >
            <Label>{translate('club.team.name')}</Label>
            <Input autoComplete='off' />
          </TextField>
          <div className='team-editor-wide'>
            <p className='club-label'>{translate('club.team.colour')}</p>
            <ColourSwatches
              label={translate('club.team.colour')}
              onChange={(colour) => save({ ...team, colour })}
              selected={team.colour}
            />
          </div>
          <ChoiceField
            choices={encounterFormatIds.map((id) => ({
              id,
              label: translate(encounterFormatKey(id))
            }))}
            label={translate('club.team.format')}
            onChange={(id) => {
              if (isFormatId(id)) {
                save({ ...team, formatId: id })
              }
            }}
            selectedId={team.formatId}
          />
          <ChoiceField
            choices={matchPointsRuleIds.map((id) => ({
              id,
              label: translate(`club.team.matchPoints.${id}`)
            }))}
            label={translate('club.team.matchPointsLabel')}
            onChange={(id) => {
              if (isMatchPointsRule(id)) {
                save({ ...team, matchPoints: id })
              }
            }}
            selectedId={team.matchPoints}
          />
          {isOwn ? (
            <ChoiceField
              choices={tablesChoices}
              label={translate('club.team.tables')}
              onChange={(id) =>
                save({
                  ...team,
                  tables: tableRun(Number(id), format.groupCount)
                })
              }
              selectedId={firstTable === undefined ? null : String(firstTable)}
            />
          ) : null}
          <div className='team-editor-wide'>
            <p className='club-label'>{translate('club.team.lineup')}</p>
            {playerChoices.length === 0 ? (
              <p className='club-empty'>{translate('club.team.noPlayers')}</p>
            ) : (
              <div className='team-editor-letters'>
                {letters.map((letter, index) => (
                  <ChoiceField
                    choices={playerChoices}
                    key={letter}
                    label={letter}
                    onChange={(playerId) =>
                      save(seatPlayer({ index, playerId, team }))
                    }
                    placeholder={translate('club.team.nobody')}
                    selectedId={team.lineup.at(index) ?? null}
                  />
                ))}
              </div>
            )}
          </div>
          <div className='team-editor-wide'>
            <ConfirmButton
              confirmLabel={translate('club.team.removeConfirm', {
                name: team.name
              })}
              label={translate('club.team.remove')}
              onConfirm={() =>
                onChange(
                  removeTeam({ clubId: club.id, record, teamId: team.id })
                )
              }
            />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
