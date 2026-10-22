import {
  Activity,
  BarChart3,
  CheckSquare2,
  Columns3,
  LayoutDashboard,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export const adminNavigation: Array<{ label: string; to: string; icon: LucideIcon; administratorOnly?: boolean }> = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Leads', to: '/admin/leads', icon: UsersRound },
  { label: 'Pipeline', to: '/admin/pipeline', icon: Columns3 },
  { label: 'Follow-ups', to: '/admin/follow-ups', icon: CheckSquare2 },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, administratorOnly: true },
  { label: 'Users', to: '/admin/users', icon: UsersRound, administratorOnly: true },
  { label: 'Audit log', to: '/admin/audit', icon: Activity, administratorOnly: true },
]