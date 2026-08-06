import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://mutual-fund-prediction-system.onrender.com";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const isBackendConfigured = Boolean(API_URL);

export default apiClient;
