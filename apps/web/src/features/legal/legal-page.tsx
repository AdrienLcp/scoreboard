import type React from 'react'
import { useId } from 'react'

import { EVENT_RETENTION_DAYS } from '@scoreboard/protocol/event-retention'

import { paths } from '@/infrastructure/router/navigation'
import { ANALYTICS_OPT_OUT_KEY } from '@/infrastructure/storage/analytics-opt-out-storage'
import { FOLLOWED_PLAYERS_KEY_PREFIX } from '@/infrastructure/storage/followed-players-storage'
import { ORGANISER_CODE_KEY_PREFIX } from '@/infrastructure/storage/organiser-code-storage'
import { OUTBOX_KEY_PREFIX } from '@/infrastructure/storage/outbox-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Link, TextLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import {
  CNIL_COMPLAINT_HREF,
  HOST,
  MEASUREMENT_RETENTION_MONTHS,
  PUBLISHER,
  REQUEST_LOG_RETENTION_DAYS
} from './legal-details'
import { MeasurementSwitch } from './measurement-switch'

import './legal-page.sass'

const contactLink = (children: string): React.ReactNode => (
  <TextLink href={PUBLISHER.contactHref}>{children}</TextLink>
)

const cnilLink = (children: string): React.ReactNode => (
  <TextLink href={CNIL_COMPLAINT_HREF}>{children}</TextLink>
)

type LegalSectionProps = {
  children: React.ReactNode
  heading: string
}

const LegalSection: React.FC<LegalSectionProps> = ({ children, heading }) => {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className='legal-section'>
      <h2 className='legal-heading' id={headingId}>
        {heading}
      </h2>
      {children}
    </section>
  )
}

type StoredKeyProps = {
  prefix: string
  /** The part that changes from one event to the next, named in words. */
  variablePart?: string
}

/** A device-storage key as the browser's tools show it. */
const StoredKey: React.FC<StoredKeyProps> = ({ prefix, variablePart }) => (
  <code>
    {prefix}
    {variablePart === undefined ? null : <var>{variablePart}</var>}
  </code>
)

/**
 * The French LCEN's legal notice and the privacy policy, on one page every
 * footer links to: who publishes, who hosts, what is kept where and for how
 * long, how an event is erased, and how to refuse the audience measurement.
 */
export const LegalPage: React.FC = () => {
  const translate = useTranslate()

  return (
    <Main className='legal-page'>
      <DocumentTitle>{translate('legal.title')}</DocumentTitle>
      <header className='legal-bar'>
        <Link className='legal-home' href={paths.home}>
          <BrandMark />
        </Link>
      </header>
      <div className='legal-document'>
        <h1 className='legal-title'>{translate('legal.title')}</h1>
        <p className='legal-intro'>{translate('legal.intro')}</p>

        <LegalSection heading={translate('legal.publisher.heading')}>
          <p>
            <RichText
              parts={translate.rich('legal.publisher.body', {
                contact: contactLink,
                name: PUBLISHER.name
              })}
            />
          </p>
          <p className='legal-aside'>{translate('legal.publisher.address')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.host.heading')}>
          <p>{translate('legal.host.body')}</p>
          <address className='host-address'>
            {[HOST.name, ...HOST.addressLines].map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        </LegalSection>

        <LegalSection heading={translate('legal.event.heading')}>
          <p>{translate('legal.event.body')}</p>
          <p className='legal-retention'>
            {translate('legal.event.retention', { days: EVENT_RETENTION_DAYS })}
          </p>
          <p>{translate('legal.event.deletion')}</p>
          <p>
            <RichText
              parts={translate.rich('legal.event.yourName', {
                contact: contactLink
              })}
            />
          </p>
          <p>
            {translate('legal.event.logs', {
              days: REQUEST_LOG_RETENTION_DAYS
            })}
          </p>
        </LegalSection>

        <LegalSection heading={translate('legal.device.heading')}>
          <p>{translate('legal.device.body')}</p>
          <dl className='stored-keys'>
            <div>
              <dt>
                <StoredKey
                  prefix={ORGANISER_CODE_KEY_PREFIX}
                  variablePart={translate('legal.device.eventPart')}
                />
              </dt>
              <dd>{translate('legal.device.organiser')}</dd>
            </div>
            <div>
              <dt>
                <StoredKey
                  prefix={OUTBOX_KEY_PREFIX}
                  variablePart={translate('legal.device.outboxPart')}
                />
              </dt>
              <dd>{translate('legal.device.outbox')}</dd>
            </div>
            <div>
              <dt>
                <StoredKey
                  prefix={FOLLOWED_PLAYERS_KEY_PREFIX}
                  variablePart={translate('legal.device.eventPart')}
                />
              </dt>
              <dd>{translate('legal.device.followed')}</dd>
            </div>
            <div>
              <dt>
                <StoredKey prefix={ANALYTICS_OPT_OUT_KEY} />
              </dt>
              <dd>{translate('legal.device.analyticsOptOut')}</dd>
            </div>
          </dl>
        </LegalSection>

        <LegalSection heading={translate('legal.measurement.heading')}>
          <p>{translate('legal.measurement.body')}</p>
          <p>
            {translate('legal.measurement.retention', {
              months: MEASUREMENT_RETENTION_MONTHS
            })}
          </p>
          <p>{translate('legal.measurement.exemption')}</p>
          <MeasurementSwitch />
        </LegalSection>

        <LegalSection heading={translate('legal.thirdParties.heading')}>
          <p>{translate('legal.thirdParties.body')}</p>
        </LegalSection>

        <LegalSection heading={translate('legal.rights.heading')}>
          <p>
            <RichText
              parts={translate.rich('legal.rights.body', {
                contact: contactLink
              })}
            />
          </p>
          <p>
            <RichText
              parts={translate.rich('legal.rights.complaint', {
                authority: cnilLink
              })}
            />
          </p>
        </LegalSection>
      </div>
    </Main>
  )
}
