// src/app/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold mb-8">
        Social Media Manager
      </h1>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/auth/login">Login</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/register">Register</Link>
        </Button>
      </div>
    </main>
  )
}