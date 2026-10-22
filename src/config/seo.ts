export interface PageMetadata {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

export const pageMetadata = {
  home: {
    title: 'GoHero Payments | Payment Processing & Business Funding',
    description: 'Explore merchant payment processing and business funding solutions from GoHero Payments.',
    path: '/',
  },
  paymentProcessing: {
    title: 'Payment Processing | GoHero Payments',
    description: 'Learn about merchant payment processing services from GoHero Payments.',
    path: '/payment-processing',
  },
  businessFunding: {
    title: 'Business Funding | GoHero Payments',
    description: 'Explore business funding options offered through GoHero Payments.',
    path: '/business-funding',
  },
  about: {
    title: 'About | GoHero Payments',
    description: 'Learn more about GoHero Payments and the services we provide.',
    path: '/about',
  },
  contact: {
    title: 'Contact | GoHero Payments',
    description: 'Contact GoHero Payments with questions about our services.',
    path: '/contact',
  },
  privacyPolicy: {
    title: 'Privacy Policy | GoHero Payments',
    description: 'Read the GoHero Payments privacy policy.',
    path: '/privacy-policy',
  },
  termsOfService: {
    title: 'Terms of Service | GoHero Payments',
    description: 'Read the GoHero Payments terms of service.',
    path: '/terms-of-service',
  },
  notFound: {
    title: 'Page Not Found | GoHero Payments',
    description: 'The requested GoHero Payments page could not be found.',
    path: '/404',
    noIndex: true,
  },
} satisfies Record<string, PageMetadata>