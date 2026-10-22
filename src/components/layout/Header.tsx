import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Container from '../ui/Container'
import DesktopNav from '../navigation/DesktopNav'
import MobileNav from '../navigation/MobileNav'

export default function Header() {
  return (
    <header className="site-header">
      <Container className="header-inner">
        <Link to="/" className="wordmark" aria-label="GoHero Payments home">
          <span className="wordmark-mark" aria-hidden="true">G</span>
          <span>GoHero <strong>Payments</strong></span>
        </Link>
        <DesktopNav />
        <Link to="/contact" className="button button-primary header-cta">Get Started <ArrowUpRight size={16} aria-hidden="true" /></Link>
        <MobileNav />
      </Container>
    </header>
  )
}