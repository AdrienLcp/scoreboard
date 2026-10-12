import { type PreviewServer, preview } from 'vite'

/**
 * The checks' own port, never the dev server's nor `vite preview`'s default:
 * a check must not measure a server someone left running.
 */
const CHECKS_PREVIEW_PORT = Number(process.env.CHECKS_PREVIEW_PORT) || 5183

/**
 * `127.0.0.1`, never `localhost`: on Windows `localhost` binds one address
 * family, so `strictPort` misses a server holding the port on the other one,
 * and the check measures that server instead.
 */
const CHECKS_PREVIEW_HOST = '127.0.0.1'

export type RunningPreview = {
  close: () => Promise<void>
  origin: string
}

/** Serves the built `dist` the way `vite preview` does, failing when the port is taken. */
export const startPreviewServer = async (): Promise<RunningPreview> => {
  const server: PreviewServer = await preview({
    logLevel: 'warn',
    preview: {
      host: CHECKS_PREVIEW_HOST,
      open: false,
      port: CHECKS_PREVIEW_PORT,
      strictPort: true
    }
  })

  return {
    close: () => server.close(),
    origin: `http://${CHECKS_PREVIEW_HOST}:${CHECKS_PREVIEW_PORT}`
  }
}
