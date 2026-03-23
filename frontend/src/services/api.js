const BASE_URL = "http://localhost:5050/api";

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