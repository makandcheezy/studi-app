// timer context — persists timer state across navigation and page refreshes
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createSession,
  getActiveSession,
  pauseSession as apiPause,
  resumeSession as apiResume,
  endSession as apiEnd,
} from "../services/api";

const STORAGE_KEY = "studi_timer_v1";

export const STUDY_METHODS = [
  { id: "dev-phase", label: "Dev Phase", focusMinutes: 0.5, breakMinutes: 10 / 60 },
  { id: "pomodoro", label: "Pomodoro", focusMinutes: 25, breakMinutes: 5 },
  { id: "extended-pomodoro", label: "Extended Pomodoro", focusMinutes: 50, breakMinutes: 10 },
  { id: "52-17", label: "52-17 Rule", focusMinutes: 52, breakMinutes: 17 },
  { id: "classic-hour", label: "Classic Hour", focusMinutes: 60, breakMinutes: 10 },
];

const DEFAULT_METHOD_ID = "pomodoro";

export function getMethodById(id) {
  return STUDY_METHODS.find((m) => m.id === id) ?? STUDY_METHODS[0];
}

function phaseSeconds(phase, method) {
  return Math.round((phase === "focus" ? method.focusMinutes : method.breakMinutes) * 60);
}

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSnapshot(snapshot) {
  try {
    if (snapshot) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const initialState = {
  backendSessionId: null,
  subject: "",
  sessionName: "",
  methodId: DEFAULT_METHOD_ID,
  phase: "focus",
  isRunning: false,
  phaseEndAt: null,
  phaseRemainingSec: null,
  lastLoggedSession: null,
};

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // hydrate from localStorage + backend on mount
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const snap = loadSnapshot();
      if (!snap) {
        setHydrated(true);
        return;
      }

      // verify backend session is still active
      if (snap.backendSessionId) {
        const res = await getActiveSession();
        if (cancelled) return;
        const active = res?.success ? res.data?.session : null;
        if (!active || active._id !== snap.backendSessionId) {
          saveSnapshot(null);
          setHydrated(true);
          return;
        }
      }

      setState((prev) => ({ ...prev, ...snap, lastLoggedSession: null }));
      setHydrated(true);
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // persist relevant slice whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    if (!state.backendSessionId && !state.isRunning && state.phase === "focus" && !state.subject) {
      saveSnapshot(null);
      return;
    }
    saveSnapshot({
      backendSessionId: state.backendSessionId,
      subject: state.subject,
      sessionName: state.sessionName,
      methodId: state.methodId,
      phase: state.phase,
      isRunning: state.isRunning,
      phaseEndAt: state.phaseEndAt,
      phaseRemainingSec: state.phaseRemainingSec,
    });
  }, [hydrated, state]);

  // ticking interval — recomputes time from phaseEndAt each second
  useEffect(() => {
    if (!state.isRunning || state.phaseEndAt == null) return;

    const id = setInterval(() => {
      const now = Date.now();
      const current = stateRef.current;
      if (!current.isRunning || current.phaseEndAt == null) return;

      if (now >= current.phaseEndAt) {
        const nextPhase = current.phase === "focus" ? "break" : "focus";
        const method = getMethodById(current.methodId);
        const nextDurationMs = phaseSeconds(nextPhase, method) * 1000;
        setState((prev) => ({
          ...prev,
          phase: nextPhase,
          phaseEndAt: Date.now() + nextDurationMs,
        }));
      } else {
        // force rerender so consumers see updated derived timeRemaining
        setState((prev) => ({ ...prev }));
      }
    }, 1000);

    return () => clearInterval(id);
  }, [state.isRunning, state.phaseEndAt]);

  const derivedTimeRemaining = useMemo(() => {
    const method = getMethodById(state.methodId);
    if (state.isRunning && state.phaseEndAt != null) {
      return Math.max(0, Math.ceil((state.phaseEndAt - Date.now()) / 1000));
    }
    if (state.phaseRemainingSec != null) {
      return state.phaseRemainingSec;
    }
    return phaseSeconds(state.phase, method);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const setSubject = useCallback((value) => {
    setState((prev) => ({ ...prev, subject: value }));
  }, []);

  const setSessionName = useCallback((value) => {
    setState((prev) => ({ ...prev, sessionName: value }));
  }, []);

  const changeMethod = useCallback(async (nextId) => {
    const current = stateRef.current;
    if (current.backendSessionId) {
      await apiEnd(current.backendSessionId);
    }
    const method = getMethodById(nextId);
    setState((prev) => ({
      ...prev,
      methodId: nextId,
      backendSessionId: null,
      isRunning: false,
      phase: "focus",
      phaseEndAt: null,
      phaseRemainingSec: phaseSeconds("focus", method),
    }));
  }, []);

  const start = useCallback(async () => {
    const current = stateRef.current;
    const method = getMethodById(current.methodId);
    let sessionId = current.backendSessionId;

    if (!sessionId) {
      const res = await createSession({ subject: current.subject.trim() });
      if (!res?.success) return;
      sessionId = res.data.session._id;
    } else {
      await apiResume(sessionId);
    }

    const remaining =
      current.phaseRemainingSec != null
        ? current.phaseRemainingSec
        : phaseSeconds(current.phase, method);

    setState((prev) => ({
      ...prev,
      backendSessionId: sessionId,
      isRunning: true,
      phaseEndAt: Date.now() + remaining * 1000,
      phaseRemainingSec: null,
    }));
  }, []);

  const pause = useCallback(async () => {
    const current = stateRef.current;
    if (current.backendSessionId) {
      await apiPause(current.backendSessionId);
    }
    const remaining =
      current.phaseEndAt != null
        ? Math.max(0, Math.ceil((current.phaseEndAt - Date.now()) / 1000))
        : phaseSeconds(current.phase, getMethodById(current.methodId));

    setState((prev) => ({
      ...prev,
      isRunning: false,
      phaseEndAt: null,
      phaseRemainingSec: remaining,
    }));
  }, []);

  const reset = useCallback(async () => {
    const current = stateRef.current;
    if (current.backendSessionId) {
      await apiEnd(current.backendSessionId);
    }
    const method = getMethodById(current.methodId);
    setState((prev) => ({
      ...prev,
      backendSessionId: null,
      isRunning: false,
      phase: "focus",
      phaseEndAt: null,
      phaseRemainingSec: phaseSeconds("focus", method),
    }));
  }, []);

  const finishAndLog = useCallback(async () => {
    const current = stateRef.current;
    if (!current.backendSessionId) return;

    const res = await apiEnd(current.backendSessionId);
    const logged = res?.success ? res.data.session : null;
    const method = getMethodById(current.methodId);

    setState((prev) => ({
      ...prev,
      backendSessionId: null,
      isRunning: false,
      phase: "focus",
      phaseEndAt: null,
      phaseRemainingSec: phaseSeconds("focus", method),
      subject: "",
      sessionName: "",
      lastLoggedSession: logged,
    }));
  }, []);

  const clearLastLogged = useCallback(() => {
    setState((prev) => ({ ...prev, lastLoggedSession: null }));
  }, []);

  const hasActiveTimer = Boolean(state.backendSessionId) || state.isRunning;

  const value = useMemo(
    () => ({
      subject: state.subject,
      sessionName: state.sessionName,
      methodId: state.methodId,
      selectedMethod: getMethodById(state.methodId),
      phase: state.phase,
      isRunning: state.isRunning,
      backendSessionId: state.backendSessionId,
      timeRemaining: derivedTimeRemaining,
      hasActiveTimer,
      lastLoggedSession: state.lastLoggedSession,
      setSubject,
      setSessionName,
      changeMethod,
      start,
      pause,
      reset,
      finishAndLog,
      clearLastLogged,
    }),
    [
      state,
      derivedTimeRemaining,
      hasActiveTimer,
      setSubject,
      setSessionName,
      changeMethod,
      start,
      pause,
      reset,
      finishAndLog,
      clearLastLogged,
    ]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return ctx;
}

export function formatSeconds(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
