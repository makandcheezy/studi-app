const BASE_URL = "/api";

async function request(endpoint, method = "GET", body) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

export default request;

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