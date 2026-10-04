import { PAGE_ROUTES } from '@scoreboard/protocol/page-routes'

type AssetFetcher = Pick<Fetcher, 'fetch'>

const PAGE_PATTERNS = Object.values(PAGE_ROUTES).map(
  (pathname) => new URLPattern({ pathname })
)

const withoutTrailingSlash = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname

const isPagePath = (pathname: string): boolean =>
  PAGE_PATTERNS.some((pattern) =>
    pattern.test({ pathname: withoutTrailingSlash(pathname) })
  )

/**
 * Any address gets the web app so it can render its own not-found page,
 * but one that names no page answers 404 for crawlers and link checkers.
 */
export const serveWebApp = async (
  request: Request,
  assets: AssetFetcher
): Promise<Response> => {
  if (isPagePath(new URL(request.url).pathname)) {
    return assets.fetch(request)
  }

  const app = await assets.fetch(new URL('/', request.url))

  return new Response(app.body, { headers: app.headers, status: 404 })
}
