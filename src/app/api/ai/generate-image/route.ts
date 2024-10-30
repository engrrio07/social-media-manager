// src/app/api/ai/generate-image/route.ts
import { NextResponse } from 'next/server'
import { generateImage } from '@/lib/aws-bedrock'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key instead of anon key
)

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    // Generate the image
    const base64Image = await generateImage(prompt)
    
    const bucketName = 'post-images'
    
    // Convert base64 to Blob
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(`generated/${Date.now()}.png`, buffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw uploadError
    }

    // Get public URL using the same bucket name
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)  // Using the same bucket name as upload
      .getPublicUrl(uploadData.path)

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}