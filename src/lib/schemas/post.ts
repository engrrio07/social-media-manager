// src/lib/schemas/post.ts
import { z } from "zod"

// Base schema for media items
export const mediaItemSchema = z.object({
  url: z.string().url(),
  isExisting: z.boolean().optional(),
  file: z.instanceof(File).optional(),
})

// Schema for post content form
export const postContentSchema = z.object({
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
  platform: z.enum(["facebook"]).default("facebook"),
  media_urls: z.array(z.string().url()).optional(),
})

// Schema for generate states
export const generateStateSchema = z.object({
  loading: z.boolean(),
  error: z.string().nullable(),
})

// Schema for complete post data
export const postSchema = z.object({
  id: z.string(),
  content: z.string(),
  media_urls: z.array(z.string()).nullable().default([]),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']),
  scheduled_for: z.string().nullable(),
  platform: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  user_id: z.string(),
  analytics: z.object({
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    impressions: z.number(),
    clicks: z.number(),
    engagement_rate: z.number()
  }).nullable().optional()
})

// Type exports
export type PostContent = z.infer<typeof postContentSchema>
export type Post = z.infer<typeof postSchema>
export type GenerateState = z.infer<typeof generateStateSchema>
export type MediaItem = z.infer<typeof mediaItemSchema>