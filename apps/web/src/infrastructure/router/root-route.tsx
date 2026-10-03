import type React from 'react'
import {
  type NavigateOptions,
  Outlet,
  ScrollRestoration,
  useHref,
  useNavigate
} from 'react-router'

import { RouterProvider } from '@/presentation/components/router-provider'

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i

const useRouterHref = (href: string): string => {
  const routeHref = useHref(href)

  return ABSOLUTE_URL.test(href) ? href : routeHref
}

/** A navigation superseded by the next one rejects with `AbortError`: expected, not a failure. */
const ignoreSupersededNavigation = (error: unknown): void => {
  if (error instanceof Error && error.name === 'AbortError') {
    return
  }

  throw error
}

export const RootRoute: React.FC = () => {
  const navigate = useNavigate()

  return (
    <RouterProvider
      navigate={(path, options) => {
        void Promise.resolve(navigate(path, options)).catch(
          ignoreSupersededNavigation
        )
      }}
      useHref={useRouterHref}
    >
      <Outlet />
      <ScrollRestoration />
    </RouterProvider>
  )
}
