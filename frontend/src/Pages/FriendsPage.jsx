import "./FriendsPage.css";

export default function FriendsPage() {
  return (
    <div className="page friends-page">
      <section className="friends-card">
        <h1 className="friends-header">Friends</h1>
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Search Friends</h2>
        <p className="friends-muted">Friend search and requests will appear here.</p>
      </section>
    </div>
  );
}