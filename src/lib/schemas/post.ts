// src/lib/schemas/post.ts
import * as z from "zod"

export const postSchema = z.object({
  content: z.string()
    .min(1, "Content is required")
    .max(2200, "Content must be less than 2200 characters"),
  scheduledFor: z.date()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        return date > new Date()
      },
      "Scheduled time must be in the future"
    ),
  platform: z.enum(["facebook"]),
  media_urls: z.array(z.string().url()).optional(),
})