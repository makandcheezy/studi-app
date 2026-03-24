import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, setToken } from "../services/api";
import "./LoginPage.css";

export default function Login() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setMessage("");
    const result = await login({ email, password });
    setIsLoading(false);
    if (result?.success) {
      setToken(result.data.accessToken);
      navigate("/home");
    } else {
      setMessage(result?.error?.message || "Login failed. Please try again.");
    }
  };

  const handleSignUp = async () => {
    if (!email || !displayName || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setMessage("");
    const result = await register({ email, password, displayName });
    setIsLoading(false);
    if (result?.success) {
      setToken(result.data.accessToken);
      navigate("/home");
    } else {
      setMessage(result?.error?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isSignup ? "Create Account" : "Studi"}</h1>
        <div className="img"></div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {isSignup && (
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}

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
            <button className="button1" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
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
            <button className="button1" onClick={handleSignUp} disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
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
