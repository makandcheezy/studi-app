const BASE_URL = "/api";

// ---- TOKEN HELPERS ----
export const getToken = () => localStorage.getItem("studi_token");
export const setToken = (token) => localStorage.setItem("studi_token", token);
export const removeToken = () => localStorage.removeItem("studi_token");

// ---- BASE REQUEST ----
async function request(endpoint, method = "GET", body) {
  try {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

export default request;

// ---- AUTH ----
export const login = ({ email, password }) =>
  request("/auth/login", "POST", { email, password });

export const register = ({ email, password, displayName }) =>
  request("/auth/register", "POST", { email, password, displayName });

export const logout = () => request("/auth/logout", "POST", {});

// ---- SESSIONS ----
export const createSession = (sessionData) =>
  request("/sessions", "POST", sessionData);

export const getSessions = () =>
  request("/sessions");

export const getActiveSession = () =>
  request('/sessions/active');

export const pauseSession = (id) =>
  request(`/sessions/${id}/pause`, 'PATCH');

export const resumeSession = (id) =>
  request(`/sessions/${id}/resume`, 'PATCH');

export const endSession = (id) =>
  request(`/sessions/${id}/end`, 'PATCH');

// ---- LEADERBOARD ----
export const getLeaderboard = (period = "weekly", page = 1, limit = 20) =>
  request(`/leaderboard?period=${period}&page=${page}&limit=${limit}`);
