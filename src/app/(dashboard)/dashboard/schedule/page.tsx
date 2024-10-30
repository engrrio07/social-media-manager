// src/app/(dashboard)/dashboard/schedule/page.tsx
import { Metadata } from "next"
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar"
import { ScheduleList } from "@/components/schedule/schedule-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { requireAuth } from "@/lib/supabase/auth"

export const metadata: Metadata = {
  title: "Schedule | Social Media Manager",
  description: "Manage your scheduled posts",
}

export default async function SchedulePage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
        <p className="text-muted-foreground">
          Manage your scheduled posts and content calendar
        </p>
      </div>
      
      <Separator />

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="space-y-4">
          <ScheduleCalendar />
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <ScheduleList />
        </TabsContent>
      </Tabs>
    </div>
  )
}