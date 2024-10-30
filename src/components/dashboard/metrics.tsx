// src/components/dashboard/metrics.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { BarChart, Users, Clock, TrendingUp } from "lucide-react"

interface DashboardMetricsProps {
  userId?: string
}

interface Metrics {
  totalPosts: number
  totalEngagement: number
  scheduledPosts: number
  engagementRate: number
}

// Add a loading skeleton component
function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardMetrics({ userId }: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    totalPosts: 0,
    totalEngagement: 0,
    scheduledPosts: 0,
    engagementRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchMetrics() {
      if (!userId) return

      try {
        // Fetch total posts
        const { count: totalPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)

        // Fetch scheduled posts
        const { count: scheduledPosts } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'scheduled')

        // Fetch engagement metrics
        const { data: analytics } = await supabase
          .from('post_analytics')
          .select('likes, comments, shares')
          .eq('user_id', userId)

        // Calculate total engagement and rate
        const totalEngagement = analytics?.reduce(
          (sum, post) => sum + post.likes + post.comments + post.shares,
          0
        ) || 0

        const engagementRate = totalPosts
          ? (totalEngagement / totalPosts) * 100
          : 0

        setMetrics({
          totalPosts: totalPosts || 0,
          totalEngagement,
          scheduledPosts: scheduledPosts || 0,
          engagementRate,
        })
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [userId, supabase])

  const metrics_data = [
    {
      title: "Total Posts",
      value: formatNumber(metrics.totalPosts),
      icon: BarChart,
    },
    {
      title: "Total Engagement",
      value: formatNumber(metrics.totalEngagement),
      icon: Users,
    },
    {
      title: "Scheduled Posts",
      value: formatNumber(metrics.scheduledPosts),
      icon: Clock,
    },
    {
      title: "Engagement Rate",
      value: `${metrics.engagementRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ]

  if (loading) {
    return <MetricsSkeleton />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics_data.map((metric) => (
        <Card key={metric.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
              <metric.icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}