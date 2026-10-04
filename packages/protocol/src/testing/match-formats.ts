import type { TableTennisFormat } from '../match-format'

export const BEST_OF_3: TableTennisFormat = {
  bestOf: 3,
  pointsPerGame: 11,
  sport: 'table-tennis'
}

export const BEST_OF_5: TableTennisFormat = { ...BEST_OF_3, bestOf: 5 }
