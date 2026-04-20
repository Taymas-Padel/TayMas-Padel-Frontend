import axios from 'axios'
import type { LoginResponse, TokenRefreshResponse } from '@/types/auth'

// В dev (в т.ч. через ngrok) запросы идут на тот же хост и проксируются — нет mixed content и CORS
const BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL ?? 'https://213.155.23.227/api')

// Use plain axios (no interceptors) for auth endpoints to avoid circular refresh
const authAxios = axios.create({ baseURL: BASE_URL })

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await authAxios.post<LoginResponse>('/auth/crm/login/', { username, password })
  return data
}

export async function refreshToken(refresh: string): Promise<TokenRefreshResponse> {
  const { data } = await authAxios.post<TokenRefreshResponse>('/auth/jwt/refresh/', { refresh })
  return data
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await authAxios.post('/auth/jwt/verify/', { token })
    return true
  } catch {
    return false
  }
}
