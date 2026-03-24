import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/home"
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        Home
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        Profile
      </NavLink>

      <NavLink
        to="/sessions"
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        Study Sessions
      </NavLink>

      <NavLink
        to="/leaderboard"
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        Leaderboard
      </NavLink>

      <NavLink
        to="/friends"
        className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
      >
        Friends
      </NavLink>
    </nav>
  );
}