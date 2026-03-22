import "./HomePage.css";
import studiLogo from "../assets/studiLogo.jpg";

export default function HomePage() {
  return (
    <div className="page-homepage">
      <div className="home-header">
        <img src={studiLogo} alt="Studi logo" className="home-header-logo" />
        <span className="home-header-title">studi</span>
      </div>

      <section className="home-streak-bar">
        <p className="streak-label">Current Streak</p>
        <h2 className="streak-value">0 days</h2>
      </section>

      <section className="home-main-card">
        <div className="home-user-info">
          <div>
            <h1 className="home-username">User</h1>
          </div>
        </div>

        <div className="home-user-stats">
           <div className="home-stat">
            <span className="home-stat-type">Rank</span>
            <span className="home-stat-data">#1</span>
          </div>
           <div className="home-stat">
            <span className="home-stat-type">Points</span>
            <span className="home-stat-data">0</span>
          </div>
           <div className="home-stat">
            <span className="home-stat-type">Study Time This Week</span>
            <span className="home-stat-data">0h 0m</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-type">Streak</span>
            <span className="home-stat-data">0 days</span>
          </div>
        </div>
      </section>

      <section className="home-study-session">
        <h2 className="home-study-heading">Study Session</h2>
        <div className="home-study-info">
          <p className="home-empty-state">No active study session.</p>
        </div>
      </section>
    </div>
  );
}