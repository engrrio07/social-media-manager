// src/components/dashboard/quick-actions.tsx
import { 
    PlusCircle, 
    Calendar, 
    BarChart2, 
    Settings,
    FileText,
    Clock
  } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { CreatePost } from "@/components/posts/create-post"
  import Link from "next/link"
  
  export function QuickActions() {
    const actions = [
      {
        label: "Create Post",
        icon: PlusCircle,
        component: (
          <CreatePost>
            <Button variant="outline" className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </CreatePost>
        )
      },
      {
        label: "Schedule",
        icon: Calendar,
        href: "/dashboard/schedule"
      },
      {
        label: "Analytics",
        icon: BarChart2,
        href: "/dashboard/analytics"
      },
      {
        label: "Drafts",
        icon: FileText,
        href: "/dashboard/posts?filter=draft"
      },
      {
        label: "Queue",
        icon: Clock,
        href: "/dashboard/schedule?view=queue"
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings"
      }
    ]
  
    return (
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => 
          action.component ? (
            <div key={action.label}>{action.component}</div>
          ) : (
            <Link key={action.label} href={action.href!}>
              <Button variant="outline" className="w-full justify-start">
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          )
        )}
      </div>
    )
  }