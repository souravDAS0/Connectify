import { apiClient } from "./client";
import type { Track } from "../types";
import Config from "../config";

export const getTracks = async (): Promise<Track[]> => {
  const response = await apiClient.get("/tracks");
  return response.data;
};

export const recordPlay = async (trackId: string): Promise<void> => {
  await apiClient.post(`/tracks/${trackId}/play`);
};

export const getTrackById = async (trackId: string): Promise<Track> => {
  const response = await apiClient.get(`/tracks/${trackId}`);
  return response.data;
};

export const getStreamUrl = (trackId: string): string => {
  const baseUrl = Config.apiUrl;
  return `${baseUrl}/stream/${trackId}`;
};
