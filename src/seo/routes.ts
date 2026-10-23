import type { SeoRoute } from './types'

// Placeholder image paths below must be replaced with approved assets before publishing.
export const publicRouteRegistry = [
  {
    id: 'home',
    path: '/',
    title: 'Merchant Payment Processing | GoHero Payments',
    description: 'Explore merchant accounts, credit card processing, and payment solutions from GoHero Payments. Contact our team about your business needs.',
    openGraphTitle: 'Merchant Payment Processing | GoHero Payments',
    openGraphDescription: 'Explore merchant accounts, credit card processing, and payment solutions from GoHero Payments. Contact our team about your business needs.',
    openGraphImage: '/images/social/home-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Merchant Payment Processing | GoHero Payments',
    twitterDescription: 'Explore merchant accounts, credit card processing, and payment solutions from GoHero Payments. Contact our team about your business needs.',
    twitterImage: '/images/social/home-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage'],
  },
  {
    id: 'paymentProcessing',
    path: '/payment-processing',
    title: 'Credit Card Processing & Merchant Accounts | GoHero Payments',
    description: 'Explore credit card processing, merchant accounts, and payment solutions for your business with GoHero Payments.',
    openGraphTitle: 'Credit Card Processing & Merchant Accounts | GoHero Payments',
    openGraphDescription: 'Explore credit card processing, merchant accounts, and payment solutions for your business with GoHero Payments.',
    openGraphImage: '/images/social/payment-processing-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Credit Card Processing & Merchant Accounts | GoHero Payments',
    twitterDescription: 'Explore credit card processing, merchant accounts, and payment solutions for your business with GoHero Payments.',
    twitterImage: '/images/social/payment-processing-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'Service', 'BreadcrumbList'],
    serviceName: 'Merchant payment processing',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Payment Processing', path: '/payment-processing' }],
  },
  {
    id: 'businessFunding',
    path: '/business-funding',
    title: 'Business Funding & Merchant Cash Advances | GoHero Payments',
    description: 'Explore business funding and merchant cash advance information from GoHero Payments. Product details are subject to review.',
    openGraphTitle: 'Business Funding & Merchant Cash Advances | GoHero Payments',
    openGraphDescription: 'Explore business funding and merchant cash advance information from GoHero Payments. Product details are subject to review.',
    openGraphImage: '/images/social/business-funding-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Business Funding & Merchant Cash Advances | GoHero Payments',
    twitterDescription: 'Explore business funding and merchant cash advance information from GoHero Payments. Product details are subject to review.',
    twitterImage: '/images/social/business-funding-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'Service', 'BreadcrumbList'],
    serviceName: 'Business funding',
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Business Funding', path: '/business-funding' }],
  },
  {
    id: 'about',
    path: '/about',
    title: 'About GoHero Payments | Merchant Services',
    description: 'Learn about GoHero Payments and the merchant payment processing services it offers. Additional company information is pending review.',
    openGraphTitle: 'About GoHero Payments | Merchant Services',
    openGraphDescription: 'Learn about GoHero Payments and the merchant payment processing services it offers. Additional company information is pending review.',
    openGraphImage: '/images/social/about-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'About GoHero Payments | Merchant Services',
    twitterDescription: 'Learn about GoHero Payments and the merchant payment processing services it offers. Additional company information is pending review.',
    twitterImage: '/images/social/about-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList'],
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }],
  },
  {
    id: 'contact',
    path: '/contact',
    title: 'Contact GoHero Payments | Merchant Services Inquiries',
    description: 'Contact GoHero Payments with questions about merchant payment processing or business funding inquiries for your business.',
    openGraphTitle: 'Contact GoHero Payments | Merchant Services Inquiries',
    openGraphDescription: 'Contact GoHero Payments with questions about merchant payment processing or business funding inquiries for your business.',
    openGraphImage: '/images/social/contact-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Contact GoHero Payments | Merchant Services Inquiries',
    twitterDescription: 'Contact GoHero Payments with questions about merchant payment processing or business funding inquiries for your business.',
    twitterImage: '/images/social/contact-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList'],
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }],
  },
  {
    id: 'privacyPolicy',
    path: '/privacy-policy',
    title: 'Privacy Policy | GoHero Payments',
    description: 'Review the GoHero Payments privacy policy. Information about website and inquiry data handling is pending business and legal review.',
    openGraphTitle: 'Privacy Policy | GoHero Payments',
    openGraphDescription: 'Review the GoHero Payments privacy policy. Information about website and inquiry data handling is pending business and legal review.',
    openGraphImage: '/images/social/privacy-policy-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Privacy Policy | GoHero Payments',
    twitterDescription: 'Review the GoHero Payments privacy policy. Information about website and inquiry data handling is pending business and legal review.',
    twitterImage: '/images/social/privacy-policy-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList'],
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy-policy' }],
  },
  {
    id: 'termsOfService',
    path: '/terms-of-service',
    title: 'Terms of Service | GoHero Payments',
    description: 'Review the GoHero Payments terms of service. Complete terms for website use and service inquiries are pending business and legal review.',
    openGraphTitle: 'Terms of Service | GoHero Payments',
    openGraphDescription: 'Review the GoHero Payments terms of service. Complete terms for website use and service inquiries are pending business and legal review.',
    openGraphImage: '/images/social/terms-of-service-og-placeholder.jpg',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Terms of Service | GoHero Payments',
    twitterDescription: 'Review the GoHero Payments terms of service. Complete terms for website use and service inquiries are pending business and legal review.',
    twitterImage: '/images/social/terms-of-service-twitter-placeholder.jpg',
    indexable: true,
    structuredData: ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList'],
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Terms of Service', path: '/terms-of-service' }],
  },
] satisfies SeoRoute[]

export const noIndexRoute: SeoRoute = {
  id: 'notFound',
  path: '/404',
  title: 'Page Not Found | GoHero Payments',
  description: 'The requested GoHero Payments page could not be found.',
  openGraphTitle: 'Page Not Found | GoHero Payments',
  openGraphDescription: 'The requested GoHero Payments page could not be found.',
  openGraphImage: '/images/social/404-og-placeholder.jpg',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Page Not Found | GoHero Payments',
  twitterDescription: 'The requested GoHero Payments page could not be found.',
  twitterImage: '/images/social/404-twitter-placeholder.jpg',
  indexable: false,
  structuredData: ['WebPage'],
}

export const pageMetadata = Object.fromEntries(
  [...publicRouteRegistry, noIndexRoute].map((route) => [route.id, route]),
) as {
  home: SeoRoute
  paymentProcessing: SeoRoute
  businessFunding: SeoRoute
  about: SeoRoute
  contact: SeoRoute
  privacyPolicy: SeoRoute
  termsOfService: SeoRoute
  notFound: SeoRoute
}

export function findPublicRoute(path: string): SeoRoute | undefined {
  return publicRouteRegistry.find((route) => route.path === path)
}
