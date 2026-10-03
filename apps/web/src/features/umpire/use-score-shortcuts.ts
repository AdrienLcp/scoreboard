import { useEffect, useEffectEvent } from 'react'

import type { Side } from '@scoreboard/protocol/side'

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT')

/**
 * Scoring from a keyboard: the left and right arrows give the point to the
 * side standing on that side of the screen, Backspace or Ctrl+Z takes it back.
 */
export const useScoreShortcuts = ({
  isEnabled,
  onPoint,
  onUndo,
  order
}: {
  isEnabled: boolean
  onPoint: (side: Side) => void
  onUndo: () => void
  /** The sides as the screen shows them, left first. */
  order: readonly [Side, Side]
}): void => {
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (!isEnabled || event.altKey || isTyping(event.target)) {
      return
    }

    const isUndo =
      event.key === 'Backspace' ||
      ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z')

    if (isUndo) {
      event.preventDefault()
      onUndo()

      return
    }

    if (event.ctrlKey || event.metaKey) {
      return
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      onPoint(event.key === 'ArrowLeft' ? order[0] : order[1])
    }
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => handleKey(event)

    document.addEventListener('keydown', listener)

    return () => document.removeEventListener('keydown', listener)
  }, [])
}
