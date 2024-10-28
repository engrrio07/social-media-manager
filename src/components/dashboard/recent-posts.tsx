// src/components/dashboard/recent-posts.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Post } from "@/types"

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setPosts(data)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {post.content}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {post.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}