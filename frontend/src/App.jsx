import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Login from "./Pages/LoginPage";
import Home from "./Pages/HomePage";
import Profile from "./Pages/ProfilePage";
import Sessions from "./Pages/SessionsPage";
import Leaderboard from "./Pages/LeaderboardPage";
import Friends from "./Pages/FriendsPage";

import BottomNav from "./components/BottomNav";
import "./App.css";

function AppContent() {
  const location = useLocation();
  const hideNav = location.pathname === "/";

  return (
    <div className="app-shell">
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/friends" element={<Friends />} />
        </Routes>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
