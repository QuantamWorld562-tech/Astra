import axios from "axios";
import { BASE_URL } from "./config";
import { store } from "../redux/store";
import { setToken, logout } from "../redux/authSlice";

// A single axios instance used across the entire app.
// The request interceptor reads the token from localStorage at the moment
// each request is made — this avoids the PersistGate timing issue where
// axios.defaults gets set before Redux has finished rehydrating.
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  // Read persisted Redux state directly from localStorage
  try {
    const persisted = localStorage.getItem("persist:root");
    if (persisted) {
      const root = JSON.parse(persisted);
      const auth = JSON.parse(root.auth);
      const token = auth?.token;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
    // if parsing fails, just send the request without the header
  }
  return config;
});

// Response interceptor — if any request gets a 401, try to silently refresh
// the access token using the httpOnly refreshToken cookie, then retry once.
// If refresh also fails, clear auth state and redirect to login.
let isRefreshing = false;
let pendingQueue = []; // requests waiting while a refresh is in flight

const processQueue = (error, token = null) => {
  pendingQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401s that haven't been retried yet.
    // Skip the refresh endpoint itself to avoid infinite loops.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh")
    ) {
      if (isRefreshing) {
        // Another refresh is already in flight — queue this request until done.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.get(`${BASE_URL}/api/auth/refresh`, {
          withCredentials: true,
        });

        if (refreshRes.data.success) {
          const newToken = refreshRes.data.token;

          // Persist the new token in Redux (which redux-persist will sync to localStorage)
          store.dispatch(setToken(newToken));

          // Update the auth header for all queued and current requests
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — session is dead, log the user out
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
