/** Every page the web app routes: the client renders them, the worker answers 404 for any other address. */
export const PAGE_ROUTES = {
  display: '/e/:eventId/display',
  displayOf: '/e/:eventId/display/:displayId',
  home: '/',
  organiser: '/e/:eventId/organiser',
  spectator: '/e/:eventId',
  umpire: '/e/:eventId/umpire/:umpireCode',
  umpireEntry: '/e/:eventId/umpire'
} as const
