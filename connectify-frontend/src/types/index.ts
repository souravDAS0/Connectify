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

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number; // milliseconds
  volume: number; // 0.0 to 1.0
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
