import * as z from "zod"

export const dashboardStatsSchema = z.object({
  totalPosts: z.number().default(0),
  scheduledPosts: z.number().default(0),
  totalEngagement: z.number().default(0),
  successRate: z.number().default(0)
})

export type DashboardStats = z.infer<typeof dashboardStatsSchema> 