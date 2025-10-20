
export interface Performer {
  id: string;
  name: string;
  bio?: string;
  socialLink?: string;
  setTime?: string;
}

export interface Rating {
  id:string;
  name:string;
  rating: number;
  feedbackTags?: string[];
}
