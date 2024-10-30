// src/types/analytics.ts
export interface PostAnalytics {
    id: string;
    post_id: string;
    likes: number;
    shares: number;
    comments: number;
    views: number;
    reach: number;
    engagement_rate: number;
    platform: string;
    date: string;
    created_at: string;
  }
  
  export interface AnalyticsSummary {
    id: string;
    user_id: string;
    total_posts: number;
    total_engagement: number;
    total_reach: number;
    avg_engagement_rate: number;
    date: string;
    platform: string;
    created_at: string;
  }