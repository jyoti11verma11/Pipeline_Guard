import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

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
  const { data } = await api.post("/seed");
  return data;
}
