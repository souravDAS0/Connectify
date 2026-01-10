import { apiClient } from "./client";
import { type User } from "../types";

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get("/admin/users");
  return response.data;
};

export const getUserById = async (id: string): Promise<User> => {
  const response = await apiClient.get(`/admin/users/${id}`);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};
