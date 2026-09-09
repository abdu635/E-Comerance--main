const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const SESSION_KEY = 'ecommerce_session'

async function request(path, options = {}) {
  const headers = { ...options.headers }
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const errors = data.errors ? Object.values(data.errors).flat().join(' ') : data.detail
    throw new Error(errors || data.message || 'The request could not be completed.')
  }
  return data
}

export const api = {
  login: (body) => request('/login/', { method: 'POST', body: JSON.stringify(body) }).then((data) => ({ user: data.user, tokens: data.tokens })),
  signup: (body) => request('/signup/', { method: 'POST', body: JSON.stringify(body) }),
  refresh: (refresh) => request('/token/refresh/', { method: 'POST', body: JSON.stringify({ refresh }) }).then((data) => ({ access: data.access, refresh })),
  categories: () => request('/categories/'),
  products: () => request('/products/'),
  createProduct: (body, access) => request('/products/', { method: 'POST', headers: { Authorization: `Bearer ${access}` }, body }),
}

export function getStoredSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null } }
export function saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) }
export function clearSession() { localStorage.removeItem(SESSION_KEY) }
