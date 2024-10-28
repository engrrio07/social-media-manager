// src/lib/schemas/post.ts
import * as z from "zod"

export const postSchema = z.object({
  content: z.string()
    .min(1, { message: "Content cannot be empty" })
    .max(2200, { message: "Content cannot exceed 2200 characters" }),
  scheduled_for: z.string().datetime().optional(),
  platform: z.enum(["facebook"]),
  media_urls: z.array(z.string().url()).optional(),
})