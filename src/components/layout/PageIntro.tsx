import type { ReactNode } from 'react'
import SeoHead from '../../seo/SeoHead'
import type { SeoRoute } from '../../seo/types'
import Container from '../ui/Container'
import Section from '../ui/Section'

interface PageIntroProps {
  metadata: SeoRoute
  eyebrow: string
  heading: string
  children: ReactNode
}

export default function PageIntro({ metadata, eyebrow, heading, children }: PageIntroProps) {
  return <><SeoHead route={metadata} /><Section className="intro-section"><Container><div className="intro-copy"><p className="eyebrow">{eyebrow}</p><h1>{heading}</h1><p className="intro-description">{children}</p><div className="intro-rule" aria-hidden="true"><span /></div></div></Container></Section></>
}