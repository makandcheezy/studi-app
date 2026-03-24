import { useState } from "react";
import StudyMethodTimer from "../components/StudyMethodTimer.jsx";
import "./SessionsPage.css";

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

function formatManualDuration(hours, minutes) {
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(" ");
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);

  const handleManualAdd = (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const sessionName = formData.get("sessionName")?.toString().trim();
    const subject = formData.get("subject")?.toString().trim();
    const hours = Number(formData.get("durationHours") ?? 0);
    const minutes = Number(formData.get("durationMinutes") ?? 0);
    const totalMinutes = hours * 60 + minutes;

    if (!sessionName || !subject || totalMinutes <= 0) return;

    const newSession = {
      id: Date.now(),
      sessionName,
      subject,
      durationHours: hours,
      durationMinutes: minutes,
      durationSeconds: totalMinutes * 60,
      durationLabel: formatManualDuration(hours, minutes),
      source: "manual",
    };

    setSessions((prev) => [newSession, ...prev]);
    e.target.reset();
  };

  const handleTimedAdd = (newSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  return (
    <div className="page sessions-page">
      <section className="sessions-card">
        <h1 className="sessions-header">Study Session</h1>
      </section>

      <div className="sessions-options-grid">
        <section className="sessions-card">
          <h2 className="sessions-add-session">Manual Session Entry</h2>
          <p className="sessions-muted">
            Add a session you already completed on your own.
          </p>

          <form className="sessions-create" onSubmit={handleManualAdd}>
            <div className="sessions-create-info">
              <label htmlFor="sessionName">Session Name</label>
              <input
                id="sessionName"
                name="sessionName"
                type="text"
                placeholder="e.g. Sprint 1 Presentation"
              />
            </div>

            <div className="sessions-create-info">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="e.g. Intro to SWE"
              />
            </div>

            <div className="sessions-create-info">
              <label>Duration</label>
              <div className="sessions-duration-grid">
                <select
                  id="durationHours"
                  name="durationHours"
                  className="sessions-method-select"
                  defaultValue="0"
                >
                  {HOUR_OPTIONS.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour} {hour === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>

                <select
                  id="durationMinutes"
                  name="durationMinutes"
                  className="sessions-method-select"
                  defaultValue="0"
                >
                  {MINUTE_OPTIONS.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute} {minute === 1 ? "minute" : "minutes"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="sessions-primary-btn">
              Add Session
            </button>
          </form>
        </section>

        <section className="sessions-card">
          <h2 className="sessions-add-session">Timed Study Method</h2>
          <p className="sessions-muted">
            Pick a study method and let Studi track the focus session for you.
          </p>
          <StudyMethodTimer onLogSession={handleTimedAdd} />
        </section>
      </div>

      <section className="sessions-card">
        <h2 className="sessions-recent-heading">Recent Sessions</h2>

        {sessions.length === 0 ? (
          <div className="sessions-empty-box">
            <p className="sessions-muted">No study sessions yet.</p>
            <p className="sessions-muted">Your added study sessions will appear here.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="sessions-list-item">
                <h3>{session.sessionName}</h3>
                <p>{session.subject}</p>
                <p>{session.durationLabel}</p>
                <p>{session.source === "manual" ? "Manual Entry" : session.source}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
