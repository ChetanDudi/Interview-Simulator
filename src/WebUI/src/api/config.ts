// In production set VITE_API_URL to your Render backend URL
// e.g. https://interview-simulator-api.onrender.com
export const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
