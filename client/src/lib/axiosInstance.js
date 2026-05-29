import axios from "axios";
import { BASE_URL } from "./config";

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

export default axiosInstance;
