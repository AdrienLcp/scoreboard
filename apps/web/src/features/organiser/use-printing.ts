import { useEffect, useState } from 'react'

/**
 * Prints what only exists while printing: `isPrinting` turns on, the page
 * renders its sheets, the print dialog opens, and the sheets go once it
 * closes. Ctrl+P alone still prints the page as it is.
 */
export const usePrinting = (): { isPrinting: boolean; print: () => void } => {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (!isPrinting) {
      return
    }

    const stop = () => setIsPrinting(false)
    window.addEventListener('afterprint', stop)
    window.print()

    return () => window.removeEventListener('afterprint', stop)
  }, [isPrinting])

  return { isPrinting, print: () => setIsPrinting(true) }
}
