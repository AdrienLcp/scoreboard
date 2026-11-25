# Operations

Everything needed to run this app without help: one page per action, each
with its prerequisites, the exact command, what a good run prints, and the
errors met most often.

| Action                   | Command             | Page                                                 |
| ------------------------ | ------------------- | ---------------------------------------------------- |
| Deploy                   | `pnpm ship`         | [deploying.md](deploying.md)                         |
| Update the dependencies  | `pnpm deps:upgrade` | [updating-dependencies.md](updating-dependencies.md) |
| Understand the hosting   | —                   | [hosting.md](hosting.md)                             |
| Set or renew the secrets | `pnpm secrets:sync` | [secrets.md](secrets.md)                             |
| A step broke             | —                   | [troubleshooting.md](troubleshooting.md)             |

## Where things live

| What                  | Where                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| The app               | https://scoreboard.adrienlcp.com — Cloudflare Worker `scoreboard`, deployed by CI                     |
| Its configuration     | `apps/worker/wrangler.jsonc`: assets, Durable Objects, custom domain                                  |
| Repository            | `AdrienLcp/scoreboard` on GitHub; a push to `main` runs `.github/workflows/ci.yml`                    |
| Secrets               | The personal Bitwarden account, read at run time; never a file in this repository, never a `.env`     |
| Worker secrets        | The three Smartping secrets, on the deployed Worker only ([secrets.md](secrets.md), _Worker secrets_) |
| Hosting identifiers   | `scripts/operations/hosting.ts`                                                                       |
| Bitwarden entry names | `scripts/operations/secret-entries.ts`                                                                |

## Tools on the machine

- Node 26 and pnpm through corepack (`corepack enable`), as `package.json` pins them.
- The Bitwarden CLI, `bw` — set up once, see [secrets.md](secrets.md).
- The GitHub CLI, `gh`, logged in (`gh auth status`) — `pnpm ship` uses it to
  follow the CI run. Without it, `pnpm ship` still pushes and prints the
  Actions page to watch.
