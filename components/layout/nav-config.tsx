import {
  Home,
  Gamepad2,
  Trophy,
  Calendar,
  TrendingUp,
  Users,
  Ticket,
  Store,
  User as UserIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  // Items shown in the mobile bottom-bar (max 5). Others live in the
  // hamburger sheet on mobile, sidebar on desktop.
  inBottomBar?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  // First item is "Home" (renamed from "Dashboard"). Mobile bottom bar shows
  // exactly 4 items per MistCash style: Home, Offers, Cashout, Profile.
  { href: "/", label: "Home", icon: Home, inBottomBar: true },
  { href: "/offers", label: "Offers", icon: Gamepad2, inBottomBar: true },
  { href: "/daily", label: "Daily Reward", icon: Calendar },
  { href: "/levels", label: "Levels", icon: TrendingUp },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/promo", label: "Promo Codes", icon: Ticket },
  { href: "/store", label: "Cashout", icon: Store, inBottomBar: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserIcon, inBottomBar: true },
]
