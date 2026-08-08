import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const ACCESS_TOKEN_KEY = 'mf_access_token'
const REFRESH_TOKEN_KEY = 'mf_refresh_token'

export const tokenStorage = {
  getAccessToken: (): string | null =>
    localStorage.getItem(ACCESS_TOKEN_KEY),

  getRefreshToken: (): string | null =>
    localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },

  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// -----------------------------------------------------
// Request interceptor
// -----------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// -----------------------------------------------------
// FastAPI error normalization
// -----------------------------------------------------

function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data as
    | {
        detail?: unknown
        message?: unknown
      }
    | undefined

  const detail = data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (
          item &&
          typeof item === 'object' &&
          'msg' in item
        ) {
          return String(item.msg)
        }

        return null
      })
      .filter(
        (message): message is string =>
          Boolean(message),
      )

    if (messages.length > 0) {
      return messages.join('; ')
    }
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  return error.message || 'Something went wrong'
}

// -----------------------------------------------------
// Token refresh
// -----------------------------------------------------

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()

  if (!refreshToken) {
    return null
  }

  try {
    const response = await axios.post<{
      access_token: string
      token_type: string
    }>(
      `${API_BASE_URL}/auth/refresh`,
      {
        refresh_token: refreshToken,
      },
      {
        timeout: 15_000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const newAccessToken = response.data.access_token

    tokenStorage.setTokens(
      newAccessToken,
      refreshToken,
    )

    return newAccessToken
  } catch {
    tokenStorage.clearTokens()
    return null
  }
}

// -----------------------------------------------------
// Response interceptor
// -----------------------------------------------------

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & {
          _retried?: boolean
        })
      | undefined

    if (!original) {
      return Promise.reject(
        new Error(extractErrorMessage(error)),
      )
    }

    const url = original.url ?? ''

    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')

    // -----------------------------------------------
    // Handle expired access token
    // -----------------------------------------------

    if (
      error.response?.status === 401 &&
      !original._retried &&
      !isAuthEndpoint
    ) {
      original._retried = true

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })

      const newAccessToken =
        await refreshPromise

      if (newAccessToken) {
        original.headers =
          original.headers ??
          ({} as typeof original.headers)

        original.headers.Authorization =
          `Bearer ${newAccessToken}`

        return apiClient(original)
      }

      tokenStorage.clearTokens()

      window.dispatchEvent(
        new CustomEvent('auth:session-expired'),
      )
    }

    return Promise.reject(
      new Error(extractErrorMessage(error)),
    )
  },
)
