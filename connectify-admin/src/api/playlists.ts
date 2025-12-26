import { apiClient } from "./client";
import { type Playlist } from "../types";

// Admin API - View only (no create, update, delete)

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await apiClient.get("/playlists");
  return response.data;
};

export const getPlaylistById = async (id: string): Promise<Playlist> => {
  const response = await apiClient.get(`/playlists/${id}`);
  return response.data;
};
