// src/components/dashboard/upcoming-posts.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { Calendar, Clock, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import * as z from "zod"

// Define schema for scheduled post
const scheduledPostSchema = z.object({
  id: z.string(),
  content: z.string(),
  scheduled_for: z.string(),
  media_urls: z.array(z.string()).optional(),
  platform: z.enum(['facebook']),
  created_at: z.string()
})

type ScheduledPost = z.infer<typeof scheduledPostSchema>

interface UpcomingPostsProps {
  userId?: string
}

export function UpcomingPosts({ userId }: UpcomingPostsProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUpcomingPosts()
  }, [userId])

  async function fetchUpcomingPosts() {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5)

      if (error) throw error

      const validatedPosts = z.array(scheduledPostSchema).parse(data)
      setPosts(validatedPosts)
    } catch (error) {
      console.error('Error fetching upcoming posts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch upcoming posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function cancelScheduledPost(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'draft',
          scheduled_for: null 
        })
        .eq('id', postId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Post schedule cancelled",
      })

      fetchUpcomingPosts()
    } catch (error) {
      console.error('Error cancelling post schedule:', error)
      toast({
        title: "Error",
        description: "Failed to cancel post schedule",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 rounded-lg border p-4"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 animate-pulse bg-muted rounded" />
              <div className="h-4 w-1/2 animate-pulse bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No upcoming posts scheduled
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-start space-x-4 rounded-lg border p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm line-clamp-1">{post.content}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  {format(new Date(post.scheduled_for), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                  <DropdownMenuItem>Edit Post</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => cancelScheduledPost(post.id)}
                  >
                    Cancel Schedule
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {post.media_urls?.[0] && (
              <div className="mt-2">
                <img
                  src={post.media_urls[0]}
                  alt="Post media"
                  className="h-20 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}