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
import { format, isSameDay } from "date-fns"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScheduledPost {
  id: string
  content: string
  scheduled_for: string
  platform: string
  status: string
  media_urls?: string[] | null
}

function PostPreview({ post }: { post: ScheduledPost }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1"> {/* Add min-w-0 and flex-1 to contain text */}
        <p className="text-sm font-medium truncate"> {/* Add truncate */}
          {format(new Date(post.scheduled_for), 'h:mm a')}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 break-words"> {/* Add break-words */}
          {post.content}
        </p>
      </div>
    </div>
  )
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
      }).sort((a, b) => 
        new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
      )
      setSelectedDayPosts(dayPosts)
    }
  }, [date, posts])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Select a date to view scheduled posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              components={{
                DayContent: (props) => {
                  const dayPosts = posts.filter(post => 
                    isSameDay(new Date(post.scheduled_for), props.date)
                  )
                  
                  return (
                    <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <div className="relative w-full h-full cursor-default">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {props.date.getDate()}
                        </div>
                        {dayPosts.length > 0 && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                            {dayPosts.slice(0, 3).map((_, i) => (
                              <div 
                                key={i}
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  i === 0 && "bg-primary",
                                  i === 1 && "bg-blue-500",
                                  i === 2 && "bg-green-500"
                                )}
                              />
                            ))}
                            {dayPosts.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{dayPosts.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </HoverCardTrigger>
                    {dayPosts.length > 0 && (
                      <HoverCardContent 
                        align="start" 
                        className="w-[280px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85" // Adjusted width and added backdrop blur
                        side="right" // Changed to right to prevent overflow
                        sideOffset={5}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {format(props.date, "MMMM d, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''} scheduled
                          </p>
                          <Separator className="my-2" />
                          <div className="space-y-2 max-h-[200px] overflow-y-auto"> {/* Added max height and scroll */}
                            {dayPosts.map((post) => (
                              <PostPreview key={post.id} post={post} />
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    )}
                  </HoverCard>
                  )
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="h-fit md:sticky md:top-4">
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
                  {format(new Date(post.scheduled_for), 'h:mm a')}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {post.content}
                </p>
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-2">
                    <img
                      src={post.media_urls[0]}
                      alt="Post media"
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  </div>
                )}
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
  )
}