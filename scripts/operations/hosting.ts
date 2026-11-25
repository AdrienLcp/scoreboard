/** Where this app is hosted. docs/operations/hosting.md describes each piece. */
export const HOSTING = {
  cloudflareAccountId: '431a529079f2d76802b95056e39950f0',
  /** The `adrienlcp.com` zone, home of every personal project. */
  cloudflareZoneId: '7287a21bea71667f9344cb4f80087729',
  githubRepository: 'AdrienLcp/scoreboard',
  publicDomain: 'scoreboard.adrienlcp.com',
  /** `name` in `apps/worker/wrangler.jsonc`. */
  workerName: 'scoreboard'
} as const
