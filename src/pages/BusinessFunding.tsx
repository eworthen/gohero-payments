import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../seo/routes'

export default function BusinessFunding() {
  return <PageIntro metadata={pageMetadata.businessFunding} eyebrow="Business funding" heading="Business Funding">Information about available business funding options will be added here after product details and disclosures are approved.</PageIntro>
}