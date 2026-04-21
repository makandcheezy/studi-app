import { useState, useEffect } from "react";
import { createSession, getSessions } from "../services/api";
import StudyMethodTimer from "../components/StudyMethodTimer.jsx";
import { useTimer } from "../context/timerUtils";
import "./SessionsPage.css";

const HOUR_OPTIONS = Array.from({ length: 13 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => index * 5);

const SESSION_LOCATIONS_KEY = "sessionLocations";

function getSavedSessionLocations() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_LOCATIONS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveSessionLocation(sessionId, location) {
  const existing = getSavedSessionLocations();
  existing[sessionId] = location;
  localStorage.setItem(SESSION_LOCATIONS_KEY, JSON.stringify(existing));
}
export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const { lastLoggedSession, clearLastLogged } = useTimer();
  useEffect(() => {
    getSessions().then((res) => {
      if (res && res.success) {
        const savedLocations = getSavedSessionLocations();
        const sessionsWithLocations = res.data.sessions.map((session) => ({
          ...session,
          location: session.location || savedLocations[session._id] || "",
        }));
        setSessions(sessionsWithLocations);
      }
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!lastLoggedSession) return;
    const savedLocations = getSavedSessionLocations();
    const sessionWithLocation = {
      ...lastLoggedSession,
      location:
        lastLoggedSession.location ||
        savedLocations[lastLoggedSession._id] ||
        "",
    };
    Promise.resolve().then(() => {
      setSessions((prev) => [sessionWithLocation, ...prev]);
      clearLastLogged();
    });
  }, [lastLoggedSession, clearLastLogged]);
  const handleManualAdd = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subject = formData.get("subject")?.toString().trim();
    const hours = Number(formData.get("durationHours") ?? 0);
    const minutes = Number(formData.get("durationMinutes") ?? 0);
    const totalMinutes = hours * 60 + minutes;
    if (!subject || totalMinutes <= 0) return;
    const trimmedLocation = location.trim();
    const res = await createSession({
      subject,
      durationMinutes: totalMinutes,
    });
    if (res && res.success) {
      const newSession = {
        ...res.data.session,
        location: trimmedLocation,
      };
      if (newSession._id && trimmedLocation) {
        saveSessionLocation(newSession._id, trimmedLocation);
      }
      setSessions((prev) => [newSession, ...prev]);
      e.target.reset();
      setLocation("");
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
              <label htmlFor="location">Location</label>
              <div className="sessions-location-row">
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g. Marston Library"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <button
                  type="button"
                  className="sessions-secondary-btn sessions-location-btn"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      alert("Geolocation is not supported.");
                      return;
                    }

                    navigator.geolocation.getCurrentPosition(
                      () => {
                        setLocation("Marston Library");
                      },
                      (error) => {
                        alert("Unable to get location: " + error.message);
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0,
                      }
                    );
                  }}
                >
                  Use Current Location
                </button>
              </div>
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
            <p className="sessions-muted">
              Your added study sessions will appear here.
            </p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session._id} className="sessions-list-item">
                <h3>{session.subject}</h3>
                <p>{session.durationMinutes} min</p>
                {session.location && <p>Location: {session.location}</p>}
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