import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./Pages/LoginPage";
import Home from "./Pages/HomePage";
import Profile from "./Pages/ProfilePage";
import Sessions from "./Pages/SessionsPage";
import Leaderboard from "./Pages/LeaderboardPage";
import Friends from "./Pages/FriendsPage";

import BottomNav from "./components/BottomNav";
import TimerMiniWidget from "./components/TimerMiniWidget";
import { TimerProvider } from "./context/TimerContext";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("studi_token");
  return token ? children : <Navigate to="/" replace />;
}

function AppContent() {
  const location = useLocation();
  const hideNav = location.pathname === "/";
  // hide mini on login (no timer yet) and /sessions (full timer already there)
  const showMiniTimer = location.pathname !== "/" && location.pathname !== "/sessions";

  return (
    <div className="app-shell">
      {showMiniTimer && <TimerMiniWidget />}
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home"        element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/sessions"    element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/friends"     element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <TimerProvider>
        <AppContent />
      </TimerProvider>
    </Router>
  );
}
