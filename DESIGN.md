---
name: Scoreboard
description: Live table-tennis scores for the club room, readable from across the hall.
colors:
  field: "#F6F7F4"
  surface: "#FFFFFF"
  surface-raised: "#E3E8EB"
  surface-high: "#C9D1D7"
  rule: "#C9D1D7"
  edge: "#5E7690"
  ink: "#0E2238"
  ink-muted: "#34506E"
  ink-dim: "#465B73"
  on-ink: "#FFFFFF"
  live: "#F07F1E"
  on-live: "#0E2238"
  live-ink: "#8F3F00"
  focus: "#1A4F8C"
  table: "#1A4F8C"
  table-dark: "#123B6A"
  table-idle: "#9FB0C0"
  floor-shade: "#D3DADF"
  sky: "#8FCBEF"
  card-yellow: "#FFD23F"
  qr-paper: "#FFFFFF"
typography:
  display:
    fontFamily: "Archivo, Archivo fallback, Arial Narrow, sans-serif"
    fontSize: "calc(var(--unit) * 37)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
    fontVariation: "'wdth' 64"
  headline:
    fontFamily: "Archivo, Archivo fallback, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    fontVariation: "'wdth' 84"
  title:
    fontFamily: "Archivo, Archivo fallback, system-ui, -apple-system, Segoe UI, sans-serif"
    fontWeight: 600
    lineHeight: 1.25
    fontVariation: "'wdth' 84"
  body:
    fontFamily: "Archivo, Archivo fallback, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Archivo, Archivo fallback, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
  figure:
    fontFamily: "Archivo, Archivo fallback, Arial Narrow, sans-serif"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum, lnum"
    fontVariation: "'wdth' 72"
rounded:
  full: "999px"
spacing:
  4xs: "0.125rem"
  3xs: "0.25rem"
  2xs: "0.375rem"
  xs: "0.5rem"
  s: "0.75rem"
  m: "1rem"
  l: "1.25rem"
  xl: "1.5rem"
  2xl: "2rem"
  3xl: "3rem"
  4xl: "4.5rem"
  gutter: "1rem"
components:
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0.75rem 1rem"
    height: "3rem"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  button-secondary-disabled:
    textColor: "{colors.ink-dim}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    padding: "0.75rem 1rem"
    height: "3.75rem"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-dim}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    padding: "0.75rem"
    height: "3rem"
  button-quiet-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
  button-stop:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    padding: "0.75rem 1rem"
    height: "3rem"
  field-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "0.5rem 0.75rem"
    height: "3rem"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    height: "3rem"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  toggle-button:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    padding: "0.75rem 1rem"
    height: "3rem"
  toggle-button-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  switch-track:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.full}"
    height: "1.625rem"
    width: "2.875rem"
  switch-track-selected:
    backgroundColor: "{colors.ink}"
  state-pill-match-point:
    backgroundColor: "{colors.live}"
    textColor: "{colors.on-live}"
    padding: "0.34em 0.82em"
  state-pill-game-point:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0.34em 0.82em"
  state-pill-deuce:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0.34em 0.82em"
  state-pill-over:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.ink}"
    padding: "0.34em 0.82em"
  table-number:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.figure}"
  live-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  summary-column:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  match-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  point-target:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "1rem 1.25rem 0.75rem"
---

# Design System: Scoreboard

## Overview

**Creative North Star: "The Club Hall Wall"**

A live-score product for the club room, drawn black on white. Paper and white grounds, navy ink, one orange that only ever asks for a decision, and the blue of the table itself. It is read from 10 to 20 metres across a bright sports hall, by people who "know nothing about computers", so the score digits are the largest thing on any surface, every state has an icon or a drawing before it has a word, and nothing competes with the figures.

The world comes from the validated wall mockup of 2026-10-31 (direction C, `.handoff/ping-club/assets/wall-mockup/wall.html`): Archivo used across its width axis (narrow figures, narrower scores), square-cornered blocks, a seven-stripe band under the club header, a drawn table-tennis table as the signature motif, and a colour per team. The same tokens drive five surfaces (display, wall, umpire console, organiser console, spectator phone view); the display and the wall are sized by the viewport, the others by their containers.

