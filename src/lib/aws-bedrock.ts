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

First, analyze this content:
${content}

Then, generate a caption following these guidelines:

If the content is about products/services (e.g., testimonials, product showcases, service outcomes):
- Highlight customer satisfaction/success stories
- Showcase the value proposition
- Include subtle call-to-actions for inquiries
- Mention product/service benefits
- Use social proof elements
- Add relevant industry hashtags

If the content is general/other:
- Focus on storytelling elements
- Create emotional connections
- Use trending topics if relevant
- Keep it conversational and engaging
- Add broader appeal hashtags

General style requirements:
- Use 2-4 relevant emojis
- Include 3-5 hashtags
- Ask engaging questions when appropriate
- Create urgency or FOMO naturally
- Keep tone warm and authentic
- Include statistics or specifics when available
- Maximum impact in first 2 lines
- Break text into readable chunks

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