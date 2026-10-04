# Scoreboard

A live scoreboard for sports clubs running several tables at once. Each umpire
scores their own match from whatever device is at hand, and every match in
progress shows up on one big screen across the hall. Table tennis is the first
ruleset; the scoring rules are pluggable so other sports can follow.

Nothing to install: everything runs in a browser, and it is hosted on
Cloudflare's free tier.

## The four screens

- **Big screen** — the display driven by a PC plugged into a TV or projector.
  Live matches take the space, the others collapse into a compact summary, and
  tables can be split across several displays. A QR code leads spectators to
  their own view.
- **Umpire console** — one match at a time, joined by scanning the table's QR
  code or typing a short code. Points queued while offline are resent on
  reconnect, and a mistake is undone in one tap.
- **Organiser console** — prepares the event (players, teams, matches, tables)
  and fixes anything live: an absent player, a wrong score, a match moved to
  another table.
- **Spectator view** — on visitors' phones: past, live and upcoming matches
  with their details.

## Layout

| Path | What it holds |
| --- | --- |
| `apps/web` | The four screens: Vite, React, react-router, indented Sass |
| `apps/worker` | The Cloudflare Worker, with one Durable Object per event holding its ordered scoring events and fanning them out over WebSocket |
| `packages/core` | Scoring rules and everything derived from the events: scores, server, timing |
| `packages/protocol` | The contract the web app and the worker share: schemas, routes, messages |

`PRODUCT.md` describes who it is for and what it must do; `DESIGN.md` holds the
visual system.

## Develop

Requires Node 26 and pnpm through corepack.

```sh
pnpm install
pnpm dev
```

`pnpm dev` starts the worker on `http://127.0.0.1:8788` and the web app on
`http://localhost:5391/`, which proxies the API and sockets to the worker.

```sh
pnpm validate   # lint, spell check, build and tests, as CI runs them
pnpm lint       # Biome, fixing what it can
pnpm test:watch
```

## Deploy

Every push to `main` that passes CI is built and deployed to Cloudflare by the
`deploy` job in `.github/workflows/ci.yml`. It needs two repository secrets:
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, a token allowed to edit
Workers scripts.

## Licence

[GNU AGPL v3 or later](LICENSE).
