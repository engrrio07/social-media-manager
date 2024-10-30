// src/lib/schemas/analytics.ts
import * as z from "zod"

// Base analytics metrics schema
export const analyticsMetricsSchema = z.object({
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0),
  impressions: z.number().default(0),
  clicks: z.number().default(0),
  engagement_rate: z.number().default(0),
})

export const postAnalyticsSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  ...analyticsMetricsSchema.shape,
  platform: z.enum(['facebook']),
  date: z.string(),
  created_at: z.string()
})

export const analyticsOverviewSchema = z.object({
  total_posts: z.number().default(0),
  total_engagement: z.number().default(0),
  total_reach: z.number().default(0),
  avg_engagement_rate: z.number().default(0),
  period_start: z.string(),
  period_end: z.string()
})

export type AnalyticsMetrics = z.infer<typeof analyticsMetricsSchema>
export type PostAnalytics = z.infer<typeof postAnalyticsSchema>
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>