// src/components/schedule/schedule-calendar.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from "date-fns"

interface ScheduledPost {
  id: string
  content: string
  scheduled_for: string
  platform: string
  status: string
}

export function ScheduleCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [selectedDayPosts, setSelectedDayPosts] = useState<ScheduledPost[]>([])
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

  useEffect(() => {
    if (date) {
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.scheduled_for)
        return (
          postDate.getDate() === date.getDate() &&
          postDate.getMonth() === date.getMonth() &&
          postDate.getFullYear() === date.getFullYear()
        )
      })
      setSelectedDayPosts(dayPosts)
    }
  }, [date, posts])

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      <Card>
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDayPosts.length} posts scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDayPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">
                    {format(new Date(post.scheduled_for), 'p')}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            ))}
            {selectedDayPosts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No posts scheduled for this day
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}