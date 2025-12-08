import { apiClient } from './client';
import {type Playlist } from '../types';

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await apiClient.get('/playlists');
  return response.data;
};

export const getPlaylistById = async (id: string): Promise<Playlist> => {
  const response = await apiClient.get(`/playlists/${id}`);
  return response.data;
};

export const createPlaylist = async (playlist: Partial<Playlist>): Promise<Playlist> => {
  const response = await apiClient.post('/playlists', playlist);
  return response.data;
};

export const updatePlaylist = async (id: string, updates: Partial<Playlist>): Promise<Playlist> => {
  const response = await apiClient.put(`/playlists/${id}`, updates);
  return response.data;
};

export const deletePlaylist = async (id: string): Promise<void> => {
  await apiClient.delete(`/playlists/${id}`);
};

export const addTrackToPlaylist = async (playlistId: string, trackId: string): Promise<void> => {
  await apiClient.post(`/playlists/${playlistId}/tracks`, { track_id: trackId });
};

export const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<void> => {
  await apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`);
};
