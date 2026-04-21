const BASE_URL = "/api";

// ---- TOKEN HELPERS ----
export const getToken = () => localStorage.getItem("studi_token");
export const setToken = (token) => localStorage.setItem("studi_token", token);
export const removeToken = () => localStorage.removeItem("studi_token");

export function getTokenRole() {
  const token = localStorage.getItem("studi_token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role;
  } catch {
    return null;
  }
}

export const getRefreshToken = () => localStorage.getItem("studi_refresh_token");
export const setRefreshToken = (token) =>
  localStorage.setItem("studi_refresh_token", token);
export const removeRefreshToken = () =>
  localStorage.removeItem("studi_refresh_token");

// endpoints that must NEVER trigger the refresh retry path
const AUTH_ENDPOINTS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

// shared promise so concurrent 401s only trigger one refresh call
let refreshInFlight = null;

async function doRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json();
    if (!res.ok || !json?.success) return null;
    const newAccess = json.data?.accessToken;
    if (!newAccess) return null;
    setToken(newAccess);
    return newAccess;
  } catch {
    return null;
  }
}

function clearAndRedirect() {
  removeToken();
  removeRefreshToken();
  // hard redirect — api.js has no router context, and this forces a clean auth state
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

// ---- BASE REQUEST ----
async function request(endpoint, method = "GET", body) {
  const doFetch = async (token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  try {
    let res = await doFetch(getToken());

    // on 401, try to refresh once and retry (skip for auth endpoints themselves)
    if (res.status === 401 && !AUTH_ENDPOINTS.has(endpoint) && getRefreshToken()) {
      if (!refreshInFlight) {
        refreshInFlight = doRefresh().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;

      if (newToken) {
        res = await doFetch(newToken);
      } else {
        clearAndRedirect();
        return null;
      }
    }

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

// ---- DASHBOARD ----
export const getDashboard = () =>
  request("/users/me/dashboard");

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

// ---- FRIENDS ----
export const searchUsers = (query) =>
  request(`/friends/search?q=${encodeURIComponent(query)}`);

export const getFriends = () =>
  request("/friends");

export const getFriendRequests = () =>
  request("/friends/requests");

export const getFriendActivity = (page = 1, limit = 20) =>
  request(`/friends/activity?page=${page}&limit=${limit}`);

export const sendFriendRequest = (recipientId) =>
  request("/friends/request", "POST", { recipientId });

export const acceptFriendRequest = (friendshipId) =>
  request(`/friends/${friendshipId}/accept`, "PATCH");

export const declineFriendRequest = (friendshipId) =>
  request(`/friends/${friendshipId}/decline`, "PATCH");

export const removeFriend = (friendshipId) =>
  request(`/friends/${friendshipId}`, "DELETE");

// ---- ADMIN ----
export const getAdminMetrics = () => request("/admin/metrics");
export const getAdminAnalytics = () => request("/admin/analytics");
