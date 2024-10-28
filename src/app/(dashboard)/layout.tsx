// src/app/(dashboard)/layout.tsx
import { DashboardNav } from "@/components/dashboard/nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 w-64 bg-background border-r">
        <div className="h-full py-4 flex flex-col">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <h1 className="text-xl font-bold">Social Media Manager</h1>
          </div>
          <DashboardNav />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="pl-64 flex-1">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        
        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}