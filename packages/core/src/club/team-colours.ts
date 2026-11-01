/** Ink, the app's text colour on light grounds. */
const INK = '#0E2238'
const WHITE = '#FFFFFF'

/**
 * The colours the club gave its teams, Angles 1 to 7 in order (DESIGN.md
 * "Team colours"), then white for an opponent. A new team takes the first one
 * no other team wears.
 */
export const TEAM_COLOURS = [
  '#8FCBEF',
  '#F4A259',
  '#E9C46A',
  '#007A42',
  '#F4A08C',
  '#8DA4BA',
  '#8FA89A',
  WHITE
] as const

export const DEFAULT_OPPONENT_COLOUR = WHITE

const channel = (hex: string, offset: number): number => {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255

  return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const luminanceOf = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)

const contrastBetween = (first: string, second: string): number => {
  const [lighter, darker] = [luminanceOf(first), luminanceOf(second)].sort(
    (a, b) => b - a
  )

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

/** Ink or white, whichever reads better on the team's colour. */
export const textColourOn = (colour: string): string =>
  contrastBetween(colour, INK) >= contrastBetween(colour, WHITE) ? INK : WHITE

/** The first of the club's colours no team wears yet; the first again once all are taken. */
export const nextTeamColour = (worn: readonly string[]): string => {
  const taken = new Set(worn.map((colour) => colour.toUpperCase()))

  return TEAM_COLOURS.find((colour) => !taken.has(colour)) ?? TEAM_COLOURS[0]
}
