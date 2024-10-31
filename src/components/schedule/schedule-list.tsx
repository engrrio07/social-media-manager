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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ScheduledPost {
  id: string
  content: string
  scheduled_for: string
  platform: string
  status: string
}

export function ScheduleList() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchScheduledPosts()
  }, [supabase])

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

  async function updateScheduledTime(postId: string) {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select both date and time",
      })
      return
    }

    const [hours, minutes] = selectedTime.split(':')
    const newDate = new Date(selectedDate)
    newDate.setHours(parseInt(hours), parseInt(minutes))

    const { error } = await supabase
      .from('posts')
      .update({ scheduled_for: newDate.toISOString() })
      .eq('id', postId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule",
      })
    } else {
      toast({
          title: "Success",
        description: "Schedule updated successfully",
      })
      fetchScheduledPosts()
      setSelectedPost(null)
    }
  }

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Scheduled For</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
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
              <TableCell>
                <Dialog open={selectedPost?.id === post.id} onOpenChange={(open) => {
                  if (!open) setSelectedPost(null)
                  if (open) {
                    setSelectedPost(post)
                    setSelectedDate(new Date(post.scheduled_for))
                    setSelectedTime(format(new Date(post.scheduled_for), "HH:mm"))
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reschedule Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Date</label>
                        <div className="flex justify-center">
                          <Calendar
                            mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                            className="rounded-md border"
                            />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Time</label>
                        <Select value={selectedTime} onValueChange={setSelectedTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => selectedPost && updateScheduledTime(selectedPost.id)}
                      >
                        Update Schedule
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No scheduled posts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}