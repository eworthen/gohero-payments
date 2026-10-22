import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../config/seo'

export default function PrivacyPolicy() {
  return <PageIntro metadata={pageMetadata.privacyPolicy} eyebrow="Legal" heading="Privacy Policy">The privacy policy will be published here after legal review. This placeholder is not a statement of current practices.</PageIntro>
}