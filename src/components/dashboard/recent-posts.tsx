// src/components/dashboard/recent-posts.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { Heart, MessageSquare, Share2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import * as z from "zod"

// Define schema for post data
const postAnalyticsSchema = z.object({
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0)
})

const postSchema = z.object({
  id: z.string(),
  content: z.string(),
  media_urls: z.union([z.array(z.string()), z.null()]).optional(),
  status: z.enum(['draft', 'scheduled', 'published']),
  created_at: z.string(),
  post_analytics: z.array(postAnalyticsSchema).optional().transform(analytics => 
    analytics?.[0] ?? { likes: 0, comments: 0, shares: 0 }
  )
})

type Post = z.infer<typeof postSchema>

interface RecentPostsProps {
  userId?: string
}

export function RecentPosts({ userId }: RecentPostsProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchRecentPosts()
  }, [userId])

  async function fetchRecentPosts() {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          status,
          created_at,
          post_analytics (
            likes,
            comments,
            shares
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      // Log the raw data to help debug
      console.log('Raw data from Supabase:', data)

      const validatedPosts = z.array(postSchema).parse(data)
      setPosts(validatedPosts)
    } catch (error) {
      console.error('Error fetching recent posts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch recent posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
          <p className="text-sm text-muted-foreground">No posts yet</p>
          <Button variant="link" className="mt-2">
            Create your first post
          </Button>
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
          {post.media_urls?.[0] && (
            <div className="flex-shrink-0">
              <img
                src={post.media_urls[0]}
                alt="Post media"
                className="h-16 w-16 rounded-lg object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm line-clamp-2">{post.content}</p>
                <div className="mt-1 flex items-center gap-4">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Heart className="mr-1 h-3 w-3" />
                    {post.post_analytics?.likes || 0}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {post.post_analytics?.comments || 0}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Share2 className="mr-1 h-3 w-3" />
                    {post.post_analytics?.shares || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  post.status === 'published' ? 'bg-green-100 text-green-700' :
                  post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {post.status}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View Analytics</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}