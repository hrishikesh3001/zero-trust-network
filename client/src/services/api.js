import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (username, password, totpToken, recaptchaToken) =>
    api.post("/auth/login", { username, password, totpToken, recaptchaToken }),

  logout: () => api.post("/auth/logout"),

  getGuestToken: () => api.get("/auth/guest-token"),

  checkScan: (tokenId) => api.get(`/auth/check-scan/${tokenId}`),

  phoneVerify: (employeeId, totpToken, tokenId) =>
    api.post("/auth/phone-verify", { employeeId, totpToken, tokenId }),
};

export const vaultAPI = {
  getVaultData: () => api.get("/vault"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard"),
};

export default api;
