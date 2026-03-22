import "./SessionsPage.css";

export default function SessionsPage() {
  return (
    <div className="page sessions-page">
      <section className="sessions-card">
        <h1 className="sessions-header">Study Session</h1>
      </section>

      <section className="sessions-card">
        <h2 className="sessions-add-session">Add Study Session</h2>

        <form className="sessions-create">
          <div className="sessions-create-info">
            <label htmlFor="sessionName">Session Name</label>
            <input id="sessionName" type="text" placeholder="e.g. Sprint 1 Presentation" />
          </div>

          <div className="sessions-create-info">
            <label htmlFor="subject">Subject</label>
            <input id="subject" type="text" placeholder="e.g. Intro to SWE" />
          </div>

          <div className="sessions-create-info">
            <label htmlFor="duration">Duration</label>
            <input id="duration" type="text" placeholder="e.g. 1 hour 30 min" />
          </div>

          <button type="submit" className="sessions-primary-btn">
            Add Session
          </button>
        </form>
      </section>

      <section className="sessions-card">
        <h2 className="sessions-recent-heading">Recent Sessions</h2>

        <div className="sessions-empty-box">
          <p className="sessions-muted">No study sessions yet.</p>
          <p className="sessions-muted">Your added study sessions will appear here.</p>
        </div>
      </section>
    </div>
  );
}