export interface Performer {
  id: string;
  name: string;
  bio?: string;
  socialLink?: string;
  streamingLink?: string;
  slot?: number;
  image?: string;
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
  ratingTrend?: 'UP' | 'DOWN' | 'STABLE';
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

// New types for the Booking System
export interface Event {
  id: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalSlots: number;
  availableSlots: number;
  venueAddress?: string;
  venueGoogleMapsLink?: string;
  venueTelephone?: string;
}

export interface Booking {
  id: string;
  event: {
    id: string;
    venueName:string;
    date: string;
    startTime: string;
  };
  slotNumber: number;
  status: 'Confirmed' | 'Cancelled' | 'No-Show' | 'Checked-In';
}

export interface Slot {
    slotNumber: number;
    status: 'AVAILABLE' | 'BOOKED';
    performer?: {
        id: string;
        name: string;
    }
}