import { LogOut, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { adminNavigation } from '../config/navigation'
import type { AdminUser } from '../types'

interface AdminSidebarProps {
  user: AdminUser
  onSignOut: () => void
}

const localAuthEnabled = import.meta.env.DEV || import.meta.env.VITE_DEV_AUTH_ENABLED === 'true'

export default function AdminSidebar({ user, onSignOut }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/admin" aria-label="GoHero Payments administration">
        <span className="admin-brand-mark">G</span>
        <span>GOHERO <strong>OPERATIONS</strong></span>
      </a>
      <div className="admin-sidebar-label">WORKSPACE</div>
      <nav className="admin-nav" aria-label="Administration">
        {adminNavigation.filter((item) => !item.administratorOnly || user.role === 'administrator').map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/admin'} aria-label={label} title={label} className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <Icon size={17} aria-hidden="true" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-security-note"><ShieldCheck size={16} aria-hidden="true" /><span>Protected workspace</span></div>
        {localAuthEnabled ? (
          <button className="admin-user-chip" type="button" onClick={onSignOut} title="Clear local development identity">
            <span className="admin-avatar">{user.display_name.slice(0, 1).toUpperCase()}</span>
            <span className="admin-user-copy"><strong>{user.display_name}</strong><small>{user.role === 'administrator' ? 'Administrator' : 'Sales representative'}</small></span>
            <LogOut size={15} aria-hidden="true" />
          </button>
        ) : (
          <div className="admin-user-chip" aria-label={`Signed in as ${user.display_name}`}>
            <span className="admin-avatar">{user.display_name.slice(0, 1).toUpperCase()}</span>
            <span className="admin-user-copy"><strong>{user.display_name}</strong><small>{user.role === 'administrator' ? 'Administrator' : 'Sales representative'}</small></span>
          </div>
        )}
      </div>
    </aside>
  )
}