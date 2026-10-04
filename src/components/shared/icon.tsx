import {
  LayoutDashboard,
  Target,
  Building2,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Repeat,
  CalendarClock,
  FolderOpen,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  Menu,
  Plus,
  Search,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  CircleHelp,
  type LucideProps,
} from "lucide-react"

const ICONS = {
  LayoutDashboard,
  Target,
  Building2,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Repeat,
  CalendarClock,
  FolderOpen,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  Menu,
  Plus,
  Search,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = ICONS[name as IconName] ?? CircleHelp
  return <Cmp {...props} />
}
