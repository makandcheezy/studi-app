// floating timer pill shown on every tab while a session is active
import { useNavigate } from "react-router-dom";
import { formatSeconds, useTimer } from "../context/TimerContext";
import "./TimerMiniWidget.css";

export default function TimerMiniWidget() {
  const navigate = useNavigate();
  const {
    hasActiveTimer,
    phase,
    isRunning,
    timeRemaining,
    subject,
    pause,
    start,
    finishAndLog,
  } = useTimer();

  if (!hasActiveTimer) return null;

  const go = () => navigate("/sessions");

  const stop = (event) => event.stopPropagation();

  return (
    <div
      className="timer-mini"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go();
      }}
    >
      <div className="timer-mini-header">
        <span className="timer-mini-phase">
          {phase === "focus" ? "Focus" : "Break"}
        </span>
        <span className={`timer-mini-badge${isRunning ? "" : " paused"}`}>
          {isRunning ? "Running" : "Paused"}
        </span>
      </div>

      <div className="timer-mini-time">{formatSeconds(timeRemaining)}</div>

      {subject ? <div className="timer-mini-subject">{subject}</div> : null}

      <div className="timer-mini-controls" onClick={stop}>
        {isRunning ? (
          <button type="button" className="timer-mini-btn" onClick={pause}>
            Pause
          </button>
        ) : (
          <button type="button" className="timer-mini-btn" onClick={start}>
            Resume
          </button>
        )}
        <button
          type="button"
          className="timer-mini-btn secondary"
          onClick={finishAndLog}
        >
          Finish
        </button>
      </div>
    </div>
  );
}
