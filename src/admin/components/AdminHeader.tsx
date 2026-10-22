import { Bell, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { adminNavigation } from '../config/navigation'

export default function AdminHeader() {
  const location = useLocation()
  const title = adminNavigation.find((item) => item.to === location.pathname)?.label ?? (location.pathname.includes('/leads/') ? 'Lead details' : 'Administration')
  return (
    <header className="admin-header">
      <div><span className="admin-header-kicker">GOHERO PAYMENTS</span><h1>{title}</h1></div>
      <div className="admin-header-actions">
        <span className="admin-env-tag">ADMIN PORTAL</span>
        <button className="admin-icon-button" type="button" aria-label="Search leads" onClick={() => { window.location.href = '/admin/leads' }}><Search size={18} /></button>
        <span className="admin-header-divider" />
        <Bell size={18} aria-hidden="true" className="admin-bell" />
      </div>
    </header>
  )
}