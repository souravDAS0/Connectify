import { apiClient } from './client';
import type { Track } from '../types';

export const getTracks = async (): Promise<Track[]> => {
  const response = await apiClient.get('/tracks');
  return response.data;
};

export const recordPlay = async (trackId: string): Promise<void> => {
  await apiClient.post(`/tracks/${trackId}/play`);
};

export const getStreamUrl = (trackId: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/stream/${trackId}`;
};
