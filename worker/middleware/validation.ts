import { z } from 'zod'
import { LEAD_STATUSES, LEAD_TYPES } from '../../src/lib/lead-config'

export const idSchema = z.string().uuid()

export const leadStatusSchema = z.enum(LEAD_STATUSES)

export const leadTypeSchema = z.enum(LEAD_TYPES)

export const leadCreateSchema = z.object({
  lead_type: leadTypeSchema,
  business_name: z.string().trim().min(1).max(160),
  contact_name: z.string().trim().min(1).max(160),
  email: z.email().max(254),
  phone: z.string().trim().max(40).nullable().optional(),
  website: z.url().max(200).nullable().optional(),
  business_state: z.string().trim().max(80).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  source: z.string().trim().max(100).nullable().optional(),
  assigned_user_id: idSchema.nullable().optional(),
  details: z.object({
    estimated_monthly_processing_volume_cents: z.number().int().min(0).max(10_000_000_000).nullable().optional(),
    current_processor: z.string().trim().max(120).nullable().optional(),
    years_in_business: z.number().min(0).max(200).nullable().optional(),
    estimated_monthly_revenue_cents: z.number().int().min(0).max(10_000_000_000).nullable().optional(),
    funding_amount_requested_cents: z.number().int().min(0).max(10_000_000_000).nullable().optional(),
    additional_information: z.string().trim().max(4000).nullable().optional(),
  }).strict().optional(),
}).strict()

export const leadPatchSchema = z.object({
  business_name: z.string().trim().min(1).max(160).optional(),
  contact_name: z.string().trim().min(1).max(160).optional(),
  email: z.email().max(254).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  website: z.url().max(200).nullable().optional(),
  business_state: z.string().trim().max(80).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  source: z.string().trim().max(100).nullable().optional(),
  status: leadStatusSchema.optional(),
  assigned_user_id: idSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0)

export const noteSchema = z.object({ note: z.string().trim().min(1).max(4000) }).strict()

export const followUpCreateSchema = z.object({
  lead_id: idSchema,
  assigned_user_id: idSchema.optional(),
  title: z.string().trim().min(1).max(180),
  due_at: z.iso.datetime({ offset: true }),
}).strict()

export const followUpPatchSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
}).strict()

export const userPatchSchema = z.object({
  role: z.enum(['administrator', 'sales_representative']).optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0)

export async function readJson<T extends z.ZodType>(request: Request, schema: T) {
  const maximumBytes = 16_384
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (contentLength > maximumBytes) return schema.safeParse(null)
  try {
    const reader = request.body?.getReader()
    if (!reader) return schema.safeParse(null)
    const chunks: Uint8Array[] = []
    let totalBytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maximumBytes) {
        await reader.cancel()
        return schema.safeParse(null)
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const bodyText = new TextDecoder().decode(bytes)
    const body: unknown = JSON.parse(bodyText)
    return schema.safeParse(body)
  } catch {
    return schema.safeParse(null)
  }
}