import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  Flag,
  Keyboard,
  type LucideIcon,
  Minus,
  Monitor,
  Play,
  Plus,
  Printer,
  RectangleVertical,
  RefreshCw,
  Search,
  Smartphone,
  Star,
  Timer,
  Undo2,
  Unplug,
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
  keyboard: Keyboard,
  minus: Minus,
  open: ExternalLink,
  phone: Smartphone,
  plus: Plus,
  print: Printer,
  search: Search,
  starOutline: Star,
  sync: RefreshCw,
  timer: Timer,
  undo: Undo2,
  unpair: Unplug,
  wifiOff: WifiOff
} satisfies Record<string, LucideIcon>

/** The serve mark, the card and the star are filled: they read as a state, not an action. */
const FILLED = {
  card: RectangleVertical,
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
