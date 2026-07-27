import type { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '@/types/auth'
// import { apiClient, tokenStorage } from '@/api/client'
import { tokenStorage } from '@/api/client'

function delay<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export class AuthError extends Error {}

// --- Mock-mode demo user store -------------------------------------------
// Simulates the backend's `users` table in localStorage so the full
// register -> login -> refresh -> logout flow works end-to-end for demos
// and screenshots before a real backend is wired up. Uncomment the
// apiClient calls below (and delete this block) once VITE_API_BASE_URL
// points at a live FastAPI instance — the real backend enforces all of
// this server-side already (see the platform's AuthService).

interface MockUserRecord extends AuthUser {
  password: string
}

const MOCK_USERS_KEY = 'mf_mock_users'

function loadMockUsers(): MockUserRecord[] {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY)
    return raw ? (JSON.parse(raw) as MockUserRecord[]) : []
  } catch {
    return []
  }
}

function saveMockUsers(users: MockUserRecord[]): void {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

function issueMockTokens(user: AuthUser): AuthSession['tokens'] {
  // Not real JWTs — just enough structure for the UI's token-presence checks.
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email }))
  return {
    accessToken: `mock.${payload}.access`,
    refreshToken: `mock.${payload}.refresh`,
    tokenType: 'bearer',
  }
}

// ---------------------------------------------------------------------------

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  // const { data } = await apiClient.post('/auth/register', {
  //   email: payload.email,
  //   password: payload.password,
  //   full_name: payload.fullName,
  // })
  // const { data: loginData } = await apiClient.post('/auth/login', {
  //   email: payload.email,
  //   password: payload.password,
  // })
  // tokenStorage.setTokens(loginData.access_token, loginData.refresh_token)
  // return { user: mapUser(data), tokens: mapTokens(loginData) }

  const users = loadMockUsers()
  if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    await delay(null)
    throw new AuthError('An account with this email already exists.')
  }

  const user: MockUserRecord = {
    id: crypto.randomUUID(),
    email: payload.email,
    fullName: payload.fullName,
    role: 'user',
    isActive: true,
    isVerified: false,
    password: payload.password,
  }
  saveMockUsers([...users, user])

  const tokens = issueMockTokens(user)
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
  const { password: _password, ...publicUser } = user
  return delay({ user: publicUser, tokens })
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  // const { data } = await apiClient.post('/auth/login', payload)
  // tokenStorage.setTokens(data.access_token, data.refresh_token)
  // const { data: me } = await apiClient.get('/users/me')
  // return { user: mapUser(me), tokens: mapTokens(data) }

  const users = loadMockUsers()
  const match = users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase())
  if (!match || match.password !== payload.password) {
    await delay(null)
    throw new AuthError('Invalid email or password.')
  }

  const tokens = issueMockTokens(match)
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
  const { password: _password, ...publicUser } = match
  return delay({ user: publicUser, tokens })
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // const { data } = await apiClient.get('/users/me')
  // return mapUser(data)

  const accessToken = tokenStorage.getAccessToken()
  if (!accessToken?.startsWith('mock.')) return null

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1])) as { sub: string; email: string }
    const users = loadMockUsers()
    const match = users.find((u) => u.id === payload.sub)
    if (!match) return null
    const { password: _password, ...publicUser } = match
    return delay(publicUser, 150)
  } catch {
    return null
  }
}

export function logout(): void {
  tokenStorage.clearTokens()
}