Tone is factual and sentence-case. Headings are quiet and muted; the figures do the shouting. The drawn table appears where it carries meaning (the wall, the hall plan, a table's umpire header, the printable QR sheet, a spectator's table card), never as wallpaper; the umpire's two point targets stay big flat buttons, because speed and error-proofing beat illustration there.

**Key Characteristics:**
- Black on white: paper field, white surfaces, navy ink, no dark theme.
- One orange, as a fill, for what needs a decision now; ink text on it.
- The table's blue for focus today and for the drawn table on the wall.
- Archivo variable on its width axis: names 84%, figures 72%, scores 64% at 800.
- Square corners on every block; circles only for dots and the switch.
- Flat UI chrome; depth only inside the drawings and on floating menus.

## Colors

A cool paper-and-navy ground, one saturated orange, and the table's blue. All tokens are authored in hex in `apps/web/src/presentation/styles/_tokens.sass` (`color-scheme: light`); the frontmatter mirrors them.

### Primary
- **Decision Orange** (live): the only warm hue, and always a **fill**: the match-point pill, the running time-out tile, the live dots (connection, organiser, spectator), the countdown arc. Text and icons on it are **Hall Ink** (on-live), at about 6:1. Orange on white sits near 2.7:1, so it is never a text or thin-icon colour on a light ground.
- **Burnt Orange** (live-ink): the orange's text voice. Small orange text and icons on paper or white (the umpire's "serving" marker, the waiting stage's live line, spectator and organiser live labels, the text caret), at about 7:1 on white.

### Secondary
- **Table Blue** (focus, table): the focus colour of every control (ring and focused field border) and, on the wall, the drawn table's playing surface. **Table Edge** (table-dark) is the table's front edge and the shadow under its white score digits; **Idle Table** (table-idle) greys a free table.

### Tertiary
- **Hall Sky** (sky): text selection today; on the wall, the QR column's ground.
- **Card Yellow** (card-yellow): the yellow card mark only, never a status colour.

### Neutral
- **Paper** (field): the page background on every surface.
- **White** (surface): live tiles, summary column, match cards, inputs, tab tracks, point targets, select triggers.
- **Mist Grey** (surface-raised): table-number chips, games-won wells, popovers, toggle chips, hover on white.
- **Silver** (surface-high, rule): hairlines, list hover, the finished-match pill, the scrollbar thumb, a disabled secondary button's edge.
- **Slate Edge** (edge): the 2px border of inputs, selects and the switch track; on the wall, the FFTT ranking points beside a name.
- **Hall Ink** (ink): names, figures, running text; also the fill of primary, stop, selected tab, selected toggle, selected switch, and the hover of a secondary button.
- **Harbour** (ink-muted): labels, section headings, times, hints, the event line.
- **Dusk** (ink-dim): the losing side of a finished match, disabled text, placeholders, the games strip in a tile foot.
- **White On Ink** (on-ink): text and icons on ink fills.
- **QR Paper** (qr-paper): the QR code's own background only, for scanner contrast.

### Named Rules
**The Orange Asks Rule.** Orange marks what needs a decision or is running right now (match point, game or match won awaiting validation, a running time-out, a live connection). If removing it would not lose that information, it is not orange. It is a fill with ink on it; as text or a small icon it becomes Burnt Orange.

**The Ink Alarm Rule.** Errors, offline and refusal states are drawn in ink: an ink fill with white text (offline and refused badges) or an ink border with an ink error line and an icon. Never red, never orange. The palette has no warning hue; urgency comes from the heaviest neutral.

**The Losing Side Dims Rule.** A finished match dims the loser (ink-dim) rather than highlighting the winner.

**The Calm Score Rule.** A score is never coloured to signal game or match point. The state pill carries it; the digits stay ink.

## Typography

**Display Font:** Archivo variable (with a metric-matched local "Archivo fallback", then Arial Narrow, sans-serif), width axis 62% to 125%, weight axis 100 to 900, self-hosted woff2 for latin and latin-ext.
**Body Font:** Archivo variable at its normal width (with "Archivo fallback", system-ui, -apple-system, Segoe UI, sans-serif).

