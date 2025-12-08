import { apiClient, apiClientMultipart } from './client';
import {type Track } from '../types';

export const getTracks = async (): Promise<Track[]> => {
  const response = await apiClient.get('/tracks');
  return response.data;
};

export const getTrackById = async (id: string): Promise<Track> => {
  const response = await apiClient.get(`/tracks/${id}`);
  return response.data;
};

export const uploadTrack = async (formData: FormData): Promise<Track> => {
  const response = await apiClientMultipart.post('/upload', formData);
  return response.data;
};

export const updateTrack = async (id: string, updates: Partial<Track>): Promise<Track> => {
  const response = await apiClient.put(`/tracks/${id}`, updates);
  return response.data;
};

export const deleteTrack = async (id: string): Promise<void> => {
  await apiClient.delete(`/tracks/${id}`);
};

export const getPopularTracks = async (limit: number = 10): Promise<Track[]> => {
  const response = await apiClient.get(`/analytics/popular?limit=${limit}`);
  return response.data;
};

export const getRecentTracks = async (limit: number = 10): Promise<Track[]> => {
  const response = await apiClient.get(`/analytics/recent?limit=${limit}`);
  return response.data;
};
