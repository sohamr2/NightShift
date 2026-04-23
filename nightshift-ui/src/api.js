// =============================================================================
// Centralized API helper — base URL from env, auto-attaches JWT
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Get the stored auth token.
 */
export function getToken() {
  return localStorage.getItem('nightshift_token')
}

/**
 * Store a new auth token.
 */
export function setToken(token) {
  localStorage.setItem('nightshift_token', token)
}

/**
 * Clear the auth token (logout).
 */
export function clearToken() {
  localStorage.removeItem('nightshift_token')
}

/**
 * Build default headers with JSON content type + optional Bearer token.
 */
function headers() {
  const h = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

/**
 * Call the /predict endpoint.
 */
export async function predict(payload) {
  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  return res.json()
}

/**
 * Call the /chat endpoint.
 */
export async function chat(payload) {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Call /auth/me to get the current user profile.
 */
export async function fetchMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

/**
 * Get the URL to redirect the user to Google OAuth.
 */
export function getGoogleLoginUrl() {
  return `${API_URL}/auth/google`
}

/**
 * Fetch the user's most recent assessment from the DB.
 * Throws if not found (404) or not authenticated.
 */
export async function fetchLatestAssessment() {
  const res = await fetch(`${API_URL}/assessments/latest`, { headers: headers() })
  if (!res.ok) throw new Error(`No assessment: ${res.status}`)
  return res.json()
}

/**
 * Fetch aggregated analytics data for the dashboard.
 */
export async function fetchAnalytics({ gender, platform, activityType, ageGroup } = {}) {
  const params = new URLSearchParams()
  if (gender)       params.append('gender', gender)
  if (platform)     params.append('platform', platform)
  if (activityType) params.append('activity_type', activityType)
  if (ageGroup)     params.append('age_group', ageGroup)
  const res = await fetch(`${API_URL}/analytics?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(`Analytics error ${res.status}`)
  return res.json()
}
