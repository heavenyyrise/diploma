/** Локально: /api (Vite proxy). На Railway: https://backend-xxx.up.railway.app/api */
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
