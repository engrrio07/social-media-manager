// src/app/api/ai/generate-caption/route.ts
import { NextResponse } from "next/server"
import { generateCaption } from "@/lib/aws-bedrock"

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    const caption = await generateCaption(content)
    
    return NextResponse.json({ caption })
  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    )
  }
}