import { NavLink } from 'react-router-dom'
import { primaryNavigation } from '../../config/navigation'

export default function DesktopNav() {
  return (
    <nav className="desktop-nav" aria-label="Main navigation">
      {primaryNavigation.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}