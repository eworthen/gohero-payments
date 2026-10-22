import { Link } from 'react-router-dom'
import PageIntro from '../components/layout/PageIntro'
import { pageMetadata } from '../config/seo'

export default function NotFound() {
  return <PageIntro metadata={pageMetadata.notFound} eyebrow="404" heading="Page not found">This page may have moved or is not available. <Link className="text-link" to="/">Return to the homepage</Link>.</PageIntro>
}