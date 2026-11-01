import type { Context, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

import type { ApiErrorResponse } from '@scoreboard/protocol/routes'

const invalidInputBody: ApiErrorResponse = {
  code: 'invalid_input',
  message: 'Input does not match the contract'
}

const notFoundBody: ApiErrorResponse = {
  code: 'not_found',
  message: 'No route behind this address'
}

const internalErrorBody: ApiErrorResponse = {
  code: 'internal_error',
  message: 'Unexpected failure'
}

export const answerInvalidInput = (context: Context) =>
  context.json(invalidInputBody, 400)

/** The validation hook every `zValidator` takes. */
export const invalidInput = (result: { success: boolean }, context: Context) =>
  result.success ? undefined : answerInvalidInput(context)

export const answerNotFound = (context: Context) =>
  context.json(notFoundBody, 404)

export const answerUnexpected: ErrorHandler = (error, context) => {
  if (error instanceof HTTPException) {
    const body: ApiErrorResponse = {
      code: 'invalid_input',
      message: error.message
    }

    return context.json(body, error.status)
  }

  console.error({ error, message: 'Unhandled error', path: context.req.path })

  return context.json(internalErrorBody, 500)
}
