// src/app/(dashboard)/dashboard/posts/page.tsx
import { Metadata } from "next"
import { CreatePost } from "@/components/posts/create-post"
import { PostsList } from "@/components/posts/posts-list"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Posts | Social Media Manager",
  description: "Manage your social media posts",
}

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Posts</h2>
          <p className="text-muted-foreground">
            Create and manage your social media posts
          </p>
        </div>
        <CreatePost>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </CreatePost>
      </div>
      
      <Separator />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <PostsList filter="all" />
        </TabsContent>
        <TabsContent value="draft" className="space-y-4">
          <PostsList filter="draft" />
        </TabsContent>
        <TabsContent value="scheduled" className="space-y-4">
          <PostsList filter="scheduled" />
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          <PostsList filter="published" />
        </TabsContent>
      </Tabs>
    </div>
  )
}