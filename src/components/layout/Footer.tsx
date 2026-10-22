import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { footerNavigation } from '../../config/navigation'
import { siteConfig } from '../../config/site'
import Container from '../ui/Container'

const copyrightYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="wordmark footer-wordmark"><span className="wordmark-mark" aria-hidden="true">G</span><span>GoHero <strong>Payments</strong></span></Link>
            <p>Payment processing and business funding solutions.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            {footerNavigation.map((item) => <Link key={item.to} to={item.to}>{item.label}<ArrowUpRight size={13} aria-hidden="true" /></Link>)}
          </nav>
        </div>
        {siteConfig.disclosures.length > 0 && <div className="footer-disclosures">{siteConfig.disclosures.map((text) => <p key={text}>{text}</p>)}</div>}
        <div className="footer-bottom"><span>© {copyrightYear} GoHero Payments</span><span>Information on this site is subject to change.</span></div>
      </Container>
    </footer>
  )
}