import type { RouteObject } from 'react-router'

import { NotFoundPage } from '@/features/not-found/not-found-page'

import { paths } from './navigation'
import { RootRoute } from './root-route'
import { ErrorScreen } from './route-error'

type RoutedPath = (typeof paths)[keyof typeof paths]

const pageFor = {
  [paths.display]: async () => ({
    Component: (await import('@/features/display/display-page')).DisplayPage
  }),
  [paths.displayOf]: async () => ({
    Component: (await import('@/features/display/display-page')).DisplayPage
  }),
  [paths.home]: async () => ({
    Component: (await import('@/features/home/home-page')).HomePage
  }),
  [paths.organiser]: async () => ({
    Component: (await import('@/features/organiser/organiser-page'))
      .OrganiserPage
  }),
  [paths.spectator]: async () => ({
    Component: (await import('@/features/spectator/spectator-page'))
      .SpectatorPage
  }),
  [paths.umpire]: async () => ({
    Component: (await import('@/features/umpire/umpire-page')).UmpirePage
  }),
  [paths.umpireEntry]: async () => ({
    Component: (await import('@/features/umpire/umpire-entry-page'))
      .UmpireEntryPage
  })
} satisfies Record<RoutedPath, RouteObject['lazy']>

export const routes: RouteObject[] = [
  {
    Component: RootRoute,
    children: [
      ...Object.values(paths).map((path) => ({ lazy: pageFor[path], path })),
      { Component: NotFoundPage, path: '*' }
    ],
    ErrorBoundary: ErrorScreen
  }
]
