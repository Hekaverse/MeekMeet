export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "member" | "shepherd" | "admin";
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Circle {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  meeting_place: string | null;
  meeting_address: string | null;
  image_url: string | null;
  shepherd_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CircleQuestion {
  id: string;
  circle_id: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface CircleRoutine {
  id: string;
  circle_id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  order_index: number;
  created_at: string;
}

export interface Meeting {
  id: string;
  circle_id: string;
  scheduled_at: string;
  duration_minutes: number;
  location_name: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  is_cancelled: boolean;
  created_at: string;
}

export interface RSVP {
  id: string;
  meeting_id: string;
  user_id: string;
  status: "going" | "maybe" | "not_going";
  created_at: string;
}
