// src/types/index.ts
export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'user';
    created_at: string;
  }
  
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls?: string[]
  scheduled_for?: string
  platform: 'facebook'
  status: PostStatus
  analytics?: {
    likes: number
    shares: number
    comments: number
  }
  created_at: string
  updated_at: string
}
  
export interface WaitlistEntry {
    id: string;
    email: string;
    status: 'pending' | 'approved' | 'invited';
    invite_code?: string;
    created_at: string;
  }
  