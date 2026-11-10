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
- 8 tables in the first club's hall, and a new event starts with 8 until
  the club keeps a plan; the number of courts or tables is configurable per
  event and the display must scale to it.
- The display runs in a browser on whatever drives the screen: most likely a PC
  plugged into a TV or projector, but it must work on any screen size.
- An umpire joins a match by scanning the QR code on the table or by typing a
  short code on any device. A TV joins the way Melee's screens do: the
  computer behind it opens `/wall` (home's "Grand écran", or "Afficher
  l'écran de la salle" on a device with no club), which shows a code and a QR;
  the organiser types or scans it from the console's "Grand écran" button. A
  visitor who reached `/wall` by mistake goes back home from its header.
- Home is the club. It leads with the next championship round (the one dated
  today, else the next to come): our home encounters on the tables the
  console would give them, the away ones in a line, and "Préparer la
  journée", which opens the event with the club's default plan and those
  encounters with each team's last composition in one tap, then reads
  "Reprendre la journée" on the device that prepared it. Beside it, the
  events this device organises, latest first, so leaving the console never
  loses one, and a new event that asks only its name; then the season (teams,
  pools, directory) leading to the club page, with the club code. With no
  round to come, the new event is the main action. On a device with no club
  (a first visit, almost always the organiser's: umpires and spectators come
  by a QR code), home says what the app does in one sentence and asks one
  thing first, "Pour commencer, le nom de votre club", the club's code folded
  under it; every other way is named by the situation it serves: "Vous
  arbitrez ou vous regardez les matchs" (scan the table's or the TV's QR
  code, the event's code folded away, on every home) and "Cet ordinateur est
  branché sur la télé de la salle" (to `/wall`), with no event list until
  this device organises one.
- Both formats exist: individual tournaments and team fixtures (FFTT-style
  team encounters with singles and doubles).

## Capabilities and Constraints

- The hall plan is drawn to scale in metres (a 37 × 20 m hall, a 10 × 5 m
  play area per table): the organiser drags each table where it stands, a
  table aligning on the walls and on the others' edges and centres within
  0.7 m, else on the half metre; dropped on another table the two trade
  places, dropped on the reserve under the stands it is put away for the
  day, and a block of two touching tables moves, swaps and turns as one by
  its handle, which also picks the encounter played on it. A table put away
  keeps its number; deleting a table numbers the others 1 to N again, whole
  blocks first so each pair keeps its encounter, and their QR sheets are
  printed again. The organiser's console walks the day in three steps,
  Salle (the plan, the screens, the QR sheets), Rencontres (the format, each
  encounter's tables and compositions) and En direct (the hall with live
  scores), the settings, players, programme and table codes aside under
  "Réglages"; it opens on En direct once a match has begun. Nothing ever locks: every setting stays reachable and
  changeable after its step, during the live day included.
- Putting away a table whose match is running (its ×, its sheet, a drag onto
  the reserve, a whole block) first asks, one running match at a time, where
  that match goes on: a free standing table (nothing running on it; its own
  next match then waits) or "En attente", on no table. Closing the question
  keeps the tables standing; once every match has a place, the tables go and
  the matches move as one change, undone in one tap. The score, the log and
  the umpire travel with the match. A match still to come on a table put away
  moves to another standing table of its encounter, else follows the running
  match to its new table, else keeps the number and comes back with the
  table; a finished match keeps the table it was played on. A match left
  waiting resumes on the first table freed, the server handing it the table
  whose match has just ended, or the organiser putting a table back from the
  reserve, ahead of that table's own next match, the matches of its
  encounter left on a table put away going there with it; until then no
  umpire can score it and the wall leaves it out, while the spectator view
  shows it with a pause mark in place of its table number.
- Four surfaces: the display, the umpire console, the organiser console, and a
  spectator view on visitors' phones (reached from a QR code shown on the
  display) listing past, live and upcoming matches with their details, and,
  when more than one table stands in the hall, the hall plan with each
  table's live score, a tap opening its match. Tables put away for the day
  are not drawn; up to eight tables the plan reads at phone width without
  zooming, past eight it shrinks whole and the visitor pinches.
