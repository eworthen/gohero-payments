import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { primaryNavigation } from '../../config/navigation'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  return (
    <div className="mobile-nav">
      <button type="button" className="menu-toggle" aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isOpen} aria-controls="mobile-navigation" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      {isOpen && (
        <nav id="mobile-navigation" className="mobile-menu" aria-label="Main navigation">
          {primaryNavigation.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className="mobile-nav-link" onClick={() => setIsOpen(false)}>{item.label}</NavLink>)}
          <NavLink to="/contact" className="button button-primary mobile-cta" onClick={() => setIsOpen(false)}>Get Started</NavLink>
        </nav>
      )}
    </div>
  )
}