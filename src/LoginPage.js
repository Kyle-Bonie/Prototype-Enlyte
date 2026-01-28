import './LoginPage.css';

function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-panel login-panel--welcome">
          <div className="login-brand">
            <div className="login-logo" aria-hidden="true" />
            <span className="login-brand-text">Enlyte Logo</span>
          </div>
          <h2 className="login-welcome-title">Welcome</h2>
          <p className="login-welcome-text">Please log in with your authorized credentials.</p>
        </div>

        <div className="login-panel login-panel--form">
          <h1 className="login-title">Login to Your Account</h1>
          <form className="login-form">
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
            />

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
            />

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
