// Use VITE_API_URL from env, or default to an empty string so it uses relative paths (same-origin)
export const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:3600" : "");
