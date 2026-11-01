import type React from 'react'

import { TEAM_COLOURS } from '@scoreboard/core/club/team-colours'

import { PlainButton } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { EVENT_FORMATS, type EventFormat } from './event-format'

import './format-choice.sass'

const TEAM_FILL = TEAM_COLOURS[1]

/** Each format drawn small: two teams beside a block, pools feeding a bracket, matches here and there. */
const FormatDrawing: React.FC<{ format: EventFormat }> = ({ format }) => (
  <svg aria-hidden='true' className='format-drawing' viewBox='0 0 96 56'>
    {format === 'championship' ? (
      <>
        <rect fill={TEAM_FILL} height='20' width='22' x='2' y='6' />
        <rect className='is-paper' height='20' width='22' x='2' y='30' />
        <rect className='is-table' height='16' width='28' x='30' y='14' />
        <rect className='is-ink' height='22' width='2' x='43' y='11' />
        <rect className='is-table' height='16' width='28' x='64' y='14' />
        <rect className='is-ink' height='22' width='2' x='77' y='11' />
        <rect className='is-outline' height='40' width='66' x='28' y='8' />
      </>
    ) : format === 'pools' ? (
      <>
        <rect className='is-paper' height='22' width='30' x='2' y='4' />
        <rect className='is-paper' height='22' width='30' x='2' y='30' />
        <rect className='is-muted' height='3' width='18' x='6' y='9' />
        <rect className='is-muted' height='3' width='14' x='6' y='15' />
        <rect className='is-muted' height='3' width='18' x='6' y='35' />
        <rect className='is-muted' height='3' width='14' x='6' y='41' />
        <path
          className='is-outline'
          d='M32 15h14v12h12M32 41h14V29h12M58 28h14'
        />
        <rect className='is-ink' height='16' width='22' x='72' y='20' />
      </>
    ) : (
      <>
        <rect className='is-table' height='18' width='34' x='8' y='8' />
        <rect className='is-ink' height='24' width='2' x='24' y='5' />
        <rect className='is-idle' height='18' width='34' x='54' y='30' />
        <rect className='is-ink' height='24' width='2' x='70' y='27' />
        <rect className='is-paper' height='10' width='34' x='8' y='34' />
      </>
    )}
  </svg>
)

type FormatChoiceProps = {
  current: EventFormat | null
  onChoose: (format: EventFormat) => void
}

/**
 * The day's three ways to play, each drawn and said in a line; the Top 12 is
 * a ready-made setting of pools then a bracket. Choosing one only changes
 * what the step shows: nothing prepared is deleted.
 */
export const FormatChoice: React.FC<FormatChoiceProps> = ({
  current,
  onChoose
}) => {
  const translate = useTranslate()

  return (
    <section aria-labelledby='format-choice-title' className='format-choice'>
      <h2 className='format-choice-title' id='format-choice-title'>
        {translate('organiser.format.title')}
      </h2>
      <ul className='format-choice-list'>
        {EVENT_FORMATS.map((format) => (
          <li key={format}>
            <PlainButton
              aria-current={current === format || undefined}
              className='format-option'
              onPress={() => onChoose(format)}
            >
              <FormatDrawing format={format} />
              <span className='format-option-text'>
                <b>{translate(`organiser.steps.format.${format}`)}</b>
                <span className='format-option-line'>
                  {translate(`organiser.format.${format}`)}
                </span>
                {format === 'pools' ? (
                  <span className='format-option-note'>
                    {translate('organiser.format.top12')}
                  </span>
                ) : null}
              </span>
              <Icon name={current === format ? 'check' : 'arrowRight'} />
            </PlainButton>
          </li>
        ))}
      </ul>
    </section>
  )
}