- The display gives live matches the space; finished, idle and upcoming ones
  collapse into a compact summary. Tiles stay ordered by table number and only
  reflow when a match starts or ends. Paging is a last resort, used only when
  live matches exceed what stays legible, with a visible page indicator. An
  organiser can split tables across several displays. On a team day each
  screen's wall shows its encounters one row each, or the tables as they stand
  in the hall plan, picked per screen from two pictures in the console; a
  screen nobody set follows the plan, and the hall view falls back to rows
  while the plan cannot hold it. A finished match keeps
  its final score for about four seconds before its table shows what comes
  next, on the open board and on the wall alike.
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
    started, or of a letter nobody holds when a team comes one short, and
    one tap takes the whole forfeit back;
  - a player away for the whole day goes in the second group (D–F, R–T):
    an empty seat of the first group is offered behind the second, the
    players kept in their order, in one tap;
  - a penalty point that wins a game drops the rest of the penalty;
  - the players umpire, shown on the wall and the spectators' phone: the
    two clubs take turns on each table, the second table starting with the
    other club, and when it is his club's turn the player who has just
    played on the table umpires the next match there; never a player of
    the match or of the one played meanwhile on the other table. In the
    table's sheet of the plan the organiser picks another player of the
    encounter, or nobody, and corrects the score game by game;
  - opponents' teams are white unless set otherwise.
- The yearly Top 12 is an individual tournament: two pools seeded without
  clubmates, 2 points a win and 1 a loss, crossed semi-finals and a final.
  Ties: two players are parted by their own match; three or more by games
  then points ratio over the matches between them only (FFTT practice), then
  a draw, one per group of level players, so drawing one tie never redraws
  another.
- A club's store (teams, players, opponents) is opened by its club code and
  erased two years after its last change; an event is kept 30 days after its
  last change or its start, whichever is later.
- The club page is reached from home (its season lines) and the organiser
  console; opened from an event's console, its back button returns to that
  console.
  The first visit asks only the club's name and the device keeps the code; a
  second device opens the club by scanning its QR code or typing the code.
  Defaults, each one changeable:
  - the club keeps several hall plans ("Salle à 8 tables", "Top 12"), each
    saved by name from an event's plan ("Plans enregistrés", "Enregistrer ce
    plan"), one of them starred as the default; every new event starts from
    the default, with its table count, and tables put away for one day come
    back;
  - a new event carries the club's name and logo onto the wall and the
    spectators' phone;
  - an encounter created from the club starts from each team's last
    composition, and the day's composition becomes the new last one
    ("Garder cette composition", on);
  - players, teams and clubs are picked, never typed: the search reads the
    first letters of any word of a name, accents aside, the club's own
    first, then the most recently played; a name it does not find is added
    once, as typed, to the club's directory (a typed team joins the club its
    name starts with, known by its name or its teams' names, ours included
    where a pool is composed; a typed player needs a first and a family
    name);
  - a logo is resized on the device to a 256-pixel square and kept with the
    club, erased with it; a replaced logo stays reachable for the 30 days an
    event may still show it.
- The club page keeps each of our teams' championship pool, phase after
  phase, copied once from the federation's calendar (its number, its teams by
  number, the date of each round). Once the club is tied to the FFTT, a pool
  of this phase whose team the FFTT lists (matched by the number ending both
  names) shows the FFTT's standings and calendar instead, read-only, each
  played round opening its sheet, our sheet's score standing in until the
  FFTT publishes one; the hand-kept results stay folded under it and take
  over while the FFTT does not answer. Defaults, each one changeable:
  - a pool holds eight teams over seven rounds on the federation's grid
    (Berger's tables: 1–8, 2–7, 3–6, 4–5, then 8–5, 6–4…), the first team
    named receiving; a fixture can be inverted;
  - phase 1 runs from September, phase 2 from January, its calendar handed
    out in December; a team's new pool takes the phase after its last one;
  - a round's date places the undated rounds after it two weeks apart;
  - standings count 3 points a win, 2 a draw, 1 a loss and 0 a forfeit; a
    forfeit gives the present team every match of the sheet; teams level on
    points are parted by the points, then the ratio of matches, over the
    encounters between them, then by the ratio of matches over all of
    theirs, and share their rank when nothing parts them;
  - on match day the organiser console offers our teams' encounters of the
    round (the one dated that day, else the next still to play), each added
    in one tap with its opponent, who receives, its tables and each team's
    last composition, all the home ones at once; a finished sheet writes its
    result into the standings, again after a correction, until a result is
    picked by hand;
  - when the FFTT answers for a pool, home's next round, its rank line and
    the console's round read the FFTT's calendar live, nothing of it stored:
    the round played that weekend (the FFTT's date, a day either side), else
    the next one ahead with an encounter of ours it has not scored, a round
    played but not scored yet counting as past. Each opponent is the club's
    team ending in the same number, of the club tied to its FFTT number, else
    of the club its name points to; otherwise it stands in that day only,
    under the FFTT's name, and never joins the directory. The sheet's result
    still goes to the hand-kept pool's fixture of that round. "Source : FFTT"
    closes each block it fills.
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
