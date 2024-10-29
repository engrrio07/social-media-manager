// src/lib/aws-bedrock.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { supabase } from "./supabase/client"

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function generateCaption(content: string): Promise<string> {
  try {
    const input = {
      modelId: "anthropic.claude-3-sonnet",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Generate an engaging social media caption for the following content: ${content}. 
            Make it engaging, include relevant hashtags, and keep it under 280 characters.
            Format: Caption text followed by hashtags on a new line.`
          }
        ],
        temperature: 0.7,
      }),
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    return responseBody.content[0].text
  } catch (error) {
    console.error('Error generating caption:', error)
    throw error
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const input = {
      modelId: "stability.stable-image-ultra-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: prompt,
        cfg_scale: 7,
        steps: 50,
        seed: Math.floor(Math.random() * 1000000),
        style_preset: "photographic",
        width: 1024,
        height: 576,
      }),
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrock.send(command)

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.artifacts?.[0]?.base64) {
      throw new Error('No image generated')
    }

    return responseBody.artifacts[0].base64
  } catch (error) {
    console.error('Error generating image:', error)
    throw error
  }
}

function base64ToBlob(base64: string): Blob {
  const byteString = atob(base64)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const int8Array = new Uint8Array(arrayBuffer)
  
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i)
  }
  
  return new Blob([int8Array], { type: 'image/png' })
}