import "./ProfilePage.css";

export default function ProfilePage() {
  return (
    <div className="page profile-page">
      <section className="profile-card">
        <h1 className="profile-header">Profile</h1>

        <div className="profile-info">
          <div className="profile-info-row">
            <span>Display Name</span>
            <span className="profile-info-data">User</span>
          </div>
          <div className="profile-info-row">
            <span>Username</span>
            <span className="profile-info-data">@UserStudy</span>
          </div>
          <div className="profile-info-row">
            <span>Location</span>
            <span className="profile-info-data">Gainesville</span>
          </div>
          <div className="profile-info-row">
            <span>Member Since</span>
            <span className="profile-info-data">March 2026</span>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <h2 className="profile-edit-heading">Edit Settings</h2>

        <form className="profile-edit-info">
          <div className="profile-edit-data">
            <label htmlFor="displayName">Display Name</label>
            <input id="displayName" type="text" placeholder="Update display name" />
          </div>

          <div className="profile-edit-data">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Update username" />
          </div>

          <div className="profile-edit-data">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Update password" />
          </div>

          <div className="profile-edit-data">
            <label htmlFor="location">Location</label>
            <input id="location" type="text" placeholder="Update location" />
          </div>

          <div className="profile-edit-data">
            <label htmlFor="visibility">Profile Visibility</label>
            <select id="visibility">
              <option>Public</option>
              <option>Friends Only</option>
              <option>Private</option>
            </select>
          </div>

          <button type="submit" className="profile-btn">
            Update Profile
          </button>
        </form>
      </section>

      <section className="profile-card">
        <h2 className="profile-stats-heading">Stats</h2>

        <div className="profile-stats-info">
          <div className="profile-stat-row">
            <span>Total Points</span>
            <span className="profile-stats-data">0</span>
          </div>
          <div className="profile-stat-row">
            <span>Current Streak</span>
            <span className="profile-stats-data">0 days</span>
          </div>
          <div className="profile-stat-row">
            <span>Longest Streak</span>
            <span className="profile-stats-data">0 days</span>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <h2 className="profile-achievements-heading">Achievements</h2>
        <ul className="profile-achievement-info">
          <li>No Achievements Yet. Start Studying to Unlock New Achievements!</li>
        </ul>
      </section>
    </div>
  );
}