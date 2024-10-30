// src/components/analytics/metric-card.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from "@/components/ui/card"
import { TrendingDown, TrendingUp } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface MetricCardProps {
  title: string
  metric: "posts" | "engagement" | "reach" | "engagement_rate"
  description: string
}

export function MetricCard({ title, metric, description }: MetricCardProps) {
  const [value, setValue] = useState<number>(0)
  const [trend, setTrend] = useState<{ value: number; type: 'positive' | 'negative' }>({
    value: 0,
    type: 'positive'
  })
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchMetric() {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch current period data
      const { data: currentData } = await supabase
        .from('post_analytics')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: false })

      // Calculate metric value
      let metricValue = 0
      if (currentData) {
        switch (metric) {
          case 'posts':
            metricValue = currentData.length
            break
          case 'engagement':
            metricValue = currentData.reduce((sum, post) => 
              sum + post.likes + post.comments + post.shares, 0)
            break
          case 'reach':
            metricValue = currentData.reduce((sum, post) => 
              sum + post.reach, 0) / (currentData.length || 1)
            break
          case 'engagement_rate':
            const totalEngagement = currentData.reduce((sum, post) => 
              sum + post.likes + post.comments + post.shares, 0)
            const totalReach = currentData.reduce((sum, post) => 
              sum + post.reach, 0)
            metricValue = (totalEngagement / (totalReach || 1)) * 100
            break
        }
      }

      setValue(metricValue)
      
      // Calculate trend
      // ... similar calculation for previous period
      // This is a placeholder trend calculation
      setTrend({
        value: Math.random() * 10,
        type: Math.random() > 0.5 ? 'positive' : 'negative'
      })
    }

    fetchMetric()
  }, [supabase, metric])

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`flex items-center text-sm ${
            trend.type === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.type === 'positive' ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {trend.value.toFixed(1)}%
          </div>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">
            {metric === 'engagement_rate' 
              ? `${value.toFixed(1)}%`
              : formatNumber(value)
            }
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}