**Character:** one family, three widths. Running text at the normal width, names a little condensed (84%), figures narrow (72%) and the point score narrowest and heaviest (64%, 800), so the hall reads one voice that tightens as the information gets more urgent. Archivo has no `lnum`; its default figures are already lining and `tnum` keeps them fixed-width.

### Hierarchy
- **Display** (800, width 64%, 37 units of a tile, line-height 0.86, -0.01em): the point score in a live tile. The umpire's point target uses the same voice fitted to its target, `clamp(var(--text-score), min(52cqi, 116cqh - 5rem), 20.625rem)`, never below `--text-score` (4rem). Always the largest element on the surface.
- **Headline** (700, width 84%, 1.75rem, 1.15): page titles on tool pages; on the display, the club name at 3cu. The home hero grows from 2rem to 3.25rem at 1.05 with -0.01em.
- **Title** (600, width 84%, 1.25): player and team names in cards and lists. In tiles, names scale with the tile (10 units, 8 when long) and truncate with an ellipsis.
- **Body** (500, 1rem, 1.45): running text; measure capped at 26em for intros, forms at 28rem.
- **Label** (600, 0.875rem, 1.2, muted): section headings and field labels, sentence case.
- **Figure** (700, width 72%, tabular, line-height 1): table numbers, games won (600), game scores, clock, times, counts. Body text also enables tabular numerals globally.

UI and body text take the steps `--text-2xs` to `--text-3xl` (0.75rem to 1.5rem), `--text-m` (1rem) being the body. A display size takes a role name: `--text-title` (1.75rem), `--text-code` (1.75rem), `--text-code-entry` (3.375rem), `--text-figure` (2.25rem), `--text-score` (4rem), and two fluid ones, `--text-hero` (2rem to 3.25rem) and `--text-player` (1.25rem to 2rem, a name on a point target). The big numbers come from container units, not from this scale. Weight, width, leading and tracking live only in the `_typography.sass` mixins; widths through `--stretch-name`, `--stretch-figure`, `--stretch-score`.

### Named Rules
**The Every Number Is A Figure Rule.** Any number the room reads (score, games, table, time, clock, count) uses the figure voice: Archivo at 72% width with tabular figures, so digits never shift width as they change. The point score narrows to 64% and 800.

