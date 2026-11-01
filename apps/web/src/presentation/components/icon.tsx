import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  ExternalLink,
  Flag,
  ImagePlus,
  Keyboard,
  type LucideIcon,
  Minus,
  Monitor,
  Move,
  Play,
  Plus,
  Pencil,
  Printer,
  QrCode,
  RectangleVertical,
  RefreshCw,
  Search,
  Shield,
  Shuffle,
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
  club: Shield,
  copy: Copy,
  display: Monitor,
  flag: Flag,
  image: ImagePlus,
  keyboard: Keyboard,
  edit: Pencil,
  minus: Minus,
  move: Move,
  open: ExternalLink,
  phone: Smartphone,
  plus: Plus,
  print: Printer,
  qr: QrCode,
  search: Search,
  shuffle: Shuffle,
  starOutline: Star,
  sync: RefreshCw,
  timer: Timer,
  undo: Undo2,
  unpair: Unplug,
  swap: ArrowLeftRight,
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
