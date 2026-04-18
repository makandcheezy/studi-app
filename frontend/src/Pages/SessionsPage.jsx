import { useState, useEffect } from "react";
import { createSession, getSessions } from "../services/api";
import StudyMethodTimer from "../components/StudyMethodTimer.jsx";
import { useTimer } from "../context/TimerContext";
import "./SessionsPage.css";

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);


export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastLoggedSession, clearLastLogged } = useTimer();

  useEffect(() => {
    getSessions().then((res) => {
      if (res && res.success) {
        setSessions(res.data.sessions);
      }
      setLoading(false);
    });
  }, []);

  // pick up sessions logged via the timer (full UI or mini widget)
  useEffect(() => {
    if (!lastLoggedSession) return;
    setSessions((prev) => [lastLoggedSession, ...prev]);
    clearLastLogged();
  }, [lastLoggedSession, clearLastLogged]);

  const handleManualAdd = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const subject = formData.get("subject")?.toString().trim();
    const hours = Number(formData.get("durationHours") ?? 0);
    const minutes = Number(formData.get("durationMinutes") ?? 0);
    const totalMinutes = hours * 60 + minutes;

    if (!subject || totalMinutes <= 0) return;

    const res = await createSession({ subject, durationMinutes: totalMinutes });
    if (res && res.success) {
      setSessions((prev) => [res.data.session, ...prev]);
      e.target.reset();
    }
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
          <StudyMethodTimer />
        </section>
      </div>

      <section className="sessions-card">
        <h2 className="sessions-recent-heading">Recent Sessions</h2>

        {loading ? (
          <p className="sessions-muted">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="sessions-empty-box">
            <p className="sessions-muted">No study sessions yet.</p>
            <p className="sessions-muted">Your added study sessions will appear here.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session._id} className="sessions-list-item">
                <h3>{session.subject}</h3>
                <p>{session.durationMinutes} min</p>
                {session.pointsEarned > 0 && (
                  <p style={{ color: "#2e7d71", fontWeight: 600 }}>
                    +{session.pointsEarned} XP
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
