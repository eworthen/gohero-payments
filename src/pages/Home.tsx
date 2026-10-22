import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../config/seo'

export default function Home() {
  return <PageIntro metadata={pageMetadata.home} eyebrow="GoHero Payments" heading="Financial tools for your business.">We provide merchant payment processing and business funding solutions. More information about our services will be added here.</PageIntro>
}