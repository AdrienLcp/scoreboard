import type React from 'react'
import { createElement, Fragment } from 'react'

/** A message cut into spans by `translate.rich`, rendered without asking any part for a key. */
export const RichText: React.FC<{ parts: readonly React.ReactNode[] }> = ({
  parts
}) => createElement(Fragment, null, ...parts)
