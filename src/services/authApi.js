import { apiPost } from "./apiClient";

export function login(credentials) {
  return apiPost("/auth/login", credentials);
}

export function register(registration) {
  return apiPost("/auth/register", registration);
}
