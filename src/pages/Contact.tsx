import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../config/seo'

export default function Contact() {
  return <PageIntro metadata={pageMetadata.contact} eyebrow="Contact" heading="Talk with our team">Contact details and an inquiry form will be added here. No inquiry is submitted from this placeholder page.</PageIntro>
}