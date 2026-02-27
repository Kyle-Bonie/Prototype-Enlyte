import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import apricusLogo from "./assets/ApricusLogo.png";
import { authAPI } from "./api/apiClient";

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await authAPI.login(username, password);

      onLoginSuccess({
        username: data.user.username,
        role: data.user.role === "Agent" ? "agent" : "teamLead",
      });

      if (data.user.role === "Agent") {
        navigate("/agent");
      } else {
        navigate("/team-lead");
      }
    } catch (err) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
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

            {error ? <p className="login-error">{error}</p> : null}

            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    style={{ animation: "spin 1s linear infinite" }}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
