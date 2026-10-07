const FRENCH_COLLATOR = new Intl.Collator('fr')

/** Orders two strings as a French reader expects, an accented letter beside its bare one. */
export const compareFrench = FRENCH_COLLATOR.compare
