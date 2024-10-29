// src/app/api/ai/generate-image/route.ts
import { NextResponse } from "next/server"
import { generateImage } from "@/lib/aws-bedrock"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Generate image using Bedrock
    const base64Image = await generateImage(prompt)
    
    // Convert base64 to blob
    const imageBuffer = Buffer.from(base64Image, 'base64')
    const blob = new Blob([imageBuffer], { type: 'image/png' })

    // Upload to Supabase
    const supabase = createClientComponentClient()
    const fileName = `${Date.now()}.png`
    
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path)
    
    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    )
  }
}