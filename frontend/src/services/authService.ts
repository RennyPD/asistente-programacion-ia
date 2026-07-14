import { api } from "./api";
import type { AuthResponse, AuthUser } from "../types/learnings";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

const TOKEN_KEY = "codetutor_token";
const USER_KEY = "codetutor_user";

export const registerUser = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const getMe = async (): Promise<AuthUser> => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const saveAuthData = (authResponse: AuthResponse) => {
  localStorage.setItem(TOKEN_KEY, authResponse.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
};

export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
