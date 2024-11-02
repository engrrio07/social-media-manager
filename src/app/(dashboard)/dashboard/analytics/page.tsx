// src/app/(dashboard)/dashboard/analytics/page.tsx
import { Metadata } from "next"
import { AnalyticsOverview } from "@/components/analytics/overview"
import { PostPerformance } from "@/components/analytics/post-performance"
import { EngagementMetrics } from "@/components/analytics/engagement-metrics"
import { Separator } from "@/components/ui/separator"
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const metadata: Metadata = {
  title: "Analytics | Social Media Manager",
  description: "View your social media performance metrics",
}

export default async function AnalyticsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Check auth
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }

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
      <EngagementMetrics userId={user.id} />
    </div>
  )
}