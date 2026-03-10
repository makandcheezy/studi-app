import { useState } from "react"
import "./LoginPage.css"

export default function Login() {

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleLogin = () => {
    if (username === "" || password === "") {
      setMessage("Please enter a username and password.")
      return
    }

    setMessage(`Logging in as ${username}...`)
  }

  const handleSignUp = () => {
    setMessage("Sign up clicked.")
  }

  return (
    <div className="login-page">

      <div className="login-card">
        <h1>Studi</h1>
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

        <button className="button1" onClick={handleLogin}>
          Login
        </button>

        <button className="button2" onClick={handleSignUp}>
          Sign Up
        </button>

        {message && <p>{message}</p>}

      </div>

    </div>
  )
}