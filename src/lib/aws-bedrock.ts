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
      modelId: "anthropic.claude-v2:1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `STRICT OUTPUT FORMAT - DO NOT INCLUDE ANY INTRODUCTORY TEXT:
${content}

<caption>
[Write your creative caption here with emojis and engagement hooks]
[Add 3-5 hashtags]
</caption>

Style guide:
- Be bold and attention-grabbing
- Use storytelling elements
- Include trending emojis (2-4)
- Ask thought-provoking questions
- Add strong calls-to-action
- Use power words for impact
- Create FOMO or urgency
- Keep tone conversational
- Make it relatable to audience
- Include statistics when relevant

Remember: Start IMMEDIATELY with the caption text. No introductions, no explanations, no character counts.`
          }
        ],
        temperature: 0.9,
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
        prompt: prompt
      }),
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.images?.[0]) {
      console.error('Response body:', JSON.stringify(responseBody, null, 2))
      throw new Error('No image generated in response')
    }

    return responseBody.images[0]
  } catch (error) {
    console.error('Error generating image:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
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