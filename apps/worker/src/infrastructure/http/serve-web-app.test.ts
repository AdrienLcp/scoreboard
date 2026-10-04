import { describe, expect, it } from 'vitest'

import { serveWebApp } from './serve-web-app'

const APP_DOCUMENT = '<!doctype html><title>Scoreboard</title>'

const appAssets = {
  fetch: async () =>
    new Response(APP_DOCUMENT, { headers: { 'content-type': 'text/html' } })
}

const statusOf = async (pathname: string): Promise<number> =>
  (
    await serveWebApp(
      new Request(`https://scoreboard.test${pathname}`),
      appAssets
    )
  ).status

describe('serveWebApp', () => {
  it.each([
    '/',
    '/e/club-day',
    '/e/club-day/',
    '/e/club-day/display',
    '/e/club-day/display/2',
    '/e/club-day/organiser',
    '/e/club-day/umpire',
    '/e/club-day/umpire/ABCDEF'
  ])('serves the app with 200 on the page %s', async (pathname) => {
    expect(await statusOf(pathname)).toBe(200)
  })

  it.each(['/nope', '/e', '/e/club-day/scores', '/e/club-day/umpire/A/B'])(
    'answers 404 on %s, which names no page',
    async (pathname) => {
      expect(await statusOf(pathname)).toBe(404)
    }
  )

  it('still sends the app document with a 404, so the not-found page renders', async () => {
    const response = await serveWebApp(
      new Request('https://scoreboard.test/nope'),
      appAssets
    )

    expect(response.headers.get('content-type')).toBe('text/html')
    expect(await response.text()).toBe(APP_DOCUMENT)
  })
})
