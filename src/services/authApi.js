import { apiPost } from "./apiClient";

export function login(credentials) {
  return apiPost("/auth/login", credentials);
}
