// src/lib/aws-bedrock.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

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
      modelId: "anthropic.claude-instant-v1",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: `\n\nHuman: Generate a creative and engaging social media caption for the following context: ${prompt}. The caption should be engaging and include relevant hashtags.

\n\nAssistant: Let me create an engaging social media caption for that context.`,
        max_tokens_to_sample: 500,
        temperature: 0.7,
      }),
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrock.send(command)

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    return responseBody.completion
  } catch (error) {
    console.error('Error generating caption:', error)
    throw new Error('Failed to generate caption')
  }
}