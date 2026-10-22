import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../config/seo'

export default function About() {
  return <PageIntro metadata={pageMetadata.about} eyebrow="About" heading="About GoHero Payments">Company information will be added here after it has been reviewed and approved.</PageIntro>
}