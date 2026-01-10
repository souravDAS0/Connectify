export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // seconds
  year?: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  album_art_url?: string;
  play_count: number;
  created_at: string;
  updated_at: string;
  last_played?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_ids: string[];
  cover_art?: string;
  is_public: boolean;
  created_by?: string; // User ID who created the playlist
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AnalyticsStats {
  total_tracks: number;
  total_plays: number;
  total_playlists: number;
  total_users: number;
}

export interface UploadFormData {
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  duration: string;
  album_art_url?: string;
}
