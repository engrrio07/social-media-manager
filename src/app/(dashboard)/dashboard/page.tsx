// src/app/(dashboard)/dashboard/page.tsx
import { Metadata } from "next"
import { requireAuth } from "@/lib/supabase/auth"
import { DashboardMetrics } from "@/components/dashboard/metrics"
import { RecentPosts } from "@/components/dashboard/recent-posts"
import { UpcomingPosts } from "@/components/dashboard/upcoming-posts"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { EngagementOverview } from "@/components/dashboard/engagement-overview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ErrorBoundary } from "@/components/dashboard/error-boundary"

export const metadata: Metadata = {
  title: "Dashboard | Social Media Manager",
  description: "Overview of your social media performance",
}

export default async function DashboardPage() {
  await requireAuth()

  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your social media performance.
        </p>
      </div>

      <Separator />

      {/* Quick Stats */}
      <ErrorBoundary>
        <DashboardMetrics userId={user?.id} />
      </ErrorBoundary>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Posts */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>
              Your latest social media activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentPosts userId={user?.id} />
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Posts</CardTitle>
            <CardDescription>
              Your scheduled content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UpcomingPosts userId={user?.id} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Engagement Overview */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
            <CardDescription>
              Performance trends and metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EngagementOverview userId={user?.id} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}