import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./Pages/LoginPage";
import Home from "./Pages/HomePage";
import Profile from "./Pages/ProfilePage";
import Sessions from "./Pages/SessionsPage";
import Leaderboard from "./Pages/LeaderboardPage";
import Friends from "./Pages/FriendsPage";
import AdminDashboard from "./Pages/AdminDashboardPage";

import BottomNav from "./components/BottomNav";
import TimerMiniWidget from "./components/TimerMiniWidget";
import { TimerProvider } from "./context/TimerContext";
import { getTokenRole } from "./services/api";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("studi_token");
  if (!token) return <Navigate to="/" replace />;
  if (getTokenRole() === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("studi_token");
  if (!token) return <Navigate to="/" replace />;
  if (getTokenRole() !== "admin") return <Navigate to="/home" replace />;
  return children;
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";
  const hideNav = location.pathname === "/" || isAdmin;
  // hide mini on login (no timer yet), /sessions (full timer already there), and /admin
  const showMiniTimer = location.pathname !== "/" && location.pathname !== "/sessions" && !isAdmin;

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
          <Route path="/admin"       element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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
