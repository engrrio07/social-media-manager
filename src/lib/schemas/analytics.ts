// src/lib/schemas/analytics.ts
import * as z from "zod"

export const postAnalyticsSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  likes: z.number(),
  shares: z.number(),
  comments: z.number(),
  views: z.number(),
  reach: z.number(),
  engagement_rate: z.number(),
  platform: z.enum(['facebook']),
  date: z.string(),
  created_at: z.string()
})

export const analyticsOverviewSchema = z.object({
  total_posts: z.number(),
  total_engagement: z.number(),
  total_reach: z.number(),
  avg_engagement_rate: z.number(),
  period_start: z.string(),
  period_end: z.string()
})

export type PostAnalytics = z.infer<typeof postAnalyticsSchema>
export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>