import { z } from 'zod'

export const inquirySchema = z.object({
  inquiryType: z.enum(['general', 'payment-processing', 'business-funding']),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  businessName: z.string().trim().min(1).max(160),
  email: z.email(),
  phone: z.string().trim().max(40).optional(),
}).strict()

export type Inquiry = z.infer<typeof inquirySchema>