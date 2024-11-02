// src/components/analytics/post-performance.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { Heart, MessageSquare, Share2, BarChart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import * as z from "zod"

// Define schemas for type safety
const postAnalyticsSchema = z.object({
  id: z.string(),
  content: z.string(),
  media_urls: z.array(z.string()).optional(),
  created_at: z.string(),
  analytics: z.object({
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    engagement_rate: z.number()
  })
})

type PostAnalytics = z.infer<typeof postAnalyticsSchema>

export function PostPerformance() {
  const [posts, setPosts] = useState<PostAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTopPosts()
  }, [])

  async function fetchTopPosts() {
    try {
      setLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw new Error('Authentication error')
      if (!user) throw new Error('User not found')

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          created_at,
          analytics:post_analytics(
            likes,
            comments,
            shares,
            engagement_rate
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      // Handle empty data case
      if (!data || data.length === 0) {
        setPosts([])
        return
      }

      // Transform data to match schema
      const transformedData = data.map(post => ({
        ...post,
        analytics: post.analytics?.[0] || {
          likes: 0,
          comments: 0,
          shares: 0,
          engagement_rate: 0
        }
      }))

      // Validate and transform data
      const validatedPosts = z.array(postAnalyticsSchema).parse(transformedData)
      setPosts(validatedPosts)
    } catch (error) {
      console.error('Error fetching post analytics:', error)
      toast({
        title: "Error fetching posts",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
      setPosts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Top Performing Posts</h3>
      
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {post.media_urls?.[0] && (
                <div className="flex-shrink-0">
                  <img
                    src={post.media_urls[0]}
                    alt="Post media"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(post.created_at), "PPP")}
                </p>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-medium">
                      {formatNumber(post.analytics.likes)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      {formatNumber(post.analytics.comments)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      {formatNumber(post.analytics.shares)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <BarChart className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {post.analytics.engagement_rate.toFixed(1)}% Engagement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {posts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No post analytics available
          </CardContent>
        </Card>
      )}
    </div>
  )
}