import { apiClient } from "./client";
import { type AnalyticsStats } from "../types";

export const getAnalyticsStats = async (): Promise<AnalyticsStats> => {
  const response = await apiClient.get("/analytics/stats");
  return response.data;
};
