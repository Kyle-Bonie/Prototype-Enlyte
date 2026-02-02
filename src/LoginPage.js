import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import apricusLogo from "./assets/ApricusLogo.png";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (username === "teamLead" && password === "we") {
      onLoginSuccess({ username, role: "teamLead" });
      setError("");
      navigate("/team-lead");
      return;
    }

    if (username === "agent" && password === "we") {
      onLoginSuccess({ username, role: "agent" });
      setError("");
      navigate("/agent");
      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-panel login-panel--welcome">
          <div className="login-brand">
            <img className="login-logo" src={apricusLogo} alt="Apricus logo" />
          </div>
          <h2 className="login-welcome-title">Welcome</h2>
          <p className="login-welcome-text">
            Please log in with your authorized credentials.
          </p>
        </div>

        <div className="login-panel login-panel--form">
          <h1 className="login-title">Login to Your Account</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="username">
                Username
              </label>
              <input
                className="login-input"
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <input
                className="login-input"
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="login-forgot">
              <button className="login-forgot-link" type="button">
                Forgot password?
              </button>
            </div>

            {error ? <p className="login-error">{error}</p> : null}

            <button className="login-button" type="submit">
              Login
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
