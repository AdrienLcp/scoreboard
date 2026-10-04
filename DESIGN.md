---
name: Scoreboard
description: Live table-tennis scores for the club room, readable from across the hall.
colors:
  field: "oklch(15.1% 0.025 267)"
  surface: "oklch(20% 0.04 267.5)"
  surface-raised: "oklch(24.9% 0.049 268)"
  surface-high: "oklch(29.9% 0.057 268)"
  rule: "oklch(32.1% 0.055 266)"
  ink: "oklch(97.2% 0.007 261)"
  ink-muted: "oklch(75.1% 0.039 267)"
  ink-dim: "oklch(62.1% 0.048 268)"
  live: "oklch(89.6% 0.199 122)"
  on-live: "oklch(18% 0.032 267)"
  qr-paper: "oklch(100% 0 0)"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, Arial Narrow, sans-serif"
    fontSize: "calc(var(--unit) * 37)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontFeature: "tnum, lnum"
  headline:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
  figure:
    fontFamily: "Barlow Condensed, Barlow, Arial Narrow, sans-serif"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum, lnum"
rounded:
  xs: "0.375rem"
  s: "0.625rem"
  m: "0.875rem"
  l: "1.125rem"
  xl: "1.375rem"
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
    rounded: "{rounded.m}"
    padding: "0.75rem 1rem"
    height: "3rem"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-live}"
    rounded: "{rounded.m}"
    padding: "0.75rem 1rem"
    height: "3.875rem"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-dim}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.m}"
    padding: "0.75rem"
    height: "2.75rem"
  button-quiet-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
  button-stop:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-live}"
    rounded: "{rounded.m}"
    padding: "0.75rem 1rem"
    height: "3rem"
  field-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "0.5rem 0.75rem"
    height: "3rem"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.s}"
    height: "2.75rem"
  tab-selected:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.ink}"
  toggle-button:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.s}"
    padding: "0.75rem 1rem"
    height: "2.75rem"
  toggle-button-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-live}"
  state-pill-match-point:
    backgroundColor: "{colors.live}"
    textColor: "{colors.on-live}"
    rounded: "{rounded.full}"
    padding: "0.34em 0.82em"
  state-pill-game-point:
    backgroundColor: "transparent"
    textColor: "{colors.live}"
    rounded: "{rounded.full}"
    padding: "0.34em 0.82em"
  state-pill-over:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
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
    rounded: "{rounded.l}"
  point-target:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1rem 1.25rem 0.75rem"
---

# Design System: Scoreboard

## Overview

**Creative North Star: "The Hall Scoreboard"**

A live-score product for the room. Every match in play owns the screen; everything else is folded into one calm summary column. The world is a deep navy field with white figures and a single lime accent that only ever means "live" or "hot". It is built to be read from 10 to 20 metres across a bright, noisy sports hall, so the score digits are the largest thing on any surface and nothing competes with them.

The system deliberately refuses the busy broadcast package: no badge clusters, no logo bugs, no gradients, no tickers. A tile carries a table number, a quiet label, two names, games won, the point score, and at most one state pill. Density comes from the grid, not from decoration. The same tokens drive four surfaces (display, umpire console, organiser console, spectator phone view); the display alone is sized by the viewport, the others by their containers.

Tone is factual and sentence-case. Headings are quiet and muted; the figures do the shouting. Benchmarked against Apple Sports, FlashScore/SofaScore and the WTT broadcast graphics, then pared back further for the room.

**Key Characteristics:**
- Dark tonal field, four navy steps, no shadows on resting surfaces.
- One accent, lime, reserved for live and hot states (serve, match point, game point, hot score, focus).
- Barlow Condensed tabular figures for every number the room reads; Barlow for names and text.
- Score digits are the largest element on every surface that shows a score.
- At most one state pill per tile; serving shown as a small lime triangle on the serving row.

## Colors

A near-monochrome navy ramp with white ink and one saturated lime voice. All tokens are authored in OKLCH in `apps/web/src/presentation/styles/_tokens.sass`; the frontmatter mirrors them.

