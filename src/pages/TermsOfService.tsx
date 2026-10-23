import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../seo/routes'

export default function TermsOfService() {
  return <PageIntro metadata={pageMetadata.termsOfService} eyebrow="Legal" heading="Terms of Service">Terms of service will be published here after legal review. This placeholder is not a contract or offer.</PageIntro>
}