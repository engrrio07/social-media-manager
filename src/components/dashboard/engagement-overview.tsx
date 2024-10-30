// src/components/dashboard/engagement-overview.tsx
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

// Define schema for engagement data
const engagementSchema = z.object({
  date: z.string(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
})

type EngagementData = z.infer<typeof engagementSchema>

interface EngagementOverviewProps {
  userId?: string
}

export function EngagementOverview({ userId }: EngagementOverviewProps) {
  const [data, setData] = useState<EngagementData[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchEngagementData()
  }, [userId])

  async function fetchEngagementData() {
    if (!userId) return

    try {
      // Get last 7 days of engagement data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 7)

      const { data: engagementData, error } = await supabase
        .from('post_analytics')
        .select(`
          date,
          likes,
          comments,
          shares
        `)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true })

      if (error) throw error

      const validatedData = z.array(engagementSchema).parse(engagementData)
      setData(validatedData)
    } catch (error) {
      console.error('Error fetching engagement data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch engagement data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Likes',
        data: data.map(item => item.likes),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Comments',
        data: data.map(item => item.comments),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Shares',
        data: data.map(item => item.shares),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
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

  // Calculate totals for the period
  const totals = data.reduce((acc, item) => ({
    likes: acc.likes + item.likes,
    comments: acc.comments + item.comments,
    shares: acc.shares + item.shares,
  }), { likes: 0, comments: 0, shares: 0 })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(totals.likes)}</div>
            <p className="text-xs text-muted-foreground">Total Likes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(totals.comments)}</div>
            <p className="text-xs text-muted-foreground">Total Comments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatNumber(totals.shares)}</div>
            <p className="text-xs text-muted-foreground">Total Shares</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading engagement data...</p>
        </div>
      ) : (
        <div className="h-[300px]">
          <Line options={options as any} data={chartData} />
        </div>
      )}
    </div>
  )
}