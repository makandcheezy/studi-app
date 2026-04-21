import { useState } from "react";
import {
  STUDY_METHODS,
  formatSeconds,
  useTimer,
} from "../context/timerUtils";

function formatMethodDuration(minutesValue) {
  if (minutesValue < 1) {
    return `${Math.round(minutesValue * 60)} sec`;
  }
  return `${minutesValue} min`;
}
export default function StudyMethodTimer() {
  const {
    subject,
    sessionName,
    methodId,
    phase,
    isRunning,
    timeRemaining,
    backendSessionId,
    hasActiveTimer,
    setSubject,
    setSessionName,
    changeMethod,
    start,
    pause,
    reset,
    finishAndLog,
  } = useTimer();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [timedLocation, setTimedLocation] = useState("");
  const handleResetClick = () => {
    if (!hasActiveTimer && phase === "focus") {
      reset();
      return;
    }
    setShowResetConfirm(true);
  };
  const confirmReset = async () => {
    await reset();
    setShowResetConfirm(false);
  };
  return (
    <div className="sessions-create">
      <div className="sessions-create-info">
        <label htmlFor="timedSessionName">Session Name</label>
        <input
          id="timedSessionName"
          type="text"
          placeholder="e.g. SWE Sprint 2"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>

      <div className="sessions-create-info">
        <label htmlFor="timedSubject">Subject</label>
        <input
          id="timedSubject"
          type="text"
          placeholder="e.g. Intro to SWE"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="sessions-create-info">
        <label htmlFor="timedLocation">Location</label>
        <div className="sessions-location-row">
          <input
            id="timedLocation"
            name="timedLocation"
            type="text"
            placeholder="e.g. Marston Library"
            value={timedLocation}
            onChange={(e) => setTimedLocation(e.target.value)}
          />
          <button
            type="button"
            className="sessions-secondary-btn sessions-location-btn"
            onClick={() => {
              if (!navigator.geolocation) {
                alert("Geolocation not available");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                () => {
                  setTimedLocation("Marston Library");
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
        <label htmlFor="studyMethod">Study Method (Focus/Break)</label>
        <select
          id="studyMethod"
          value={methodId}
          onChange={(e) => changeMethod(e.target.value)}
          className="sessions-method-select"
        >
          {STUDY_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label} ({formatMethodDuration(method.focusMinutes)}/
              {formatMethodDuration(method.breakMinutes)})
            </option>
          ))}
        </select>
      </div>

      <div className="sessions-timer-status">
        <p>
          <strong>Phase:</strong> {phase === "focus" ? "Focus" : "Break"}
        </p>
        <p>
          <strong>Time Remaining:</strong> {formatSeconds(timeRemaining)}
        </p>
      </div>

      <div className="sessions-timer-controls">
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!subject.trim() || isRunning}
          onClick={start}
        >
          {backendSessionId && !isRunning ? "Resume" : "Start"}
        </button>
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!isRunning}
          onClick={pause}
        >
          Pause
        </button>
        <button
          type="button"
          className="sessions-primary-btn"
          onClick={handleResetClick}
        >
          Reset
        </button>
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!backendSessionId}
          onClick={() => finishAndLog(timedLocation.trim())}
        >
          Finish & Log
        </button>
      </div>
      {showResetConfirm ? (
        <div className="sessions-reset-confirm" role="alert">
          <p>Reset this timer?</p>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>
            If you reset now, session progress will be lost.
          </p>
          <div className="sessions-reset-confirm-actions">
            <button
              type="button"
              className="sessions-primary-btn"
              onClick={confirmReset}
            >
              Yes, reset
            </button>
            <button
              type="button"
              className="sessions-secondary-btn"
              onClick={() => setShowResetConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}