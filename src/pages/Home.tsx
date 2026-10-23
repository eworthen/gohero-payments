import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../seo/routes'

export default function Home() {
  return <PageIntro metadata={pageMetadata.home} eyebrow="GoHero Payments" heading="Financial tools for your business.">We provide merchant payment processing and business funding solutions. More information about our services will be added here.</PageIntro>
}