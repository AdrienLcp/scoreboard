# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: a pnpm monorepo following Adrien's toolkit conventions. Vite + React +
react-router + indented Sass for the screens, shared protocol and scoring rules
in packages, and a Cloudflare Worker with one Durable Object per event for
realtime state (WebSocket fan-out plus its own SQLite storage). Everything is
hosted on Cloudflare's free tier: no sleeping server, no separate database, and
the same push-to-deploy flow as Adrien's other projects.

## Users

- **The organiser**: a club volunteer (first user: Adrien's father, in a table
  tennis club) who prepares an event ahead of time (players, teams, matches,
  table assignments) and fixes anything live: an absent or injured player, a
  wrong score, a match moved to another table.
- **Appointed umpires**: a handful of regular club members who umpire all day.
  They score one match at a time on whatever device is at hand: a phone, a
  tablet or a laptop. Used to the rules, not necessarily to apps.
- **The room**: players, teammates and spectators reading the big display from
  across a sports hall, often from 10 to 20 metres away.

## Product Purpose

Show every match in progress on one big screen, live, while each umpire scores
their own match from their own device. Success: nobody walks between tables to
ask a score, the organiser never loses control of the day, and a scoring
mistake is undone in one tap.

## Positioning

Built for the club room, not for broadcast: free to host, nothing to install,
any browser on any device, and sport-agnostic underneath. Table tennis is the
first ruleset; other sports plug in their own scoring rules so another club or
another sport can adopt it.

## Operating Context

- A sports hall: large, bright, noisy, with unreliable Wi-Fi. Umpires may be on
  4G, and a device can drop off the network mid-match.
- Up to 12 tables at once in the first club, but the number of courts or
  tables is configurable per event and the display must scale to it.
- The display runs in a browser on whatever drives the screen: most likely a PC
  plugged into a TV or projector, but it must work on any screen size.
- An umpire joins a match by scanning the QR code on the table or by typing a
  short code on any device.
- Both formats exist: individual tournaments and team fixtures (FFTT-style
  team encounters with singles and doubles).

## Capabilities and Constraints

- Four surfaces: the display, the umpire console, the organiser console, and a
  spectator view on visitors' phones (reached from a QR code shown on the
  display) listing past, live and upcoming matches with their details.
- The display gives live matches the space; finished, idle and upcoming ones
  collapse into a compact summary. Tiles stay ordered by table number and only
  reflow when a match starts or ends. Paging is a last resort, used only when
  live matches exceed what stays legible, with a visible page indicator. An
  organiser can split tables across several displays.
- The server keeps the ordered list of scoring events; scores, games won and
  the serving player are derived from it. Undo and organiser corrections are
  events too.
- Scoring rules are a pluggable ruleset per sport. Table tennis: games to 11,
  two clear points, best of 3 or 5 configurable, serve changes every 2 points
  then every point from 10-10.
- Multi-club: each club has its own events and its own identity.
- Offline-tolerant umpire console: queued points are resent on reconnect, and
  duplicates are ignored by event id.
- Undecided: how organisers authenticate beyond a per-event admin code; which
  sports come after table tennis.

## Brand Commitments

The app has its own default identity. A club can override it with its name,
logo and colours on its events.

Standing preference (2026-10-03): clean, legible, broadcast-grade sports
graphics over themed or quirky worlds. Nothing sport-specific in the visual
identity (no table tennis imagery), since other sports will plug in. Pages
that look busy or ornamental were rejected; legibility from far away wins.

## Evidence on Hand

No real club data yet: player names, teams and fixtures in demos are synthetic
and must be labelled as such.

## Product Principles

- The room reads it from far away: scores are the biggest thing on every screen.
- One tap to score, one tap to undo: an umpire never hunts for a control.
- The organiser can change anything live without stopping the day.
- The network will fail: the console keeps working and catches up.
- Sport-agnostic core, sport-specific rules.

## Accessibility & Inclusion

Legible at hall distance, high contrast under bright lighting, and colour is
never the only way to tell the two sides apart.
