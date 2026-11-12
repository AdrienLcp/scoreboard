import type React from 'react'
import { useState } from 'react'

import type {
  ClubRecord,
  DirectoryClub
} from '@scoreboard/protocol/club-record'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { ConfirmButton } from '@/features/organiser/confirm-button'
import { newPlayerId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { NumberField } from '@/presentation/components/number-field'
import { Input, Label, TextField } from '@/presentation/components/text-field'

import { addLicensee, removeLicensee } from './club-edits'

type LicenseeListProps = {
  club: DirectoryClub
  onChange: (record: ClubRecord) => void
  record: ClubRecord
}

/** A club's licensees, entered once and picked on every Sunday after. */
export const LicenseeList: React.FC<LicenseeListProps> = ({
  club,
  onChange,
  record
}) => {
  const translate = useClubTranslate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [points, setPoints] = useState<number>(Number.NaN)
  const isComplete = firstName.trim() !== '' && lastName.trim() !== ''

  return (
    <div className='licensee-list'>
      {club.players.length === 0 ? (
        <p className='club-empty'>{translate('club.players.empty')}</p>
      ) : (
        <ul>
          {club.players.map((player) => (
            <li key={player.id}>
              <span className='licensee-name'>
                {player.firstName} {player.lastName.toUpperCase()}
              </span>
              {player.points === null ? null : (
                <span className='licensee-points'>{player.points}</span>
              )}
              <ConfirmButton
                confirmLabel={translate('club.players.removeConfirm', {
                  name: `${player.firstName} ${player.lastName}`
                })}
                label={translate('club.players.remove')}
                onConfirm={() =>
                  onChange(
                    removeLicensee({
                      clubId: club.id,
                      playerId: player.id,
                      record
                    })
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}
      <Form
        className='club-inline-form'
        onSubmit={(event) => {
          event.preventDefault()

          if (!isComplete) {
            return
          }

          onChange(
            addLicensee({
              clubId: club.id,
              player: {
                firstName: firstName.trim(),
                id: newPlayerId(),
                lastName: lastName.trim(),
                licence: null,
                points: Number.isNaN(points) ? null : points,
                source: 'typed'
              },
              record
            })
          )
          setFirstName('')
          setLastName('')
          setPoints(Number.NaN)
        }}
      >
        <TextField onChange={setFirstName} value={firstName}>
          <Label>{translate('club.players.firstName')}</Label>
          <Input autoComplete='off' />
        </TextField>
        <TextField onChange={setLastName} value={lastName}>
          <Label>{translate('club.players.lastName')}</Label>
          <Input autoComplete='off' />
        </TextField>
        <NumberField
          className='licensee-points-field'
          maxValue={5000}
          minValue={0}
          onChange={setPoints}
          value={points}
        >
          <Label>{translate('club.players.points')}</Label>
          <Input inputMode='numeric' />
        </NumberField>
        <Button isDisabled={!isComplete} type='submit'>
          <Icon name='plus' />
          {translate('club.players.add')}
        </Button>
      </Form>
    </div>
  )
}
