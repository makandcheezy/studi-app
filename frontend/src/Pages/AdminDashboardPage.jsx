import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAdminMetrics, getAdminAnalytics, removeToken, removeRefreshToken } from "../services/api";
import "./AdminDashboardPage.css";

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatShortDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminMetrics(), getAdminAnalytics()]).then(([m, a]) => {
      if (ignore) return;
      if (m?.success && a?.success) {
        setMetrics(m.data);
        setAnalytics(a.data);
      } else {
        setError("Failed to load admin data.");
      }
      setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  function handleLogout() {
    removeToken();
    removeRefreshToken();
    navigate("/");
  }

  const chartData = analytics?.dailyActiveUsers?.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  })) ?? [];

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {loading && <p className="admin-loading">Loading...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="admin-metrics-grid">
            <div className="admin-metric-card">
              <p className="metric-label">Total Users</p>
              <h2 className="metric-value">{metrics.totalUsers}</h2>
            </div>
            <div className="admin-metric-card">
              <p className="metric-label">Active (30d)</p>
              <h2 className="metric-value">{metrics.activeUsers}</h2>
            </div>
            <div className="admin-metric-card">
              <p className="metric-label">Total Sessions</p>
              <h2 className="metric-value">{metrics.totalSessions}</h2>
            </div>
            <div className="admin-metric-card">
              <p className="metric-label">Total Study Time</p>
              <h2 className="metric-value">{formatMinutes(metrics.totalStudyMinutes)}</h2>
            </div>
          </section>

          <section className="admin-card">
            <h3 className="admin-section-title">Daily Active Users — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8efee" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6e7b87" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6e7b87" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e8efee", fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#2e7d71"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#2e7d71" }}
                  name="Active Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="admin-card admin-two-col">
            <div className="admin-stat-block">
              <p className="metric-label">Avg Session Length</p>
              <h2 className="metric-value">{formatMinutes(analytics.avgSessionLength)}</h2>
            </div>
          </section>

          <section className="admin-card">
            <h3 className="admin-section-title">Top 5 Users by Points</h3>
            <ol className="admin-top-users">
              {analytics.topUsers.map((u, i) => (
                <li key={u._id} className="admin-top-user-row">
                  <span className="top-user-rank">{i + 1}</span>
                  <span className="top-user-name">{u.displayName}</span>
                  <span className="top-user-stats">
                    {u.totalPoints.toLocaleString()} pts &nbsp;·&nbsp; {u.currentStreak}d streak
                  </span>
                </li>
              ))}
              {analytics.topUsers.length === 0 && (
                <li className="admin-empty">No users yet.</li>
              )}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
