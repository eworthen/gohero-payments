import type { ReactNode } from 'react'
import type { PageMetadata } from '../../config/seo'
import Seo from '../seo/Seo'
import Container from '../ui/Container'
import Section from '../ui/Section'

interface PageIntroProps {
  metadata: PageMetadata
  eyebrow: string
  heading: string
  children: ReactNode
}

export default function PageIntro({ metadata, eyebrow, heading, children }: PageIntroProps) {
  return <><Seo {...metadata} /><Section className="intro-section"><Container><div className="intro-copy"><p className="eyebrow">{eyebrow}</p><h1>{heading}</h1><p className="intro-description">{children}</p><div className="intro-rule" aria-hidden="true"><span /></div></div></Container></Section></>
}