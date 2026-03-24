import { useState, useEffect } from "react";
import { getLeaderboard } from "../services/api";
import "./Leaderboard.css";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "allTime", label: "All Time" },
];

function rankColor(rank) {
  if (rank === 1) return "#d4a843";
  if (rank === 2) return "#8a8a8a";
  if (rank === 3) return "#b87333";
  return "#2e7d71";
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("weekly");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getLeaderboard(period).then((res) => {
      if (ignore) return;
      if (res && res.success) {
        setEntries(res.data.entries);
      } else {
        setEntries([]);
      }
      setLoading(false);
    });

    return () => { ignore = true; };
  }, [period]);

  return (
    <div className="page leaderboard-page">
      <section className="leaderboard-card">
        <h1 className="leaderboard-header">Leaderboard</h1>
      </section>

      <section className="leaderboard-card">
        <div className="leaderboard-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`leaderboard-tab ${period === p.key ? "active" : ""}`}
              onClick={() => { setLoading(true); setPeriod(p.key); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="leaderboard-muted">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">
            <p className="leaderboard-muted">No entries for this period.</p>
          </div>
        ) : (
          <div className="leaderboard-list">
            {entries.map((entry) => (
              <div key={entry.userId} className="leaderboard-row">
                <span
                  className="leaderboard-rank"
                  style={{ color: rankColor(entry.rank) }}
                >
                  #{entry.rank}
                </span>
                <span className="leaderboard-name">{entry.displayName}</span>
                <span className="leaderboard-points">
                  {entry.totalPoints.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
