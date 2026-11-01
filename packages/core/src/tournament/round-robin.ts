/** Two pool numbers, 1-based, that meet in a round: `[1, 6]` is player 1 against player 6. */
export type Pairing = readonly [number, number]

/** The clubs' fixed order for a pool of six: five rounds of three matches, everyone once a round. */
const SIX_PLAYER_ROUNDS: readonly (readonly Pairing[])[] = [
  [
    [1, 6],
    [2, 5],
    [3, 4]
  ],
  [
    [1, 5],
    [4, 6],
    [2, 3]
  ],
  [
    [1, 4],
    [3, 5],
    [2, 6]
  ],
  [
    [1, 3],
    [2, 4],
    [5, 6]
  ],
  [
    [1, 2],
    [3, 6],
    [4, 5]
  ]
]

const BYE = 0

/** The circle method: the first number stays, the others turn one place each round. */
const circleRounds = (size: number): Pairing[][] => {
  const seats = Array.from({ length: size }, (_, index) => index + 1)

  if (size % 2 === 1) {
    seats.push(BYE)
  }

  const rounds: Pairing[][] = []
  let turning = seats.slice(1)

  for (let round = 0; round < seats.length - 1; round += 1) {
    const circle = [seats[0] ?? BYE, ...turning]
    const half = circle.length / 2
    const pairings: Pairing[] = []

    for (let index = 0; index < half; index += 1) {
      const first = circle[index] ?? BYE
      const second = circle[circle.length - 1 - index] ?? BYE

      if (first !== BYE && second !== BYE) {
        pairings.push(first < second ? [first, second] : [second, first])
      }
    }

    rounds.push(pairings)
    turning = [...turning.slice(-1), ...turning.slice(0, -1)]
  }

  return rounds
}

/** Every pairing of a pool of `size` players, round by round: each one meets every other once. */
export const roundRobinRounds = (
  size: number
): readonly (readonly Pairing[])[] =>
  size === SIX_PLAYER_ROUNDS.length + 1 ? SIX_PLAYER_ROUNDS : circleRounds(size)
