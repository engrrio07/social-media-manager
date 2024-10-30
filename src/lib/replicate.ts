// src/lib/replicate.ts
import Replicate from "replicate"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function generateImageWithFlux(prompt: string): Promise<string> {
  try {
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt,
          num_samples: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
          width: 1024,
          height: 576,
        }
      }
    )

    // Replicate returns an array of image URLs
    const imageUrl = Array.isArray(output) ? output[0] : output
    return imageUrl as string
  } catch (error) {
    console.error('Replicate error:', error)
    throw error
  }
}