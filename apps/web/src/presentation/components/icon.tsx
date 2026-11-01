import {
  Archive,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Copy,
  ExternalLink,
  Flag,
  GripVertical,
  House,
  ImagePlus,
  Keyboard,
  LayoutGrid,
  type LucideIcon,
  Minus,
  Monitor,
  Move,
  Pause,
  Pencil,
  Play,
  Plus,
  Printer,
  QrCode,
  Radio,
  RectangleVertical,
  RefreshCw,
  RotateCw,
  Save,
  Search,
  Settings,
  Shield,
  Shuffle,
  Smartphone,
  Star,
  Timer,
  Trash2,
  Undo2,
  Unplug,
  Users,
  WifiOff,
  X
} from 'lucide-react'
import type React from 'react'

import './icon.sass'

const OUTLINED = {
  alert: CircleAlert,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  away: Car,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  close: X,
  club: Shield,
  copy: Copy,
  display: Monitor,
  edit: Pencil,
  flag: Flag,
  grip: GripVertical,
  home: House,
  image: ImagePlus,
  keyboard: Keyboard,
  live: Radio,
  minus: Minus,
  move: Move,
  open: ExternalLink,
  pause: Pause,
  phone: Smartphone,
  plans: LayoutGrid,
  plus: Plus,
  print: Printer,
  qr: QrCode,
  reserve: Archive,
  rotate: RotateCw,
  save: Save,
  search: Search,
  settings: Settings,
  shuffle: Shuffle,
  starOutline: Star,
  swap: ArrowLeftRight,
  sync: RefreshCw,
  teams: Users,
  timer: Timer,
  trash: Trash2,
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
