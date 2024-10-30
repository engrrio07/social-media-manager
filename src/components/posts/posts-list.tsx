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
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { postSchema, type Post } from "@/lib/schemas/post"

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
  }, [filter, supabase])

  async function fetchPosts() {
    try {
      setLoading(true)
      
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq(filter !== 'all' ? 'status' : '', filter !== 'all' ? filter : '')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!posts) {
        setPosts([])
        return
      }

      // Transform the data to match the schema
      const transformedPosts = posts.map(post => ({
        ...post,
        // Ensure dates are in ISO format
        created_at: new Date(post.created_at).toISOString(),
        updated_at: new Date(post.updated_at).toISOString(),
        // Handle nullable fields
        scheduled_for: post.scheduled_for ? new Date(post.scheduled_for).toISOString() : null,
        media_urls: post.media_urls || [],
        // Set default analytics if not present
        analytics: null
      }))

      // Validate the posts
      const validatedPosts = transformedPosts.map(post => {
        try {
          return postSchema.parse(post)
        } catch (e) {
          console.error('Invalid post data:', post, e)
          return null
        }
      }).filter((post): post is Post => post !== null)

      setPosts(validatedPosts)
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch posts",
        variant: "destructive",
      })
      setPosts([])
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
      
      // Refresh the posts list
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
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your post.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deletePost(post.id)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DropdownMenuContent>
</DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Image Grid Display */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="aspect-square w-full relative rounded-lg overflow-hidden">
                {post.media_urls.length === 1 ? (
                  <Image
                    src={post.media_urls[0]}
                    alt="Post image"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {/* First image */}
                    <div className="relative w-full h-full">
                      <Image
                        src={post.media_urls[0]}
                        alt="First image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Second image */}
                    {post.media_urls.length > 1 && (
                      <div className="relative w-full h-full">
                        <Image
                          src={post.media_urls[1]}
                          alt="Second image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Third image */}
                    {post.media_urls.length > 2 && (
                      <div className="relative w-full h-full">
                        <Image
                          src={post.media_urls[2]}
                          alt="Third image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Fourth image with overlay if more */}
                    {post.media_urls.length > 3 && (
                      <div className="relative w-full h-full">
                        <Image
                          src={post.media_urls[3]}
                          alt="Fourth image"
                          fill
                          className="object-cover"
                        />
                        {post.media_urls.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-lg font-medium">
                              +{post.media_urls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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