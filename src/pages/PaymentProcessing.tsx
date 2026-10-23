import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../seo/routes'

export default function PaymentProcessing() {
  return <PageIntro metadata={pageMetadata.paymentProcessing} eyebrow="Merchant services" heading="Payment Processing">Information about merchant payment processing services will be added here after it is approved.</PageIntro>
}