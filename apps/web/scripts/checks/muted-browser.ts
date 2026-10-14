import { type Browser, chromium, type Page } from '@playwright/test'

export type ColorScheme = 'dark' | 'light'

export type MutedBrowserOptions = {
  /** The scheme every tab prefers, Lighthouse's own included: no page-level emulation reaches a tab it opens. */
  colorScheme?: ColorScheme
  /** Opens the browser to Lighthouse, which attaches to it rather than launching its own. */
  debuggingPort?: number
}

export type CheckPageOptions = {
  /** Aborts every font request, so the page keeps its fallback faces. */
  blockWebFonts?: boolean
}

const BLINK_PREFERRED_COLOR_SCHEME: Record<ColorScheme, number> = {
  dark: 0,
  light: 1
}

/**
 * Chromium with its sound off at the process: whatever a page plays, nothing
 * reaches the speakers of the machine running the check.
 */
export const launchMutedBrowser = ({
  colorScheme = 'light',
  debuggingPort
}: MutedBrowserOptions = {}): Promise<Browser> =>
  chromium.launch({
    args: [
      '--mute-audio',
      `--blink-settings=preferredColorScheme=${BLINK_PREFERRED_COLOR_SCHEME[colorScheme]}`,
      ...(debuggingPort === undefined
        ? []
        : [`--remote-debugging-port=${debuggingPort}`])
    ]
  })

const silenceThePage = () => {
  Reflect.deleteProperty(window, 'AudioContext')
  Reflect.deleteProperty(window, 'webkitAudioContext')

  class SilentNotification extends EventTarget {
    static readonly permission: NotificationPermission = 'granted'

    static requestPermission = (): Promise<NotificationPermission> =>
      Promise.resolve('granted')

    close() {}
  }

  Object.defineProperty(window, 'Notification', { value: SilentNotification })
}

/**
 * A tab in a context of its own: no audio API, notifications granted and shown
 * to nobody, motion reduced so a measure never lands mid-transition, and the
 * scheme the browser was launched with. `colorScheme: null` lets that scheme
 * through: left out, Playwright emulates `light` in every context it opens.
 */
export const openCheckPage = async (
  browser: Browser,
  { blockWebFonts = false }: CheckPageOptions = {}
): Promise<Page> => {
  const context = await browser.newContext({
    colorScheme: null,
    reducedMotion: 'reduce'
  })

  await context.addInitScript(silenceThePage)

  if (blockWebFonts) {
    await context.route('**/*', (route) =>
      route.request().resourceType() === 'font'
        ? route.abort()
        : route.continue()
    )
  }

  return context.newPage()
}
