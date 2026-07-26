import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;
export const TOKEN_KEY = "pg_token";

export const api = axios.create({ baseURL: API });

// Attach Authorization header from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login") {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export async function signup(email, password, name) {
  const { data } = await api.post("/auth/signup", { email, password, name });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---- Data ----
export async function getReps() {
  const { data } = await api.get("/reps");
  return data;
}

export async function getDeals() {
  const { data } = await api.get("/deals");
  return data;
}

export async function getDeal(id) {
  const { data } = await api.get(`/deals/${id}`);
  return data;
}

export async function getDealActivities(id) {
  const { data } = await api.get(`/deals/${id}/activities`);
  return data;
}

export async function extractText(text) {
  const { data } = await api.post("/extract", { text });
  return data;
}

export async function confirmUpdate(dealId, payload) {
  const { data } = await api.post(`/deals/${dealId}/confirm`, payload);
  return data;
}

export async function getHealthSummary() {
  const { data } = await api.get("/health/summary");
  return data;
}

export async function reseed() {
  const { data } = await api.post("/seed/reset");
  return data;
}
