// src/components/posts/posts-view.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import * as z from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { 
  MoreVertical, 
  Search, 
  ImageIcon,
  Calendar,
  Pencil,
  Trash,
  BarChart
} from "lucide-react"
import { PostWithAnalytics, postWithAnalyticsSchema } from "@/types/analytics"
import { EditPost } from "./edit-post"
import { postSchema } from "@/lib/schemas/post"

type Post = z.infer<typeof postSchema>

export function PostsView() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) {
      setStatusFilter(status)
    }
    fetchPosts()
  }, [statusFilter])

  async function fetchPosts() {
    try {
      // First check user authentication
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }
      if (!authData.user) {
        throw new Error('User not found')
      }

      // Log the user ID we're querying with
      console.log('Fetching posts for user:', authData.user.id)

      // Split the query into steps for better error tracking
      const query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })

      // Add status filter if needed
      const filteredQuery = statusFilter !== 'all' 
        ? query.eq('status', statusFilter)
        : query

      // Execute the query
      const { data, error: queryError } = await filteredQuery

      // Handle query errors
      if (queryError) {
        console.error('Database query error:', queryError)
        throw queryError
      }

      // Handle no data case
      if (!data) {
        console.log('No posts found')
        setPosts([])
        return
      }

      // Log raw data for debugging
      console.log('Raw data from database:', data)

      // Transform the data
      const transformedData = data.map(post => ({
        id: post.id || '',
        content: post.content || '',
        media_urls: Array.isArray(post.media_urls) ? post.media_urls : [],
        status: post.status || 'draft',
        scheduled_for: post.scheduled_for || null,
        platform: post.platform || 'facebook',
        created_at: post.created_at || new Date().toISOString(),
        updated_at: post.updated_at || post.created_at || new Date().toISOString(),
        user_id: post.user_id || authData.user.id,
        analytics: null // Initialize analytics as null since we're not using it yet
      }))

      // Log transformed data for debugging
      console.log('Transformed data:', transformedData)

      // Validate the data
      const validatedPosts = z.array(postSchema).parse(transformedData)
      
      // Update state
      setPosts(validatedPosts)
      
    } catch (error) {
      console.error('Detailed error:', error)
      
      // Handle specific error types
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', JSON.stringify(error.errors, null, 2))
      }
      
      // Show toast with more specific error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

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

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="rounded-md border">
          <div className="h-24 space-y-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No posts found
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="flex items-center gap-2">
                      {post.media_urls && post.media_urls.length > 0 && (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="truncate">{post.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' :
                      post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      post.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {post.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {post.scheduled_for && (
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {format(new Date(post.scheduled_for), "PPP 'at' p")}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditPost 
                          post={post} 
                          onUpdate={fetchPosts}
                        >
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </EditPost>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/analytics?post=${post.id}`)}
                        >
                          <BarChart className="mr-2 h-4 w-4" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}