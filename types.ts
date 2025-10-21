export interface Performer {
  id: string;
  name: string;
  bio?: string;
  socialLink?: string;
  setTime?: string;
}

export interface Rating {
  id:string;
  rating: number;
  feedbackTags?: string[];
  comment?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  bio?: string;
  socialLink?: string;
  xp?: number;
  xpTrend?: 'UP' | 'DOWN' | 'STABLE';
}

export interface RaterStats {
  totalSP: number;
  ratingsSubmitted: number;
  commentsWritten: number;
}

export interface ScoutLevel {
  name: string;
  minSP: number;
}