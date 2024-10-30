// src/types/analytics.ts
import * as z from "zod"

// Schema for post analytics
export const postAnalyticsSchema = z.object({
  id: z.string(),
  post_id: z.string(),
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0),
  views: z.number().default(0),
  reach: z.number().default(0),
  engagement_rate: z.number().default(0),
  date: z.string(),
  created_at: z.string()
})

// Schema for post with analytics
export const postWithAnalyticsSchema = z.object({
  id: z.string(),
  content: z.string(),
  media_urls: z.array(z.string()).nullable().default([]),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']),
  scheduled_for: z.string().nullable(),
  platform: z.string(),
  created_at: z.string(),
  user_id: z.string(),
  analytics: z.array(postAnalyticsSchema).optional()
})

// Type inference
export type PostAnalytics = z.infer<typeof postAnalyticsSchema>
export type PostWithAnalytics = z.infer<typeof postWithAnalyticsSchema>