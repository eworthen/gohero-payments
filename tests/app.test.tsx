import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../src/App'
import { pageMetadata } from '../src/config/seo'
import { siteConfig } from '../src/config/site'
import { inquirySchema } from '../src/lib/validation'

afterEach(cleanup)

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)
}

describe('application routes', () => {
  it('renders the shared layout and homepage', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Financial tools for your business.' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('provides service navigation links', async () => {
    renderAt('/')
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(await within(navigation).findByRole('link', { name: 'Payment Processing' })).toHaveAttribute('href', '/payment-processing')
    expect(within(navigation).getByRole('link', { name: 'Business Funding' })).toHaveAttribute('href', '/business-funding')
  })

  it('renders a not-found page for unknown routes', async () => {
    renderAt('/missing-page')
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('opens and closes the mobile menu with Escape', async () => {
    renderAt('/')
    const toggle = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps page metadata unique and site identity configurable', () => {
    const paths = Object.values(pageMetadata).map(({ path }) => path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(siteConfig.name).toBe('GoHero Payments')
  })

  it('limits inquiry validation to basic business contact fields', () => {
    const result = inquirySchema.safeParse({
      inquiryType: 'payment-processing',
      firstName: 'Avery',
      lastName: 'Taylor',
      businessName: 'Example Business',
      email: 'avery@example.test',
      accountNumber: 'not-collected',
    })
    expect(result.success).toBe(false)
  })
})