// src/components/auth/route-guard.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return <>{children}</>
}