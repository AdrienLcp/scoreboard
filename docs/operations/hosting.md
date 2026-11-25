# Hosting

One Cloudflare Worker serves everything: the built web app as static assets,
and the API and sockets through its code. All of it is declared in
`apps/worker/wrangler.jsonc`; there is no staging, every push to `main` that
passes CI goes live.

| Piece       | Provider                                | Identifier                                                                                         |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| The Worker  | Cloudflare Workers, account `431a5290…` | `scoreboard` (`name`)                                                                              |
| The web app | Static assets of the Worker             | `apps/web/dist` (`assets`, binding `ASSETS`), single-page fallback, pages through the Worker first |
| Events      | Durable Object, SQLite-backed           | class `EventRoom`, binding `EVENT_ROOMS`                                                           |
| Pairings    | Durable Object, SQLite-backed           | class `WallPairingRoom`, binding `WALL_PAIRINGS`                                                   |
| Clubs       | Durable Object, SQLite-backed           | class `ClubRoom`, binding `CLUB_ROOMS`                                                             |
| Its address | Custom domain, zone `adrienlcp.com`     | `scoreboard.adrienlcp.com` (`routes`); no `workers.dev` host (`workers_dev`)                       |

`scripts/operations/hosting.ts` holds the account, zone, repository, Worker
name and domain for the scripts. The CI secrets that let GitHub deploy to
Cloudflare, and the Worker's own Smartping secrets, are covered in
[secrets.md](secrets.md).

## Create or recreate it

Nothing to run apart from a deploy: `wrangler deploy` creates the Worker if it
is missing, applies the Durable Object migrations, and creates the custom
domain with its DNS record. After deleting the Worker by mistake, re-run the
last CI run (`gh run rerun <id>`) or deploy by hand (below), then set the
Worker secrets again ([secrets.md](secrets.md), _Worker secrets_): they are
deleted with the Worker. The domain answers once its certificate is issued, a
few minutes after the first deploy.

A new Durable Object class takes its own entry in `migrations`, with the next
tag; the free plan only offers `new_sqlite_classes`.

After any change to `wrangler.jsonc`, regenerate the binding types and commit
`apps/worker/worker-configuration.d.ts` (the worker build checks them):

```powershell
pnpm --filter @scoreboard/worker cf-typegen
```

## Deploy by hand

The last resort, when CI cannot deploy: from a clean clone of `main` only (it
ships whatever the folder holds). Unlock first ([secrets.md](secrets.md),
_Unlocking_), then in that terminal:

```powershell
pnpm install --frozen-lockfile; pnpm build
```

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = "431a529079f2d76802b95056e39950f0"; $env:CLOUDFLARE_API_TOKEN = bw get password "Cloudflare Pages token"; pnpm --filter @scoreboard/worker exec wrangler deploy
```

Expected: `Uploaded scoreboard`, then `scoreboard.adrienlcp.com (custom domain)`.
Close the terminal afterwards: it holds the token.

## Common errors

| Message                                                 | Fix                                                                                                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Authentication error [code: 10000]`                    | The Cloudflare token lacks a permission listed in [secrets.md](secrets.md), or expired: renew it.                                             |
| `No access to the specified resource`, after `Uploaded` | The code is up but the custom domain was refused: the token lacks _Zone · Workers Routes · Edit_ on `adrienlcp.com`.                          |
| A record for `scoreboard.adrienlcp.com` already exists  | Another record holds the name: dashboard → _adrienlcp.com → DNS → Records_, delete it, deploy again.                                          |
| The site answers `522` or a certificate error           | The certificate is not issued yet: wait ten minutes. Still failing: dashboard → _Workers & Pages → scoreboard → Settings → Domains & Routes_. |
