import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://mutual-fund-prediction-system.onrender.com/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export const isBackendConfigured = Boolean(API_URL)

export default apiClient