### Primary
- **Scoreboard Lime** (live, ≈ #C8F03C): the only chromatic color. Marks what is happening right now: the serve triangle, a hot score (game or match point pending), the match-point pill fill, the game-point pill outline, the page-progress bar, the focus ring, text selection, the brand mark's lit stroke. Text on it is **Deep Ink Navy** (on-live).

### Neutral
- **Hall Night** (field, ≈ #070B16): the page background on every surface.
- **Tile Navy** (surface, ≈ #0E1528): live tiles, summary column, match cards, inputs, tab tracks, point targets.
- **Raised Navy** (surface-raised, ≈ #172039): table-number chips, games-won wells, popovers, hover on surface.
- **High Navy** (surface-high, ≈ #212C4A): selected tab, finished-match pill, list hover, scrollbar thumb.
- **Rule Navy** (rule, ≈ #26324F): hairlines, input borders, the 1px edge on secondary buttons and point targets.
- **Chalk White** (ink, ≈ #F3F6FB): names and figures; also the fill of the primary and "stop" buttons, the selected toggle and the offline badge.
- **Mist** (ink-muted, ≈ #A3AEC8): labels, section headings, times, hints, secondary detail.
- **Dusk** (ink-dim, ≈ #7A86A4): the losing side of a finished match, disabled text, placeholders, the games strip in a tile foot.
- **Deep Ink Navy** (on-live, ≈ #0B1120): text on lime and on white fills.
- **QR Paper** (qr-paper, white): the QR code's own background only, for scanner contrast.

### Named Rules
**The Lime Means Live Rule.** Lime marks live and hot states only. If removing it would not lose information about what is happening in a match right now (or where keyboard focus is), it should not be lime.

**The White Alarm Rule.** Errors, offline and refusal states are drawn in white (ink fill or ink border), never in red and never in lime. The palette has no warning hue; urgency comes from inverting to the brightest neutral.

**The Losing Side Dims Rule.** A finished match dims the loser (ink-dim) rather than highlighting the winner.

## Typography

**Display Font:** Barlow Condensed (with Barlow, Arial Narrow, sans-serif), weights 600 and 700.
**Body Font:** Barlow (with system-ui, -apple-system, Segoe UI, sans-serif), weights 500, 600, 700.

**Character:** a condensed athletic numeral for everything counted and a plain humanist sans for everything named. The pair reads like a hall scoreboard, not a magazine.

### Hierarchy
- **Display** (Barlow Condensed 700, 37% of a tile's unit, line-height 0.86, -0.01em): the point score inside a live tile; the umpire's point target uses the same face at clamp(6rem, min(21vh, 42vw), 18.75rem). Always the largest element on the surface.
- **Headline** (Barlow 700, 1.75rem, 1.15): page titles on tool pages; on the display, the club name at 3cu.
- **Title** (Barlow 600, 1.0625rem, 1.25): player and team names in cards and lists. In tiles, names scale with the tile (10 units, 8 when long) and truncate with an ellipsis.
- **Body** (Barlow 500, 1rem, 1.45): running text; measure capped at 65ch, forms at 28rem.
- **Label** (Barlow 600, 0.875rem, 1.2, muted): section headings and field labels, sentence case.
- **Figure** (Barlow Condensed 700, tabular and lining numerals, line-height 1): table numbers, games won, game scores, clock, times, counts. Body text also enables tabular numerals globally.

The text scale is fine-grained between 0.75rem and 1.3125rem (2xs to 2xl), then jumps to 1.75rem and 2.25rem; the big numbers do not come from this scale but from container-relative units.

### Named Rules
**The Every Number Is A Figure Rule.** Any number the room reads (score, games, table, time, clock, count) uses the figure style: Barlow Condensed with tabular lining numerals, so digits never shift width as they change.

**The Quiet Heading Rule.** Section headings are sentence case, muted, 600 weight and small. No uppercase tracking, no kickers or eyebrows above titles. Uppercase with wide tracking is reserved for literal join codes typed or read by umpires and organisers.

## Layout

Two geometries share one token set.

**The display** is sized by the viewport through `--cu` (one hundredth of the screen height, capped by width at 16:9: `min(1vh, 0.5625vw)`), so a TV, a projector and a laptop show the same composition at their own size. Header row, then a board: live tiles grid on the left taking the remaining width, summary column fixed at 40cu (~22% of a 16:9 screen) on the right. Gaps and tile radii are 1.2cu. Tiles are ordered by table number and laid out by a computed column/row count; paging is a last resort with a thin lime progress bar in the header. Inside a tile, everything is drawn on `--unit` (`min(1cqh, 0.75cqw)` of the tile's container), in four rows: head (table number, label, one pill), two player rows, foot (game history and elapsed time). Player rows are a fixed grid: serve mark, name, games well, score. At 720px and below the display reflows into a single scrolling column with fixed-height tiles and the summary underneath.

**Tool surfaces** (umpire, organiser, spectator, home) use the rem spacing scale and a page column capped at 92.5rem with a 1rem gutter on both sides. Layout breaks are container- and width-based around 700, 860, 960 and 1100px. The umpire console splits into two large point targets, one per side.

The summary column clips lists to whole rows (never a half-visible item) and gives results priority: "à suivre" shrinks first when the column runs out of room; the QR block sits at the bottom.

## Elevation & Depth

Flat by default. Depth is tonal: field, then surface, then raised, then high, each a small lightness step in the same navy hue. Edges are drawn as inset 1px or 2px rings (`--edge`, `--edge-live`, `--edge-muted`) rather than outer borders, so they never change layout.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 0.875rem 2.125rem oklch(0% 0 0 / 55%)`): popovers and list-box menus only, the one thing that floats above the page.
- **Key cap** (`box-shadow: inset 0 -2px 0 var(--field)`): keyboard-shortcut hints on the umpire console on laptops.

### Named Rules
**The Tonal Step Rule.** Resting surfaces never cast shadows. To lift something, move it one step up the navy ramp; reserve the overlay shadow for content that actually floats.

## Shapes

Softly rounded rectangles throughout, one radius family: 0.375rem for chips and key caps, 0.625rem for tabs, toggles and list items, 0.875rem for buttons, inputs and tab tracks, 1.125rem for spectator match cards, 1.375rem for the umpire's point targets, full pills for state pills and connection badges. On the display, tiles and the summary column share a viewport-relative radius (1.2cu); table-number chips are rounded at 0.2em of their own size so they stay proportional at any scale. Serving is a small solid triangle, the only pictorial shape inside a tile.

## Components

### Buttons
Plain and confident; one obvious action per screen.
- **Shape:** gently rounded (0.875rem).
- **Secondary (default):** transparent with a 1px inset rule edge, ink text, 600 weight, 3rem minimum height; hover fills surface; pressed scales to 0.985.
- **Primary:** lime fill with on-live text, 700 weight, larger type (1.0625rem) and taller (3.875rem); hover brightens slightly; disabled drops to raised navy with dim text. One per screen.
- **Quiet:** no edge, muted text, 2.75rem touch height; hover fills raised navy and brightens the text.
- **Stop:** white fill with on-live text, for ending or irreversible actions (end match).
- **Focus:** 3px lime outline at 3px offset, shared by every focusable control.

### Chips (state pills)
- **Style:** full pill, 700 weight, sized in em so it scales with the tile; enters with a short fade and scale (340ms, ease-out).
- **Tones:** match point = lime fill; game point = lime 2px inset outline with lime text; deuce = muted 2px outline with white text; over = high navy fill. At most one per tile.

### Cards / Containers
- **Live tile:** surface navy, viewport-relative radius, no border, no shadow; enters with a fade and scale from 0.95 (640ms). The hot score turns lime; the losing side dims after the match.
- **Summary column:** one surface panel; blocks for team encounters, results with finish times, free tables with next-match ETA, "à suivre", and the QR.
- **Match card (spectator):** surface navy, 1.125rem radius, header row is the disclosure trigger; expanded detail sits below a hairline with a per-game table.
- **Internal padding:** tool cards 0.75 to 1rem; display panels in cu.

### Inputs / Fields
- **Style:** surface fill, 2px rule border, 0.875rem radius, 3rem minimum height, 600 weight value text; label above in muted 0.875rem 600.
- **Focus:** border turns lime (no extra glow).
- **Error:** border and a 1px inset ring in white, error text in white 600 with an icon. **Disabled:** dim text.
- **Code inputs:** figure face, large, centered, uppercase with wide tracking (literal codes only).

### Navigation
- **Tabs:** a surface track with 0.25rem padding; tabs are muted text at 2.75rem touch height, the selected tab fills high navy with white text. Counts inside tabs use the figure style.
- **Toggle groups:** raised navy chips; the selected one inverts to a white fill.
- **Links:** white text with a dim underline that turns lime on hover.

### Live Tile (signature)
Table number chip, muted single-line label, optional single state pill; two rows of serve triangle, name, games-won well (raised navy, figure 600) and point score (display figure, right-aligned); a foot with the game history in dim figures (won games brighter) and elapsed time. Every dimension is a multiple of the tile's own unit, so the score keeps its share at any grid size.

### Point Target (signature, umpire)
A full-half-screen tap target per side: surface fill, 1.375rem radius, 1px inset edge; name with a lime "serving" marker, a giant centered score, and a foot with games won. On tap it scales to 0.988 and flashes a 3px lime inset ring for 550ms. The hot score turns lime as on the display.

## Do's and Don'ts

### Do:
- **Do** make the point score the largest element of any surface that shows a live score.
- **Do** set every number in Barlow Condensed with tabular lining numerals.
- **Do** keep lime for live and hot states: serve, hot score, match/game point, focus, page progress.
- **Do** order display tiles by table number and keep them still; reflow only when a match starts or ends.
- **Do** build depth from the four navy steps; use the overlay shadow only for floating menus.
- **Do** draw errors and offline states in white, inverted onto the dark field.
- **Do** truncate names with an ellipsis on one line rather than wrapping inside a tile.
- **Do** keep one primary action per screen.

### Don't:
- **Don't** put more than one state pill on a tile, or add badges, logos or tickers to tiles.
- **Don't** introduce a second accent hue, or red/orange/green for status.
- **Don't** add shadows, gradients or glows to resting surfaces.
- **Don't** set section headings in uppercase with letter-spacing, or add eyebrow labels above titles.
- **Don't** size display text in rem; the display draws on `--cu` and tiles on `--unit`.
- **Don't** show half a list item in the summary column; clip to whole rows.

**Primary buttons are white.** Primary actions are filled with Chalk White and Deep Ink Navy text, never lime: a button is not live, so it falls under the Lime Means Live Rule like everything else. Primary and stop share the fill and never share a screen (primary starts or confirms, stop ends); primary is set apart by its larger height and type. One primary action per screen.
