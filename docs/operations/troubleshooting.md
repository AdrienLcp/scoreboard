# When a step breaks

Find the step, read its log, apply the fix. The pages of each action carry
their own table of errors; this one covers what lies between them.

## Read the failure

A failed CI run:

```powershell
gh run list --limit 5
```

```powershell
gh run view <id> --log-failed
```

Expected: the log of the failing step only. Re-run it once the cause is fixed
— or straight away for a network hiccup:

```powershell
gh run rerun <id> --failed
```

## By step

| Step              | Symptom                                                 | Fix                                                                                                                                                        |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI `pnpm install` | `ERR_PNPM_OUTDATED_LOCKFILE`                            | `pnpm install` here, commit `pnpm-lock.yaml`, ship.                                                                                                        |
| CI lint           | `biome ci` errors                                       | `pnpm lint` here, commit, ship.                                                                                                                            |
| CI spelling       | `Unknown word`                                          | Fix the typo, or add a real word to `cspell.json` → `words`.                                                                                               |
| CI build or tests | A failing test or type error                            | Reproduce with `pnpm validate` here; fix; ship.                                                                                                            |
| CI build          | `wrangler types --check` says the types are out of date | `wrangler.jsonc` or Wrangler changed without its types: `pnpm --filter @scoreboard/worker cf-typegen`, commit, ship.                                       |
| CI Lighthouse     | A score or the JS size misses its budget                | `pnpm validate` then `pnpm lighthouse` here; the failed run's `lighthouse-reports` artifact holds its reports.                                             |
| CI deploy         | Step _skipped_                                          | A newer commit reached `main` before this run's deploy: that commit's own run deploys it. Nothing to do.                                                   |
| CI deploy         | Fails at once, no account id or token                   | The repository lacks `CLOUDFLARE_ACCOUNT_ID` or `CLOUDFLARE_API_TOKEN`: `pnpm secrets:sync` ([secrets.md](secrets.md)), then `gh run rerun <id> --failed`. |
| CI deploy         | `Authentication error [code: 10000]`                    | The Cloudflare token expired or lost a permission: renew it ([secrets.md](secrets.md)).                                                                    |
| CI deploy         | `No access to the specified resource` after `Uploaded`  | The token lacks _Zone · Workers Routes · Edit_ on `adrienlcp.com`, needed for the custom domain ([secrets.md](secrets.md)).                                |
| Site              | Old version still showing                               | Hard-reload. Check the CI run deployed the commit you expect.                                                                                              |
| Site              | Blank page, console errors                              | Undo the deploy ([deploying.md](deploying.md)), then reproduce locally.                                                                                    |
| Site              | Club, player or team lookups say they are not set up    | The Worker lacks a Smartping secret: set the three again ([secrets.md](secrets.md), _Worker secrets_).                                                     |
| Any script        | A `Bitwarden …` message                                 | [secrets.md](secrets.md), _Common errors_.                                                                                                                 |
| Any script        | `pnpm: command not found` or a wrong pnpm version       | `corepack enable`, open a new terminal.                                                                                                                    |

## Still stuck

- Cloudflare status: https://www.cloudflarestatus.com — GitHub:
  https://www.githubstatus.com
- Deploy by hand, from a clean clone of `main`, with the token read from
  Bitwarden: [hosting.md](hosting.md), _Deploy by hand_.
