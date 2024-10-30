// src/components/schedule/schedule-list.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ScheduledPost {
  id: string
  content: string
  scheduled_for: string
  platform: string
  status: string
}

export function ScheduleList() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchScheduledPosts() {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true })

      if (!error && data) {
        setPosts(data)
      }
    }

    fetchScheduledPosts()
  }, [supabase])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Scheduled For</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="max-w-[300px]">
                <p className="truncate">{post.content}</p>
              </TableCell>
              <TableCell>{post.platform}</TableCell>
              <TableCell>
                {format(new Date(post.scheduled_for), "PPP 'at' p")}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{post.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No scheduled posts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}