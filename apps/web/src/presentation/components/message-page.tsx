import type React from 'react'

import { DocumentTitle } from '@/presentation/head/document-title'

import { BrandMark } from './brand-mark'
import { Main } from './main'

import './message-page.sass'

type MessagePageProps = {
  /** The way out: a link home, usually. */
  children: React.ReactNode
  detail: string
  title: string
}

/** A page that only has something to say: no route, or a route that broke. */
export const MessagePage: React.FC<MessagePageProps> = ({
  children,
  detail,
  title
}) => (
  <Main className='message-page'>
    <DocumentTitle>{title}</DocumentTitle>
    <div className='message-page-body'>
      <BrandMark />
      <h1>{title}</h1>
      <p>{detail}</p>
      {children}
    </div>
  </Main>
)
