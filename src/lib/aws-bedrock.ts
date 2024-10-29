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

export async function generateCaption(prompt: string): Promise<string> {
  try {
    const input = {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
//         prompt: `\n\nHuman: Generate a creative and engaging social media caption for the following context: ${prompt}. The caption should be engaging and include relevant hashtags.

// \n\nAssistant: Let me create an engaging social media caption for that context.`,
        max_tokens: 500,
        temperature: 0.7,
        anthropic_version: "bedrock-2023-05-31",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `\n\nHuman: Generate a creative and engaging social media caption for the following context: ${prompt}. The caption should be engaging and include relevant hashtags.

\n\nAssistant: Let me create an engaging social media caption for that context.`
              }
            ]
          }
        ]
      }),
    }

    // const payload = {
    //   anthropic_version: "bedrock-2023-05-31",
    //   max_tokens: 1000,
    //   messages: [
    //     {
    //       role: "user",
    //       content: [{ type: "text", text: `Human: Generate a creative and engaging social media caption for the following context: ${prompt}. The caption should be engaging and include relevant hashtags. Assistant: Let me create an engaging social media caption for that context.` }],
    //     },
    //   ],
    // };

    // const command = new InvokeModelCommand({
    //   contentType: "application/json",
    //   body: JSON.stringify(payload),
    //   modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    // });

    const command = new InvokeModelCommand(input)
    const response = await bedrock.send(command)

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    console.log("Response Body:", responseBody)
    return responseBody.content[0].text;
  } catch (error) {
    console.error('Error generating caption:', error)
    throw new Error('Failed to generate caption')
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