import { useEffect, useMemo, useState } from "react";
import {
  createSession,
  pauseSession as apiPause,
  resumeSession as apiResume,
  endSession as apiEnd,
} from "../services/api";

const STUDY_METHODS = [
  { id: "dev-phase", label: "Dev Phase", focusMinutes: 0.5, breakMinutes: 10 / 60 },
  { id: "pomodoro", label: "Pomodoro", focusMinutes: 25, breakMinutes: 5 },
  { id: "extended-pomodoro", label: "Extended Pomodoro", focusMinutes: 50, breakMinutes: 10 },
  { id: "52-17", label: "52-17 Rule", focusMinutes: 52, breakMinutes: 17 },
  { id: "classic-hour", label: "Classic Hour", focusMinutes: 60, breakMinutes: 10 },
];

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatMethodDuration(minutesValue) {
  if (minutesValue < 1) {
    return `${Math.round(minutesValue * 60)} sec`;
  }

  return `${minutesValue} min`;
}

export default function StudyMethodTimer({ onLogSession }) {
  const [sessionName, setSessionName] = useState("");
  const [subject, setSubject] = useState("");
  const [methodId, setMethodId] = useState("pomodoro");
  const [phase, setPhase] = useState("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [backendSessionId, setBackendSessionId] = useState(null);
  const defaultMethod =
    STUDY_METHODS.find((method) => method.id === "pomodoro") ?? STUDY_METHODS[0];

  const selectedMethod = useMemo(
    () => STUDY_METHODS.find((method) => method.id === methodId) ?? STUDY_METHODS[0],
    [methodId]
  );

  const getPhaseSeconds = (currentPhase, method) =>
    Math.round(
      (currentPhase === "focus" ? method.focusMinutes : method.breakMinutes) * 60
    );

  const [timeRemaining, setTimeRemaining] = useState(() =>
    getPhaseSeconds("focus", defaultMethod)
  );

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (phase === "focus") {
            setPhase("break");
            return getPhaseSeconds("break", selectedMethod);
          }

          setPhase("focus");
          return getPhaseSeconds("focus", selectedMethod);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, phase, selectedMethod]);

  const resetTimerState = async () => {
    if (backendSessionId) {
      await apiEnd(backendSessionId);
      setBackendSessionId(null);
    }
    setShowResetConfirm(false);
    setIsRunning(false);
    setPhase("focus");
    setTimeRemaining(getPhaseSeconds("focus", selectedMethod));
  };

  const handleResetClick = () => {
    const hasActiveTimer =
      isRunning ||
      phase !== "focus" ||
      timeRemaining !== getPhaseSeconds("focus", selectedMethod);

    if (!hasActiveTimer) {
      resetTimerState();
      return;
    }

    setShowResetConfirm(true);
  };

  const handleMethodChange = async (event) => {
    const nextMethodId = event.target.value;
    const nextMethod =
      STUDY_METHODS.find((method) => method.id === nextMethodId) ?? STUDY_METHODS[0];

    if (backendSessionId) {
      await apiEnd(backendSessionId);
      setBackendSessionId(null);
    }

    setMethodId(nextMethodId);
    setShowResetConfirm(false);
    setIsRunning(false);
    setPhase("focus");
    setTimeRemaining(getPhaseSeconds("focus", nextMethod));
  };

  const handleLogSession = async () => {
    if (!backendSessionId) return;

    const res = await apiEnd(backendSessionId);
    if (res && res.success) {
      onLogSession(res.data.session);
    }

    setBackendSessionId(null);
    setSessionName("");
    setSubject("");
    setShowResetConfirm(false);
    setIsRunning(false);
    setPhase("focus");
    setTimeRemaining(getPhaseSeconds("focus", selectedMethod));
  };

  return (
    <div className="sessions-create">
      <div className="sessions-create-info">
        <label htmlFor="timedSessionName">Session Name</label>
        <input
          id="timedSessionName"
          type="text"
          placeholder="e.g. Cramming for Humanities Exam"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>

      <div className="sessions-create-info">
        <label htmlFor="timedSubject">Subject</label>
        <input
          id="timedSubject"
          type="text"
          placeholder="e.g. Basket Weaving 101"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="sessions-create-info">
        <label htmlFor="studyMethod">Study Method (Focus/Break)</label>
        <select
          id="studyMethod"
          value={methodId}
          onChange={handleMethodChange}
          className="sessions-method-select"
        >
          {STUDY_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label} ({formatMethodDuration(method.focusMinutes)}/{formatMethodDuration(method.breakMinutes)})
            </option>
          ))}
        </select>
      </div>

      <div className="sessions-timer-status">
        <p><strong>Phase:</strong> {phase === "focus" ? "Focus" : "Break"}</p>
        <p><strong>Time Remaining:</strong> {formatSeconds(timeRemaining)}</p>
      </div>

      <div className="sessions-timer-controls">
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!subject.trim()}
          onClick={async () => {
            if (!backendSessionId) {
              // first start — create backend session
              const res = await createSession({ subject: subject.trim() });
              if (res && res.success) {
                setBackendSessionId(res.data.session._id);
              }
            } else {
              // resume from pause
              await apiResume(backendSessionId);
            }
            setIsRunning(true);
          }}
        >
          {backendSessionId && !isRunning ? "Resume" : "Start"}
        </button>
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!isRunning}
          onClick={async () => {
            if (backendSessionId) {
              await apiPause(backendSessionId);
            }
            setIsRunning(false);
          }}
        >
          Pause
        </button>
        <button type="button" className="sessions-primary-btn" onClick={handleResetClick}>
          Reset
        </button>
        <button
          type="button"
          className="sessions-primary-btn"
          disabled={!backendSessionId}
          onClick={handleLogSession}
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
              onClick={resetTimerState}
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
