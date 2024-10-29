// src/lib/image-utils.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function uploadImage(file: File | Blob): Promise<string> {
  const supabase = createClientComponentClient()
  
  const fileExt = 'png'
  const fileName = `${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, file, {
      contentType: 'image/png',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(data.path)

  return publicUrl
}