import { apiClient } from "./client";

export interface Playlist {
  id: string;
  name: string;
  description: string;
  track_ids: string[];
  cover_art?: string;
  is_public?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistInput {
  name: string;
  description: string;
  created_by?: string; // User ID of the creator
}

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await apiClient.get("/playlists");
  return response.data;
};

export const getPlaylistById = async (id: string): Promise<Playlist> => {
  const response = await apiClient.get(`/playlists/${id}`);
  return response.data;
};

export const createPlaylist = async (
  data: PlaylistInput
): Promise<Playlist> => {
  const response = await apiClient.post("/playlists", data);
  return response.data;
};

export const updatePlaylist = async (
  id: string,
  data: Partial<PlaylistInput>
): Promise<Playlist> => {
  const response = await apiClient.put(`/playlists/${id}`, data);
  return response.data;
};

export const deletePlaylist = async (id: string): Promise<void> => {
  await apiClient.delete(`/playlists/${id}`);
};

export const addTrackToPlaylist = async (
  playlistId: string,
  trackId: string
): Promise<void> => {
  await apiClient.post(`/playlists/${playlistId}/tracks`, {
    track_id: trackId,
  });
};

export const removeTrackFromPlaylist = async (
  playlistId: string,
  trackId: string
): Promise<void> => {
  await apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`);
};
