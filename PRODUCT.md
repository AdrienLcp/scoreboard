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
- Match times: an optional planned time set by the organiser, actual start
  and finish stamped by the server, durations, and an estimated start for
  queued matches derived from what is still being played on that table.
- Scoring rules are a pluggable ruleset per sport. Table tennis: games to 11,
  two clear points, best of 3, 5 or 7 set per match, serve changes every 2 points
  then every point from 10-10.
- Team encounters (FFTT championship) and their defaults, each one a setting
  the organiser can change in the UI:
  - the 6-player, 20-match sheet is the default format; the encounter score
    counts matches won (11–9 on a real sheet);
  - team N plays on tables 2N−1 and 2N; a hall's tables pair by consecutive
    numbers (2k−1, 2k host one encounter), the club's 8-table hall numbering
    the stacked pair 1–2 then rows 3–4, 5–6, 7–8;
  - a forfeit gives a walkover on every match of the absent player not yet
    started;
  - a penalty point that wins a game drops the rest of the penalty;
  - opponents' teams are white unless set otherwise.
- The yearly Top 12 is an individual tournament: two pools seeded without
  clubmates, 2 points a win and 1 a loss, crossed semi-finals and a final.
  Ties: two players are parted by their own match; three or more by games
  then points ratio over the matches between them only (FFTT practice), then
  a draw.
- A club's store (teams, players, opponents) is opened by its club code and
  erased two years after its last change; an event is kept 30 days after its
  last change or its start, whichever is later.
- Multi-club: each club has its own events and its own identity.
- Offline-tolerant umpire console: queued points are resent on reconnect, and
  duplicates are ignored by event id.
- Undecided: how organisers authenticate beyond a per-event admin code; which
  sports come after table tennis.

## Brand Commitments

The app has its own default identity. A club can override it with its name,
logo and colours on its events.

Direction C, validated on 2026-10-31 through the wall mockup
(`.handoff/ping-club/assets/wall-mockup/wall.html`), replaces the dark,
sport-neutral look of 2026-10-03:

- Black on white: paper and white grounds, navy ink. Requested by the
  organisers: "il vaut mieux noir sur blanc"; a bright hall agrees.
- The drawn table-tennis table is the signature motif, used where it
  carries meaning (the wall, the hall plan, a table's umpire header, the
  printable QR sheet), never as wallpaper. Table tennis is the sport the
  product serves first; another sport would bring its own drawn court.
- One orange for what needs a decision now (a game or match to validate, a
  running time-out, the serve), the table's blue, a colour per team.
- Icons and drawings over words for an audience that "n'y connait rien en
  informatique": serve triangle, tilted yellow card, stopwatch time-out.
- Legibility from far away still wins over decoration.

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
