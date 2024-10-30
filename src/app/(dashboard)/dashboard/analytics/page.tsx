// src/app/(dashboard)/dashboard/analytics/page.tsx
import { Metadata } from "next"
import { AnalyticsOverview } from "@/components/analytics/overview"
import { PostPerformance } from "@/components/analytics/post-performance"
import { EngagementMetrics } from "@/components/analytics/engagement-metrics"
import { Separator } from "@/components/ui/separator"
import { requireAuth } from "@/lib/supabase/auth"

export const metadata: Metadata = {
  title: "Analytics | Social Media Manager",
  description: "View your social media performance metrics",
}

export default async function AnalyticsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your social media performance and engagement
        </p>
      </div>

      <Separator />

      <AnalyticsOverview />
      <PostPerformance />
      <EngagementMetrics />
    </div>
  )
}