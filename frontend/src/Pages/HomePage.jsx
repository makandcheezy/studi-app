import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import studiLogo from "../assets/studiLogo.jpg";
import "./HomePage.css";

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getDashboard().then((res) => {
      if (ignore) return;
      if (res?.success) {
        setDashboard(res.data);
      } else {
        setDashboard(null);
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const profile = dashboard?.profile;
  const playerStats = dashboard?.playerStats;
  const studyStats = dashboard?.studyStats;
  const activeSession = dashboard?.activeSession;
  const recentSessions = dashboard?.recentSessions || [];

  return (
    <div className="page-homepage">
      <div className="home-header">
        <img src={studiLogo} alt="Studi logo" className="home-header-logo" />
        <span className="home-header-title">studi</span>
      </div>

      <section className="home-streak-bar">
        <p className="streak-label">Current Streak</p>
        <h2 className="streak-value">
          {loading ? "Loading..." : `${playerStats?.currentStreak ?? 0} days`}
        </h2>
      </section>

      <section className="home-main-card">
        <div className="home-user-info">
          <div>
            <h1 className="home-username">
              {loading ? "Loading..." : profile?.displayName || "User"}
            </h1>
            {!loading && profile ? (
              <p className="home-subtitle">Member since {formatDate(profile.memberSince)}</p>
            ) : null}
          </div>
        </div>

        <div className="home-user-stats">
           <div className="home-stat">
            <span className="home-stat-type">Rank</span>
            <span className="home-stat-data">
              {loading ? "--" : playerStats?.rank ? `#${playerStats.rank}` : "Unranked"}
            </span>
          </div>
           <div className="home-stat">
            <span className="home-stat-type">Points</span>
            <span className="home-stat-data">{loading ? "--" : playerStats?.totalPoints ?? 0}</span>
          </div>
           <div className="home-stat">
            <span className="home-stat-type">Study Time This Week</span>
            <span className="home-stat-data">
              {loading ? "--" : formatMinutes(studyStats?.weeklyStudyMinutes ?? 0)}
            </span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Streak</span>
            <span className="home-stat-data">
              {loading ? "--" : `${playerStats?.currentStreak ?? 0} days`}
            </span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Longest Streak</span>
            <span className="home-stat-data">
              {loading ? "--" : `${playerStats?.longestStreak ?? 0} days`}
            </span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Total Study Time</span>
            <span className="home-stat-data">
              {loading ? "--" : formatMinutes(studyStats?.totalStudyMinutes ?? 0)}
            </span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Completed Sessions</span>
            <span className="home-stat-data">
              {loading ? "--" : studyStats?.totalSessions ?? 0}
            </span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Friends</span>
            <span className="home-stat-data">
              {loading ? "--" : playerStats?.friendCount ?? 0}
            </span>
          </div>
        </div>
      </section>

      <section className="home-study-session">
        <h2 className="home-study-heading">Current Session</h2>
        <div className="home-study-info">
          {loading ? (
            <p className="home-empty-state">Loading dashboard...</p>
          ) : activeSession ? (
            <div className="home-session-card">
              <h3>{activeSession.subject}</h3>
              <p>Status: {activeSession.status}</p>
              <p>Started: {formatDate(activeSession.startTime)}</p>
            </div>
          ) : (
            <p className="home-empty-state">No active study session.</p>
          )}
        </div>
      </section>

      <section className="home-study-session">
        <h2 className="home-study-heading">Recent Performance</h2>
        <div className="home-study-info">
          {loading ? (
            <p className="home-empty-state">Loading recent sessions...</p>
          ) : recentSessions.length === 0 ? (
            <p className="home-empty-state">No completed study sessions yet.</p>
          ) : (
            <div className="home-session-list">
              {recentSessions.map((session) => (
                <div key={session.id} className="home-session-card">
                  <h3>{session.subject}</h3>
                  <p>{session.durationMinutes} min</p>
                  <p>{session.pointsEarned} XP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
