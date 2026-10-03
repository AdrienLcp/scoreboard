/** A house class with the caller's, for a primitive whose `className` is a plain string. */
export const withClass = (base: string, extra: string | undefined): string =>
  extra === undefined ? base : `${base} ${extra}`
