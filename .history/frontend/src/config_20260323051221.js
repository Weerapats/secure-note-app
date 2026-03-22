/**
 * API configuration
 * 
 * When using `npm run dev` (Vite), requests to /api are proxied to localhost:3001.
 * When opening index.html directly OR if the proxy isn't working,
 * we fall back to the direct backend URL.
 *
 * Change BACKEND_PORT below if your backend runs on a different port.
 */
const BACKEND_PORT = 3001

// Detect if we're running through Vite dev server or directly
const isDev = window.location.port === '5173' || window.location.port === '3000'


export const API_BASE =
import.meta.env.VITE_API_URL || '/api'
 