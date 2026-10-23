import { organizationName, siteOrigin } from '../seo/config'

export const siteConfig = {
  name: organizationName,
  description: 'Merchant payment processing and business funding solutions for businesses.',
  siteUrl: siteOrigin,
  organization: {
    name: organizationName,
    legalName: undefined as string | undefined,
  },
  disclosures: [] as string[],
}