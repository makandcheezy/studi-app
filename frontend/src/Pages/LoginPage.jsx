import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function Login() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      setMessage("No account found. Please sign up first.");
      return;
    }

    if (username === storedUser.username && password === storedUser.password) {
      setMessage("");
      navigate("/home");
    } else {
      setMessage("Invalid username or password.");
    }
  };

  const handleSignUp = () => {
    if (username === "" || password === "" || confirmPassword === "") {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const user = { username, password };
    localStorage.setItem("user", JSON.stringify(user));

    setMessage("Account created! You can now log in.");
    setIsSignup(false);
    setConfirmPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isSignup ? "Create Account" : "Studi"}</h1>
        <div className="img"></div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isSignup && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        {!isSignup ? (
          <>
            <button className="button1" onClick={handleLogin}>
              Login
            </button>

            <button className="button2" onClick={() => {
              setMessage("");
              setIsSignup(true);
            }}>
              Sign Up
            </button>
          </>
        ) : (
          <>
            <button className="button1" onClick={handleSignUp}>
              Create Account
            </button>

            <button className="button2" onClick={() => {
              setMessage("");
              setIsSignup(false);
            }}>
              Back to Login
            </button>
          </>
        )}

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}