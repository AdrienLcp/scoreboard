import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  Flag,
  type LucideIcon,
  Minus,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Search,
  Star,
  Undo2,
  WifiOff,
  X
} from 'lucide-react'
import type React from 'react'

import './icon.sass'

const OUTLINED = {
  alert: CircleAlert,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronDown,
  close: X,
  copy: Copy,
  display: Monitor,
  flag: Flag,
  minus: Minus,
  open: ExternalLink,
  plus: Plus,
  search: Search,
  starOutline: Star,
  swap: ArrowRightLeft,
  sync: RefreshCw,
  undo: Undo2,
  wifiOff: WifiOff
} satisfies Record<string, LucideIcon>

/** The serve mark and the star are filled: they read as a state, not an action. */
const FILLED = {
  serve: Play,
  star: Star
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof OUTLINED | keyof typeof FILLED

const isFilled = (name: IconName): name is keyof typeof FILLED => name in FILLED

type IconProps = {
  className?: string
  name: IconName
}

/** A decorative icon: the control or text beside it carries the meaning. */
export const Icon: React.FC<IconProps> = ({ className, name }) => {
  const Glyph = isFilled(name) ? FILLED[name] : OUTLINED[name]

  return (
    <Glyph
      aria-hidden='true'
      className={className === undefined ? 'icon' : `icon ${className}`}
      data-filled={isFilled(name) || undefined}
      focusable='false'
    />
  )
}
