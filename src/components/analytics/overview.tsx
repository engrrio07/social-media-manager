// src/components/analytics/overview.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatNumber } from "@/lib/utils"
import * as z from "zod"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Analytics schema
const analyticsSchema = z.object({
  date: z.string(),
  total_posts: z.number(),
  total_engagement: z.number(),
  total_reach: z.number(),
  engagement_rate: z.number()
})

type Analytics = z.infer<typeof analyticsSchema>

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export function AnalyticsOverview() {
  const [timeRange, setTimeRange] = useState('30d')
  const [analytics, setAnalytics] = useState<Analytics[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(timeRange))

      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          date,
          total_posts:posts(count),
          total_engagement:sum(likes + comments + shares),
          total_reach:sum(reach),
          engagement_rate:avg(engagement_rate)
        `)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true })

      if (error) throw error

      // Validate data with zod
      const validatedData = z.array(analyticsSchema).parse(data)
      setAnalytics(validatedData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: analytics.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Engagement',
        data: analytics.map(item => item.total_engagement),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Reach',
        data: analytics.map(item => item.total_reach),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatNumber(value),
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Performance Overview</h3>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatNumber(analytics.reduce((sum, item) => sum + item.total_posts, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatNumber(analytics.reduce((sum, item) => sum + item.total_engagement, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total Engagement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {formatNumber(analytics.reduce((sum, item) => sum + item.total_reach, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total Reach</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(analytics.reduce((sum, item) => sum + item.engagement_rate, 0) / analytics.length || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Avg. Engagement Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              Loading...
            </div>
          ) : (
            <div className="h-[400px]">
              <Line options={options as any} data={chartData} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}