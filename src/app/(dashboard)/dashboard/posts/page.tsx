// src/app/(dashboard)/dashboard/posts/page.tsx
import { Metadata } from "next"
import { requireAuth } from "@/lib/supabase/auth"
import { PostsView } from "@/components/posts/posts-view"
import { Separator } from "@/components/ui/separator"
import { CreatePost } from "@/components/posts/create-post"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Posts | Social Media Manager",
  description: "Manage your social media posts",
}

export default async function PostsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Posts</h2>
          <p className="text-muted-foreground">
            Create, schedule, and manage your social media posts
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

      <PostsView />
    </div>
  )
}