// Base URL of the backend API. In production Caddy serves UI and API on one
// origin and proxies /api/* to the API, so no CORS is needed. Locally the Vite
// dev server proxies /api to http://localhost:8000 (see vite.config.ts).
export const API_URL = import.meta.env.VITE_API_URL ?? '/api'
