// src/components/analytics/engagement-metrics.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatNumber } from "@/lib/utils"
import * as z from "zod"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Define schema for engagement data
const engagementSchema = z.object({
  date: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  engagement_rate: z.number()
})

type EngagementData = z.infer<typeof engagementSchema>

interface EngagementMetricsProps {
  userId?: string
}

export function EngagementMetrics({ userId }: EngagementMetricsProps) {
  const [engagementData, setEngagementData] = useState<EngagementData[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (userId) {
      fetchEngagementData()
    }
  }, [userId])

  async function fetchEngagementData() {
    if (!userId) return

    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - parseInt(timeRange))
      
      const { data, error } = await supabase
        .from('post_analytics')
        .select(`
          date,
          likes,
          comments,
          shares,
          engagement_rate
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true })

      if (error) throw error

      // Handle empty data case
      if (!data || data.length === 0) {
        setEngagementData([])
        return
      }

      // Validate data
      const validatedData = z.array(engagementSchema).parse(data)
      setEngagementData(validatedData)
    } catch (error) {
      console.error('Error fetching engagement data:', error)
      toast({
        title: "Error fetching engagement data",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      setEngagementData([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: engagementData.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Likes',
        data: engagementData.map(item => item.likes),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
      {
        label: 'Comments',
        data: engagementData.map(item => item.comments),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
      {
        label: 'Shares',
        data: engagementData.map(item => item.shares),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
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
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatNumber(context.raw)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => formatNumber(value)
        }
      }
    }
  }

  // Calculate totals
  const totals = engagementData.reduce((acc, item) => ({
    likes: acc.likes + item.likes,
    comments: acc.comments + item.comments,
    shares: acc.shares + item.shares,
    engagement_rate: acc.engagement_rate + item.engagement_rate
  }), { likes: 0, comments: 0, shares: 0, engagement_rate: 0 })

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Engagement Breakdown</h3>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatNumber(totals.likes)}</div>
            <p className="text-xs text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatNumber(totals.comments)}</div>
            <p className="text-xs text-muted-foreground">Total Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatNumber(totals.shares)}</div>
            <p className="text-xs text-muted-foreground">Total Shares</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {(totals.engagement_rate / engagementData.length || 0).toFixed(2)}%
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
              <Bar options={options as any} data={chartData} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}