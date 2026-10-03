import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'

import { routes } from '@/infrastructure/router/routes'
import { AppProviders } from '@/presentation/app-providers'

import '@/presentation/styles/globals.sass'

const container = document.getElementById('root')

if (container === null) {
  throw new Error('Missing #root in index.html')
}

const router = createBrowserRouter(routes)

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)
