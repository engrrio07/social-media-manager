// src/components/posts/posts-list.tsx
"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { MoreVertical } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { EditPost } from "./edit-post"

type Post = {
  id: string
  content: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_for?: string
  created_at: string
}

interface PostsListProps {
  filter: 'all' | 'draft' | 'scheduled' | 'published'
}

export function PostsList({ filter }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchPosts()
  }, [filter])

  async function fetchPosts() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(id: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <Badge>{post.status}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditPost post={post} onUpdate={fetchPosts}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Edit
                  </DropdownMenuItem>
                </EditPost>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => deletePost(post.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">{post.content}</p>
            {post.scheduled_for && (
              <p className="text-xs text-muted-foreground">
                Scheduled for: {format(new Date(post.scheduled_for), "PPP 'at' p")}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Created: {format(new Date(post.created_at), "PPP")}
            </p>
          </CardContent>
        </Card>
      ))}
      {posts.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground">
          No posts found
        </div>
      )}
    </div>
  )
}