**The Quiet Heading Rule.** Section headings are sentence case, muted, 600 and small. No uppercase tracking, no kickers or eyebrows above titles. Wide tracking is reserved for literal join codes typed or read by umpires and organisers (0.08em, 0.22em on the umpire's entry field).

## Layout

Two geometries share one token set.

**The display** is sized by the viewport through `--cu` (one hundredth of the screen height, capped by width at 16:9: `min(1dvh, 0.5625vw)`), so a TV, a projector and a laptop show the same composition at their own size. Header row, then a board: live tiles on the left taking the remaining width, summary column fixed at 40cu on the right. Gaps are 1.2cu. Tiles are ordered by table number and laid out by a computed column/row count; paging is a last resort with a thin progress bar in the header. Inside a tile, everything is drawn on `--unit` (`min(1cqh, 0.75cqw)` of the tile's container), in four rows (18 units, two flexible player rows, 12 units): head (table number, label, one pill), two player rows, foot (game history and elapsed time). Player rows are a fixed grid: serve mark (6.5 units), name, games well (14), score (39). Below a 45rem page the display stacks into one scrolling column (`--cu` fixed at 0.4375rem) with the summary underneath. The wall pairing page draws on the same `--cu`.

**Tool surfaces** (umpire, organiser, spectator, home, legal) use the rem spacing scale and a page column capped at 92.5rem with the 1rem gutter widened to the safe area. Layout breaks are container queries on the page width (`body` is the `page` container) at 43.75, 53.75, 60 and 68.75rem. Controls never fall below `--control-height` (3rem, over the 44px target). The umpire console splits into two large point targets, one per side.

The summary column clips lists to whole rows (never a half-visible item) and gives results priority: "à suivre" shrinks first when the column runs out of room; the QR block sits at the bottom.

## Elevation & Depth

UI chrome is flat: tiles, cards, panels and controls sit on the paper without shadows, separated by the white/paper step and the grey wells. Edges are inset rings (`--inset-hairline` 1px silver, 2px ink on secondary buttons, 2px orange or muted on outlined pills) rather than outer borders, so they never change layout. The drawn table on the wall is the one place with modelled depth, and that depth belongs to the drawing (see Committed, not yet built).

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 14px 34px rgb(14 34 56 / 40%)`): popovers and list-box menus only.
- **Key cap** (`box-shadow: inset 0 -2px 0 var(--field)`): keyboard-shortcut hints on the umpire console on laptops.

### Named Rules
**The Flat Chrome Rule.** Resting UI surfaces never cast shadows. To set something apart, put it on white over paper or in a grey well; the overlay shadow is for content that floats.

## Shapes

Square corners everywhere: tiles, the summary column, cards, buttons, inputs, tabs, toggles, pills, table-number chips, popovers. No radius tokens remain except `--radius-full`. Circles are a separate shape, not a softened corner: the switch track and thumb, the live dots (`50%`), and on the wall the games-won dots and their pill. Serving is a small solid triangle, the only pictorial shape inside a tile.

### Named Rules
**The Square Block Rule.** A rectangle is square-cornered. Roundness only appears as a full circle or a full pill, and only where the world draws one: a dot, a switch, the games-won pill.

## Components

### Buttons
Plain and confident, one obvious action per screen.
- **Shape:** square.
- **Secondary (default):** no fill (it shows the ground it sits on), a 2px ink inset edge, ink text 600, 3rem minimum height; hover inverts to an ink fill with white text; pressed scales to 0.985; disabled swaps the edge to silver and the text to dusk.
- **Primary:** ink fill, white text 700 at 1.0625rem, taller (3.75rem); hover darkens slightly (`brightness(0.92)`); disabled drops to mist grey with dusk text. One per screen.
- **Quiet:** no edge, muted text, 3rem; hover fills mist grey and turns the text to ink.
- **Stop:** ink fill, white text 700, at the secondary's height, for ending or irreversible actions (end match). Primary and stop share the fill and never share a screen.
- **Focus:** 3px Table Blue ring at 3px offset, shared by every focusable control.

### Chips (state pills)
- **Style:** square, 700 at line-height 1.05, sized in em so it scales with the tile; enters with a fade and scale from 0.9 (340ms, ease-out).
- **Tones (built):** match point = orange fill, ink text; game point = 2px orange inset outline, ink text; deuce = 2px muted inset outline, ink text; over = silver fill, ink text, with a check icon. At most one per tile.

### Cards / Containers
- **Live tile:** white, square, no border, no shadow; enters with a fade and scale from 0.95 (640ms). The score stays ink; the losing side dims after the match.
- **Summary column:** one white panel; blocks for team encounters, results with finish times, free tables with next-match ETA, "à suivre" (each start in muted figures above the names, so a doubles pair keeps the full width), and the QR.
- **Match card (spectator):** white, square, the header row is the disclosure trigger; expanded detail sits below a hairline with a per-game table.
- **Hall plan (spectator):** the organiser's plan, read-only (`features/spectator/room-*`): a mist-grey floor, a column without tables kept as a narrow aisle, a row without tables closed up, the stands ("Gradins") in a floor-shade band along the bottom. One white card per standing table, drawn on its own width: an ink plate with the table number, the line's call ("Puis B – Y" on a free table) and a Burnt Orange star for a followed player; the drawn table, idle grey when free, with each side's games-won dots in the wall's dark pill on its half; the point score below it in the score voice at 30% of the card's width, never under 1.75rem up to eight tables, the loser at 40% while a won game awaits validation; the serve triangle in Burnt Orange at the net end of the server's score; the family names (initial and name once the card reaches 9rem) on a 2px team-colour underline, silver for a white team, dusk for the match a free table waits for. A tap rings the card in ink and opens its match card below the plan. Past eight tables every size shrinks with its card and the visitor pinches.
- **Internal padding:** tool cards 0.75 to 1rem; display panels in cu.

### Inputs / Fields
- **Style:** white fill, 2px slate-edge border, square, 3rem minimum height, 600 value text; label above in muted 0.875rem 600; placeholder in dusk 500.
- **Hover / Focus:** hover turns the border ink; focus turns it Table Blue (no glow).
- **Error:** ink border plus a 1px ink inset ring; error line in ink 600 with an icon. **Disabled:** dusk text.
- **Select:** same box as a field, chevron rotates on open; the popover is mist grey with the overlay shadow, scrolling inside its list; options hover silver, the selected one carries a neutral ink check.
- **Switch:** paper track with a 2px slate inset and a muted thumb; on, the track fills ink and the thumb turns white.
- **Code inputs:** figure voice, large, centred, uppercase with wide tracking (literal codes only).
- **Pick field** (`features/club/pick-field.tsx`): a field's box with a muted search glass, suggesting as soon as it is touched (the select's popover, each entry's detail in muted small text on its right) and narrowing on the first letters of any word; "Ajouter …" with a plus icon is the last entry, and only when nothing matches. A handful of entries stand as toggle chips under it, one tap away; when the chips hold every entry, they are the whole field.

### Navigation
- **Tabs:** a white track with 0.25rem padding; tabs are muted text at 3rem, the selected tab fills ink with white text. Counts inside tabs use the figure voice. A bar whose tabs no longer fit (organiser, spectator) scrolls sideways out over the gutters with no scrollbar, a shade of the paper fading in over each edge that still hides tabs, the selected tab kept in view (`tab-bar.scrolling`).
- **Toggle groups:** mist grey chips, silver on hover; the selected one fills ink with white text.
- **Links:** ink text with a dusk 1px underline at 0.22em offset.

### Live Tile (signature, display)
Table number chip, muted single-line label, optional single state pill; two rows of serve triangle, name, games-won well (mist grey, figure 600) and point score (display voice, right-aligned); a foot with the game history in dusk figures (won games in muted) and elapsed time. Every dimension is a multiple of the tile's own unit, so the score keeps its share at any grid size.

### Point Target (signature, umpire)
A half-screen tap target per side: white, square, 1px silver inset edge; name (width 84%, 700) with a Burnt Orange "serving" marker, a giant centred score, and a foot with games won. Hover fills mist grey; on tap it scales to 0.988 and flashes a 3px orange inset ring.

## The wall (built 2026-11-01)

The wall mockup (`.handoff/ping-club/assets/wall-mockup/wall.html`, validated 2026-10-31) is built: `features/display/wall-*.tsx`, shown automatically on a display whose tables all belong to team encounters of at most two tables each (up to six rows); any other day keeps the open board. The drawn table is `presentation/components/drawn-table.tsx`, reused by the printed table sheet and meant for the hall plan (06) and the spectator's table card (08). Sizes below are pixels on the mockup's 1920×1080 stage; on the wall they are `--cu` (1cu = 10.8px on that stage). The mockup's in-between weights snap to the weights the fallback faces cover (700 and 800) in the `wall-*` mixins of `_typography.sass`. Tokens: `--table`, `--table-dark`, `--table-idle`, `--floor-shade` (the floor's lower part), `--sky`, `--card-yellow`, `--card-red` (the red half of a yellow-red card), `--scrim-strong` (the games-won pill), `--team-shade` (the darker score cell on a team colour), `--band`. A white team (the opponents' default) keeps a 2px silver inset on its block, an ink ring on its letter square and a silver chip underline. The legal footer and the scrollbar gutter are dropped on the wall above phone width; on a phone the rows stack and scroll.

### Wall page
- **Header** (84px, white): club logo (72px) + club name (width 78%, ~780, 46px, -0.01em) + event line (500, 26px, ink-muted). No date, clock or app name.
- **Seven-stripe band** (21px) under the header: seven equal hard-stopped horizontal stripes, top to bottom #1C5A9E, #2F7FC1, #8FCBEF, #00894A, #6DBE45, #BADF9B, #F07F1E (`--band`). Hard stops only; it is the one multi-colour element.
- **Body grid:** `minmax(0, 1fr) 250px`, one row per encounter (a pair of tables), the QR column spanning all rows on Hall Sky. Each row is a white group with a 2px silver inset: the encounter block (340px) then its two table cells.
- **Encounter block:** home team on top, away below, each on its team colour with its text colour; name 27px on one line, encounter score (parties won, up to 20) 52px on a darker shade of the same colour (`rgb(0 0 0 / 18%)` over it).
- **As the hall (06):** when the event's hall plan (`EventSetup.hall`, default the club's eight-table hall) holds every encounter of the screen in one rectangle of its tables, the body follows the plan instead: one white frame per encounter where its tables stand, empty aisles closed up, the encounter's two teams in a band across the frame's top (home name then score, away score then name, the scores meeting in the middle), its tables below side by side or stacked; the QR takes the free place nearest the stands on the left, Hall Sky, the QR beside its words. Otherwise the rows below. The organiser's plan (`organiser/hall-plan.tsx`) draws the same tables on a mist-grey floor with the stands along the bottom.
- **QR column:** QR on white with 12px padding, prompt, join code in a white box (width 75%, ~820, 54px, 0.12em tracking), full URL.

### Table cell
- **Head:** an ink plate with white "Table N" (width 78%, ~760, 26px), the call ("B – X", "Double", never the sheet's "Double 1") in ink-muted 600, and one state pill.
- **Drawn table, in perspective:** an SVG trapezoid in Table Blue with a Table Edge front strip, white edges and centre line, an ink net and ink legs, at a fixed ~2.7:1 proportion, centred, never stretched; the floor (mist grey, the lower 38% a step darker, #D3DADF) shows on both sides. A free table turns Idle Table and carries a white card "Table libre / Prochain match A – Y / names", lifted by `0 6px 14px -6px rgb(14 34 56 / 40%)`.
- **Scores:** big white digits (width 62%, ~820, `min(124px, 47cqh)`, line-height 0.86, -0.02em) centred in each blue half at 58% height, with a hard `0 3px 0` Table Edge text shadow. While a game or match win awaits validation, the loser's score drops to 40% opacity.
- **A finished match is held** about four seconds (`LINGER_MS`, as the open board does) before the table turns free: the big digits become the games won (3 and 1), the dots and the serve triangle leave, the loser's digits stay at 40%, and the pill says how it ended.
- **Games-won dots in a dark pill:** a column of 13px circles in a full pill of `rgb(14 34 56 / 60%)` beside each score, on the outer side; white = won, a 2px white ring (85%) = not yet; the count is the games needed to win.
- **Player chip** at each top outer corner: white, with a 5px inset underline in the team colour; a letter square in the team colour with its text colour, then "Prénom Nom" (width 76%, ~680, 21px). Doubles: each player on their own line, same size as a single; a player's card follows his own name on his line (a little smaller, on the net side), since a doubles card is a player's, and the marks line keeps the time-out and a card given to the pair. The player's FFTT points follow the name, smaller (0.8em, width 70%, 600, Slate Edge), no "pts", nothing when unknown.
- **Serve triangle** at the net end of the server's name, pointing to the net (14×18px). No ball icon: balls are white and read as an empty dot. On a white chip it takes Burnt Orange, as the shipped point target does, since Decision Orange on white is under 3:1 for a mark that carries meaning on its own.
- **Marks line** under the name, fixed order, an absent mark takes no space (a lone mark sits against the outer edge); the worst case (triangle + card + stopwatch on one player) must hold:
  - **Tilted yellow card:** a 16×22px Card Yellow rectangle rotated -6deg with a 1.5px `rgb(14 34 56 / 50%)` edge.
  - **Stopwatch time-out tile:** 24×26px ink tile with a white stopwatch icon (never a "T"); Decision Orange with an ink icon while the time-out runs.
- **Running time-out countdown:** a 66px white disc with a 60s orange arc and the seconds in ink (width 70%, ~820), above the net, never over a score.

### State pills (wall)
Square, ~720, ink text, with these words only (no "à valider"):
- **"Manche gagnée"** and **"Match gagné 3–1"**: Decision Orange fill with a check icon.
- **"Égalité"** (10–10 and beyond): 3px ink inset outline.
- **"Belle"** (the decider): 3px orange inset outline.
- **"Terminé"** (or "Forfait", "Abandon"), only while a finished match is held: Silver fill with a check icon, as the open board's over pill; nothing is left to decide, so no orange.

### Tournament wall (Top 12)
One row per pool: an ink plate "Poule N" over its table (rank, a square in the player's club colour with his pool number or the club logo, name over club, pool points in figures; the two going through on mist grey), then the pool's tables. A pool on more than four tables takes as many lines (four side by side at most), its table spanning them; past six lines in all, the open board takes over. The final phase gets its own row once its matches hold tables.
- **As the hall:** when the plan places every table shown in at most three columns and three rows, the pools stack down the left (sharing the height by their length), each table stands at its place in its own white frame, its call starting with its pool ("Poule 1 · 2 – 5"), and the QR takes the free place nearest the stands on the left, or its own column when the tables fill the hall.

### Team colours
A colour per team, not per club (Angles 1 is not Angles 2), set in the team settings, editable with a colour picker, each paired with a text colour chosen for contrast. Used on the encounter block, the player letter square and the chip underline; never on a pill, a mark or a score. Defaults the club gave:

| Team | Colour | Text | Contrast |
|---|---|---|---|
| Angles 1, sky blue | #8FCBEF | ink #0E2238 | 9.2:1 |
| Angles 2, orange | #F4A259 | ink #0E2238 | 7.8:1 |
| Angles 3, yellow | #E9C46A | ink #0E2238 | 9.6:1 |
| Angles 4, green | #007A42 | white #FFFFFF | 5.4:1 |
| Angles 5, salmon | #F4A08C | ink #0E2238 | 7.9:1 |
| Angles 6, blue-grey | #8DA4BA | ink #0E2238 | 6.2:1 |
| Angles 7, green-grey | #8FA89A | ink #0E2238 | 6.3:1 |
| Opponents (default) | #FFFFFF | ink #0E2238 | 16:1 |

Angles 2's orange is a lighter tangerine than Decision Orange and Angles 3's yellow a deeper mustard than Card Yellow, so a team never reads as a state; the picker should warn when a chosen colour comes within reach of `--live` or `--card-yellow`. A white opponent block keeps a 2px silver inset so it holds on the white group. The text colour is computed (ink or white, whichever passes 4.5:1) and can be overridden.

## Do's and Don'ts

### Do:
- **Do** make the point score the largest element of any surface that shows a live score, in the score voice (width 64%, 800).
- **Do** set every number in the figure voice with tabular figures.
- **Do** use orange as a fill with ink on it, for what needs a decision or is running; use Burnt Orange (`--live-ink`) for small orange text and icons.
- **Do** use Table Blue for focus: a 3px ring at 3px offset, a blue border on a focused field.
- **Do** keep every rectangle square; circles only for dots, the switch and the games-won pill.
- **Do** draw errors and offline states in ink (fill or border) with an icon.
- **Do** order display tiles by table number and keep them still; reflow only when a match starts or ends.
- **Do** truncate names with an ellipsis on one line rather than wrapping inside a tile.
- **Do** give each state an icon or a drawing (serve triangle, yellow card, stopwatch) before a word.
- **Do** keep one primary action per screen.

### Don't:
- **Don't** colour a score to signal game or match point; the pill carries it.
- **Don't** set text or thin icons in `--live` on paper or white.
- **Don't** introduce red, green or a second warm hue for status; team colours stay on team positions.
- **Don't** put more than one state pill on a tile, or add badges, logos or tickers to tiles.
- **Don't** add shadows or soft gradients to resting UI surfaces; the band's hard stops and the drawn table's own depth are the only exceptions.
- **Don't** round a rectangle's corners.
- **Don't** set section headings in uppercase with letter-spacing, or add eyebrow labels above titles.
- **Don't** size display or wall text in rem; they draw on `--cu` and tiles on `--unit`.
- **Don't** show half a list item in the summary column; clip to whole rows.
- **Don't** use the drawn table as wallpaper, or on the umpire's point targets.
