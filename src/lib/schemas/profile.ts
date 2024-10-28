// src/lib/schemas/profile.ts
import * as z from "zod"

export const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(160).optional(),
})