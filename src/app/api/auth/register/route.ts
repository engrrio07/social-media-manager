// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/schemas/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = registerSchema.parse(json)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}