import { customAlphabet } from 'nanoid'

import type { DrawCode } from '@scoreboard/core/access/access-codes'

export const drawSecureCode: DrawCode = (alphabet, length) =>
  customAlphabet(alphabet, length)()
